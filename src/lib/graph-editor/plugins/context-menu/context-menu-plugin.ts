import { capitalizeWords } from '$utils/string';
import { type Setup } from '$graph-editor/setup/Setup';
import { _ } from '$lib/global/index.svelte';
import { NodeFactory } from '$graph-editor/editor';
import { Node, nodeRegistry } from '$graph-editor/nodes';
import { get } from 'svelte/store';
import wu from 'wu';
import type { SelectorEntity } from 'rete-area-plugin/_types/extensions/selectable';
import type { Position } from '$graph-editor/common';
import type { MenuItem } from './types';
import { clientToSurfacePos } from '$utils/html';
// Ensure all nodes are registered
import '../../nodes';
import type { Control, Socket } from '$graph-editor/socket';
import { XmlNode, type XmlConfig } from '$graph-editor/nodes/XML';
import {
	getSharedString,
	newLocalId,
	singular,
	XmlSchema,
	type XMLTypeTree
} from '@selenite/commons';
import type { XmlAttributeDefinition } from '$graph-editor/nodes/XML/types';
import { areTypesCompatible } from '../typed-sockets';
import type { SocketData } from 'rete-connection-plugin';
import { ContextMenu } from './context-menu.svelte';


export type NodeMenuItem<NC extends new (...params: unknown[]) => Node = new (...params: unknown[]) => Node> = {
	/** Label of the node. */
	label: string;
	/** Function that creates the node. */
	nodeClass: NC;
	params: ConstructorParameters<NC>[0];
	/** Menu path of the node. */
	path: string[];
	/** Search tags of the node. */
	tags: string[];
	/** Description of the node. */
	description: string;

	inputTypes: Node['inputTypes'];
	outputTypes: Node['outputTypes'];
};
type Ins = Record<string, Socket>;
type Outs = Record<string, Socket>;
type Controls = Record<string, Control>;
type State = Record<string, unknown>;
type Params = Record<string, unknown>;
export function nodeItem<
	I extends Ins,
	O extends Outs,
	C extends Controls,
	S extends State,
	P extends Params,
	N extends typeof Node<I, O, C, S, P>
>(item: NodeMenuItem<I, O, C, S, P, N>): NodeMenuItem {
	return item as NodeMenuItem;
}
export function xmlItem({
	label,
	xmlConfig
}: {
	label?: string;
	xmlConfig: XmlConfig;
}): NodeMenuItem<typeof Node> {
	return nodeItem({
		label: label ?? xmlConfig.xmlTag,
		nodeClass: XmlNode,
		params: { xmlConfig },
		path: ['XML'],
		tags: ['xml'],
		description: '',
		inputTypes: {},
		outputTypes: {}
	});
}

export function xmlNodeItems({
	schema,
	basePath = ['XML'],
	priorities
}: {
	schema: XmlSchema;
	basePath?: string[];
	priorities?: Record<string, Record<string, number>>;
}): NodeMenuItem[] {
	const res: Map<string, NodeMenuItem> = new Map();

	function parseTree(tree: XMLTypeTree, path: string[]) {
		for (const [name, children] of Object.entries(tree)) {
			const itemInRes = res.get(name);
			// Ensure node item has the shortest path possible
			if (itemInRes && itemInRes.path.length <= path.length) {
				continue;
			}
			const complexType = schema.complexTypes.get(name);
			if (complexType === undefined) {
				console.error('failed to access complex type', complexType);
				continue;
			}
			const parents = schema.parentsMap.get(complexType.name);
			let outLabel = complexType.name;
			if (parents && parents.length > 0) {
				const sharedParent = getSharedString(parents);

				if (parents.length > 1 && sharedParent.length > 0) {
					outLabel = sharedParent;
				} else if (parents.length === 1) {
					const parent = parents[0];
					const parentComplex = schema.complexTypes.get(parent);
					if (parentComplex && parentComplex.requiredChildren.length === 0) {
						outLabel = singular(parent);
					}
				} else {
					const parentsChildren = wu(parents)
						.map((p) => schema.complexTypes.get(p)?.childTypes)
						.filter((s) => s !== undefined)
						.map(getSharedString)
						.filter((s) => s.length > 0)
						.toArray();

					const sharedParentChildren = getSharedString(parentsChildren);
					// .flatten()

					if (sharedParentChildren.length > 0) {
						outLabel = sharedParentChildren;
					}
				}
			}
			const xmlConfig: XmlConfig = {
				complex: complexType,
				priorities,
				outLabel,
				xmlProperties: wu(complexType.attributes.values())
					.map(
						(attr) =>
							({
								name: attr.name,
								type: attr.type,
								required: attr.required
							}) as XmlAttributeDefinition
					)
					.toArray()
			};
			const xmlNode = new XmlNode({xmlConfig});
			res.set(name, {
				label: name,
				nodeClass: XmlNode,
				params: {
					xmlConfig
				},
				description: '',
				inputTypes: xmlNode.inputTypes,
				outputTypes: xmlNode.outputTypes,
				path,
				tags: []
			});
			if (children === 'recursive') {
				continue;
			}
			parseTree(children, [...path, name]);
		}
	}
	parseTree(schema.tree, basePath);
	// console.log([...res.values()])

	return [...res.values()];
}

export const baseNodeMenuItems: NodeMenuItem[] = [];
console.log("Setting up base node menu items", nodeRegistry)
for (const [id, nodeClass] of nodeRegistry.entries()) {
	if (nodeClass.visible !== undefined && !nodeClass.visible) continue;
	const pieces = id.split('.').map(capitalizeWords);

	/** Name of node in id. */
	const idName = pieces.at(-1)!;

	// Autogenerate menu path from id if unspecified
	if (nodeClass.path === undefined) {
		const path = pieces.slice(0, -1);
		nodeClass.path = path;
	}

	const node = new nodeClass();
	baseNodeMenuItems.push({
		label: node.label === undefined || node.label.trim() === '' ? idName : node.label,
		nodeClass: nodeClass as typeof Node,
		inputTypes: node.inputTypes,
		outputTypes: node.outputTypes,
		path: nodeClass.path,
		tags: nodeClass.tags ?? [],
		description: nodeClass.description ?? ''
	});
}
export function getMenuItemsFromNodeItems({
	factory,
	pos,
	nodeItems,
	action
}: {
	factory: NodeFactory;
	pos: Position;
	nodeItems: NodeMenuItem[];
	action?: (n: Node) => void;
}): MenuItem[] {
	console.log('getMenuItemsFromNodeItems', nodeItems);
	const editor = factory.getEditor();
	const area = factory.getArea();
	const res: MenuItem[] = [];

	for (const { description, label, path, tags, nodeClass, params } of nodeItems) {
		res.push({
			id: newLocalId(nodeClass.id.replaceAll('.', '-')),
			description,
			label,
			path,
			tags,
			action: async () => {
				const node = new nodeClass({ factory, ...params });
				await editor.addNode(node);
				const localPos = clientToSurfacePos({ pos, factory });
				await area?.translate(node.id, localPos);
				if (action) action(node);
			}
		});
	}
	return res;
}
export type ShowContextMenu = (params: {
	expand?: boolean;
	pos: Position;
	items: Partial<MenuItem>[];
	searchbar: boolean;
	onHide?: () => void;
}) => void;
export function contextMenuSetup({
	showContextMenu,
	additionalNodeItems
}: {
	showContextMenu: ShowContextMenu;
	additionalNodeItems?: NodeMenuItem[];
}): Setup {
	return {
		name: 'Context Menu',
		type: 'area',
		setup: ({ area, factory, editor }) => {
			let lastSelectedNodes: SelectorEntity[] = [];
			const connPlugin = factory.connectionPlugin
			if (!connPlugin) {
				console.warn('Connection plugin not found');
			} else {
				connPlugin.addPipe((context) => {
					if (context.type === 'pointermove' && ContextMenu.instance.visible) {
						return;
					}
					if (context.type !== 'connectiondrop') return context;
					// Type conversion is needed to work around the lack of
					// extensibility of ConnectionPlugin
					const {socket, initial, event, created} = context.data as {
						socket?: SocketData & {payload: Socket}
						initial: SocketData & {payload: Socket},
						event?: PointerEvent
						created: boolean
					};
					if (created || !event) return
					// Check if the pointer is over a socket
					// context.
					if (!socket) {
						const pos = { x: event.clientX, y: event.clientY };
						console.log("pos", pos)
						const items: NodeMenuItem[] = [];
						const anyItems: NodeMenuItem[] = [];
						const side = initial.side;
						const sourceSocket =
							initial.payload;
						for (const item of [...baseNodeMenuItems, ...additionalNodeItems || []]) {
							const types = side === 'output' ? item.inputTypes : item.outputTypes;
							for (const target of Object.values(types)) {
								if (item.nodeClass === XmlNode && !sourceSocket.type.startsWith('xmlElement') && sourceSocket.type !== "groupNameRef") continue;
								if (side === 'output' ? areTypesCompatible(sourceSocket, target) : areTypesCompatible(target, sourceSocket)) {
									(target.type === 'any' ? anyItems : items).push(item as NodeMenuItem);
									break;
								}
							}
						}
						showContextMenu({
							expand: true,
							pos,
							searchbar: true,
							items: getMenuItemsFromNodeItems({
								factory,
								pos,
								nodeItems: [...items, ...anyItems],
								action: (n) => {
									const matchingSocket = Object.entries(
										side === 'output' ? n.inputTypes : n.outputTypes
									).find(([k, target]) => {
										return side === 'output' ? areTypesCompatible(sourceSocket, target) : areTypesCompatible(target, sourceSocket);
									});
									if (!matchingSocket) {
										console.error("Can't find a valid key for the new node");
										return;
									}
									const newNodeKey = matchingSocket[0];
									const source = side === 'output' ? initial!.payload.node : n;
									const sourceOutput =
										side === 'output' ? initial!.key : newNodeKey;
									const target = side === 'output' ? n : initial!.payload.node;
									const targetInput =
										side === 'output' ? newNodeKey : initial!.key;

									editor
										.addNewConnection(source, sourceOutput, target, targetInput);
								}
							}),
							onHide: () => {
								console.debug("Dropping connection from context menu")
								connPlugin.drop();
							}
						});
						return;
					}
					return context;
				})
			}
			
			area.addPipe((context) => {
				// React to pointerdown and contextmenu events only
				if (!(['contextmenu', 'pointerdown'] as (typeof context.type)[]).includes(context.type)) {
					return context;
				}
				
				// Something about node selection, TODO: check what it actually does
				// if (context.type === 'pointerdown') {
				// 	const event = context.data.event;
				// 	const nodeDiv =
				// 		event.target instanceof HTMLElement
				// 			? event.target.classList.contains('node')
				// 				? event.target
				// 				: event.target.closest('.node')
				// 			: null;
				// 	if (
				// 		event.target instanceof HTMLElement &&
				// 		event.button === 2 &&
				// 		(event.target.classList.contains('node') || event.target.closest('.node')) !== null
				// 	) {
				// 		const entries = Array(...area.nodeViews.entries());

				// 		const nodeId = entries.find((t) => t[1].element === nodeDiv?.parentElement)?.[0];
				// 		if (!nodeId) return context;
				// 		// factory.selectableNodes?.select(nodeId, true);
				// 		// const selectedNodes = wu(selector.entities.values())
				// 		// 	.filter((t) => editor.getNode(t.id) !== undefined)
				// 		// 	.toArray();
				// 		// console.log('remember selected', selectedNodes);
				// 		// if (selectedNodes.length > 0) {
				// 		// 	lastSelectedNodes = selectedNodes;
				// 		// }
				// 	}
				// }

				// Handle context menu events
				if (context.type === 'contextmenu') {
					// Context menu on node
					if (context.data.context !== 'root') {
						if (!(context.data.context instanceof Node)) return context;
						console.debug('Context menu on node');
						// (factory as NodeFactory).select(context.data.context, {
						// 	accumulate: (factory as NodeFactory).selector.entities.size > 1
						// });
						showContextMenu({
							items: [
								{
									id: 'delete',
									label: 'Delete',
									description: 'Delete a node from the editor, removing its connections.',
									async action() {
										const node = context.data.context as Node;

										if (node.selected) {
											await (factory as NodeFactory).deleteSelectedElements();
										} else {
											await (factory as NodeFactory).removeNode(context.data.context);
										}
									},
									path: [],
									tags: ['delete', 'deletion']
								}
							],
							pos: { x: context.data.event.clientX, y: context.data.event.clientY },
							searchbar: false
						});
						context.data.event.preventDefault();
						context.data.event.stopImmediatePropagation();
						return;
					}
					// Context menu on editor
					context.data.event.preventDefault();
					console.debug('Context menu on editor');
					const variables: NodeMenuItem[] = [];
					for (const v of Object.values(get(editor.variables))) {
						// variables.push(
						// 	createNodeMenuItem({
						// 		label: v.name,
						// 		outTypes: [v.type],
						// 		menuPath: ['Variables'],
						// 		editorType: EditorType.XML,
						// 		addNode: ({}) => {
						// 			return new VariableNode({ factory, variableId: v.id });
						// 		}
						// 	})
						// );
					}

					const pos: Position = { x: context.data.event.clientX, y: context.data.event.clientY };
					const items: MenuItem[] = getMenuItemsFromNodeItems({
						factory,
						pos,
						nodeItems: [...baseNodeMenuItems, ...(additionalNodeItems || [])] as NodeMenuItem[]
					});

					// Spawn context menu
					showContextMenu({
						items,
						pos,
						searchbar: true
					});
				}
				return context;
			});
		}
	};
}
