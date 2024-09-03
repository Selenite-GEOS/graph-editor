import { type Setup } from '$graph-editor/setup/Setup';
import { _ } from '$lib/global/index.svelte';
import { NodeFactory } from '$graph-editor/editor';
import { Node, nodeRegistry } from '$graph-editor/nodes';
import type { SelectorEntity } from 'rete-area-plugin/_types/extensions/selectable';
import type { Position } from '$graph-editor/common';
import type { MenuItem } from './types';
import { clientToSurfacePos } from '$utils/html';
// Ensure all nodes are registered
import '../../nodes';
import type { Control, Socket } from '$graph-editor/socket';
import { VariableNode, XmlNode, type XmlConfig } from '$graph-editor/nodes/XML';
import {
	localId,
	XmlSchema,
	type XMLTypeTree,
	capitalizeWords
} from '@selenite/commons';
import { areTypesCompatible } from '../typed-sockets';
import type { SocketData } from 'rete-connection-plugin';
import { ContextMenu } from './context-menu.svelte';

export type NodeMenuItem<NC extends typeof Node = typeof Node
> = {
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
			const xmlConfig: XmlConfig = {
				complex: complexType,
				priorities
			};
			const xmlNode = new XmlNode({ xmlConfig });
			xmlNode.addAllOptionalAttributes();
			res.set(name, {
				label: name,
				nodeClass: XmlNode,
				params: {
					schema,
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

export let baseNodeMenuItems: NodeMenuItem[] = [];
const cleanup = $effect.root(() => {
	$effect(() => {
		const res: NodeMenuItem[] = [];
		console.debug('Setting up base node menu items', nodeRegistry.size, nodeRegistry);
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
			res.push({
				label: node.label === undefined || node.label.trim() === '' ? idName : node.label,
				nodeClass: nodeClass as typeof Node,
				inputTypes: node.inputTypes,
				outputTypes: node.outputTypes,
				path: nodeClass.path,
				tags: nodeClass.tags ?? [],
				description: nodeClass.description ?? ''
			});
		}
		baseNodeMenuItems = res;
	});
});

if (import.meta.hot) {
	import.meta.hot.on('vite:beforeUpdate', cleanup);
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
			id: localId(nodeClass.id.replaceAll('.', '-')),
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

export function createNodeMenuItem(params: Partial<Omit<NodeMenuItem, 'nodeClass' | 'params'>> & {nodeClass: NodeMenuItem['nodeClass'], params: NodeMenuItem['params']} ): NodeMenuItem {
	return {
		tags: [],
		path: [],
		label: 'Node Item',
		description: '',
		inputTypes: {},
		outputTypes: {},
		...params,
	}
}

export type ShowContextMenu = (params: {
	expand?: boolean;
	pos: Position;
	/** Whether to sort the items. Default to false. */
	sort?: boolean;
	items: Partial<MenuItem>[];
	searchbar?: boolean;
	onHide?: () => void;
	target?: HTMLElement;
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
			const connPlugin = factory.connectionPlugin;
			if (!connPlugin) {
				console.warn('Connection plugin not found');
			}
			// Connection drop context menu
			else {
				connPlugin.addPipe((context) => {
					if (context.type === 'pointermove' && ContextMenu.instance.visible) {
						return;
					}
					if (context.type !== 'connectiondrop') return context;
					// Type conversion is needed to work around the lack of
					// extensibility of ConnectionPlugin
					const { socket, initial, event, created } = context.data as {
						socket?: SocketData & { payload: Socket };
						initial: SocketData & { payload: Socket };
						event?: PointerEvent;
						created: boolean;
					};
					if (created || !event) return;
					// Check if the pointer is over a socket
					// context.
					if (!socket) {
						const pos = { x: event.clientX, y: event.clientY };
						console.log('pos', pos);
						const items: NodeMenuItem[] = [];
						const anyItems: NodeMenuItem[] = [];
						const side = initial.side;
						const sourceSocket = initial.payload;
						for (const item of [...baseNodeMenuItems, ...(additionalNodeItems || [])]) {
							const types = side === 'output' ? item.inputTypes : item.outputTypes;
							for (const target of Object.values(types)) {
								if (
									item.nodeClass === XmlNode &&
									!sourceSocket.type.startsWith('xmlElement') &&
									sourceSocket.type !== 'groupNameRef'
								)
									continue;
								if (
									side === 'output'
										? areTypesCompatible(sourceSocket, target)
										: areTypesCompatible(target, sourceSocket)
								) {
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
									const initialSide = initial.side;
									// If connection comes from an input, move the node to the left of the dropped
									// connection position

									if (n instanceof XmlNode && initialSide === 'output') {
										n.addAllOptionalAttributes();
									}
									const matchingSocket = Object.entries(
										initialSide === 'output' ? n.inputTypes : n.outputTypes
									).find(([k, target]) => {
										return initialSide === 'output'
											? areTypesCompatible(sourceSocket, target)
											: areTypesCompatible(target, sourceSocket);
									});
									if (!matchingSocket) {
										console.error("Can't find a valid key for the new node");
										return;
									}
									const newNodeKey = matchingSocket[0];
									const source = initialSide === 'output' ? initial!.payload.node : n;
									const sourceOutput = initialSide === 'output' ? initial!.key : newNodeKey;
									const target = initialSide === 'output' ? n : initial!.payload.node;
									const targetInput = initialSide === 'output' ? newNodeKey : initial!.key;
									if (n instanceof XmlNode && initialSide === 'output') {
										n.removeAllOptionalAttributes();
										if (n.optionalXmlAttributes.has(targetInput)) {
											n.addOptionalAttribute(targetInput);
										}
									}
									editor.addNewConnection(source, sourceOutput, target, targetInput);
									const view = area.nodeViews.get(n.id);
									// factory.connectionPlugin?.lastPickedSockedData
									if (!view) {
										throw new Error('Node view not found');
									}
									let { x, y } = view.position;
									// Base action already moves the node to the right of the dropped connection
									// position, so we need to move it back by width
									// We use setTimeout to wait for the node to get its width
									const initialRect = initial.payload.element?.getBoundingClientRect();
									if (!initialRect) throw new Error('Initial rect not found');
									setTimeout(() => {
											if (initialRect.top > event.clientY)
												y = y - n.height / 1.5;
											else {
												y = y - n.height / 3.5;
											}
											area.translate(n.id, { x: x - (initialSide === 'input' ? n.width : 0), y });
										});
								}
							}),
							onHide: () => {
								console.debug('Dropping connection from context menu');
								connPlugin.drop();
							}
						});
						return;
					}
					return context;
				});
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
						const node = context.data.context as Node;
						// (factory as NodeFactory).select(context.data.context, {
						// 	accumulate: (factory as NodeFactory).selector.entities.size > 1
						// });
						showContextMenu({
							items: [
								{
									id: 'preview',
									get label() {
										return node.previewed ? 'Stop Preview' : 'Preview';
									},
									action() {
										node.previewed = !node.previewed;
									}
								},
								{
									id: 'delete',
									label: 'Delete',
									description: 'Delete a node from the editor, removing its connections.',
									async action() {
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
					for (const v of Object.values(editor.variables)) {
						variables.push(
							createNodeMenuItem({
								nodeClass: VariableNode as typeof Node,
								label: v.name,
								description: `Get the variable: '${v.name}'.`,
								params: {variableId: v.id},
								path: ['Variables'],
								tags: ['get']
							})
						);
					}

					const pos: Position = { x: context.data.event.clientX, y: context.data.event.clientY };
					const items: MenuItem[] = getMenuItemsFromNodeItems({
						factory,
						pos,
						nodeItems: [...variables, ...[...baseNodeMenuItems, ...(additionalNodeItems || [])].sort((a, b) => (a.path.join('') + a.label).localeCompare(b.path.join('') + b.label) )] as NodeMenuItem[]
					});
					console.debug('settin hey', baseNodeMenuItems);
					// Spawn context menu
					showContextMenu({
						items,
						pos,
						sort: true,
						searchbar: true
					});
				}
				return context;
			});
		}
	};
}
