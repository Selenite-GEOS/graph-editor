import { capitalizeWords } from '$utils/string';
import { type Setup } from '$graph-editor/setup/Setup';
import { _ } from '$lib/global/index.svelte';
import { NodeFactory } from '$graph-editor/editor';
import { Node, nodeRegistry, type NodeConstructor, type NodeParams } from '$graph-editor/nodes';
import { get } from 'svelte/store';
import wu from 'wu';
import type { SelectorEntity } from 'rete-area-plugin/_types/extensions/selectable';
import type { Position } from '$graph-editor/common';
import type { MenuItem } from './types';
import { clientToSurfacePos } from '$utils/html';
// Ensure all nodes are registered
import {} from '$graph-editor/nodes';
import type { Control, Socket } from '$graph-editor/socket';
import { XmlNode, type XmlConfig, type XmlNodeParams } from '$graph-editor/nodes/XML';
import {
	getSharedString,
	newLocalId,
	singular,
	splitCamelCase,
	XmlSchema,
	type ComplexType,
	type XMLTypeTree
} from '@selenite/commons';
import type { XmlAttributeDefinition } from '$graph-editor/nodes/XML/types';
import type { DataType } from '../typed-sockets';
import { intersection, union } from 'lodash-es';

// export class ContextMenuSetup extends SetupClass {
// 	selectedNodes: SelectorEntity[] = [];
// 	async setup(
// 		editor: NodeEditor,
// 		area: AreaPlugin<Schemes, AreaExtra>,
// 		__factory: NodeFactory,
// 		geos: GeosDataContext,
// 		geosContextV2: NewGeosContext
// 	): Promise<void> {
// 		const xmlSchema = (await new GetXmlSchemaStore().fetch()).data?.geos.xmlSchema;

// 		const newMoonItems: IBaseMenuItem[] = [];

// 		if (xmlSchema) {
// 			const moonItems: MoonMenuItem[] = [];
// 			const complexTypesWithName: string[] = [];
// 			const complexTypes: string[] = [];

// 			for (const complexType of xmlSchema.complexTypes) {
// 				if (complexType === PendingValue) continue;
// 				const name = complexType.name.match(/^(.*)Type$/)?.at(1);
// 				if (!name) throw new Error(`Invalid complex type name: ${complexType.name}`);

// 				const hasNameAttribute = complexType.attributes.some((attr) => attr.name === 'name');
// 				if (hasNameAttribute) complexTypesWithName.push(name);

// 				complexTypes.push(name);
// 				const xmlNodeAction: (factory: NodeFactory) => Node = (factory) =>
// 					new XmlNode({
// 						label: name,
// 						factory: factory,

// 						xmlConfig: {
// 							noName: !hasNameAttribute,
// 							childTypes: complexType.childTypes.map((childType) => {
// 								const childName = childType.match(/^(.*)Type$/)?.at(1);
// 								if (!childName) return childType;
// 								return childName;
// 							}),
// 							xmlTag: name,
// 							outData: {
// 								name: name,
// 								type: `xmlElement:${name}`,
// 								socketLabel: name
// 							},

// 							xmlProperties: complexType.attributes.map<XmlAttributeDefinition>((attr) => {
// 								console.log(attr);

// 								const simpleType = geosContextV2.geosSchema.simpleTypes.get(attr.type);
// 								if (!simpleType) console.warn(`Simple type ${attr.type} not found`);

// 								return {
// 									name: attr.name,
// 									required: attr.required,
// 									options: simpleType?.enum ?? null,
// 									pattern: simpleType?.pattern,
// 									type: attr.type,
// 									controlType: 'text'
// 								};
// 							})
// 						}
// 					});
// 				const typesPaths = geos.typesPaths;
// 				if (typesPaths)
// 					newMoonItems.push(
// 						createNodeMenuItem({
// 							label: name,
// 							menuPath: (get(typesPaths) as Record<string, string[]>)[name],
// 							addNode: xmlNodeAction,
// 							inTypes: complexType.childTypes.map((childType) => {
// 								const childName = childType.match(/^(.*)Type$/)?.at(1);
// 								if (!childName) return childType;
// 								return childName;
// 							}),
// 							outTypes: [name]
// 						})
// 					);
// 				moonItems.push({
// 					label: name,
// 					outType: name,
// 					inChildrenTypes: complexType.childTypes.map((childType) => {
// 						const childName = childType.match(/^(.*)Type$/)?.at(1);
// 						if (!childName) return childType;
// 						return childName;
// 					}),
// 					action: xmlNodeAction
// 				});
// 				pushMenuItem(items, ['XML', complexType.name], () => xmlNodeAction(__factory), __factory);
// 			}
// 			const getNameNodeItem: MoonMenuItem = {
// 				action: (factory) => new GetNameNode({ factory }),
// 				inChildrenTypes: complexTypesWithName,
// 				label: 'Get Name',
// 				outType: 'string'
// 			};
// 			const makeArrayNodeItem: MoonMenuItem = {
// 				action: (factory) => new MakeArrayNode({ factory }),
// 				inChildrenTypes: [],
// 				label: 'Make Array',
// 				outType: 'array'
// 			};
// 			const stringNodeItem: MoonMenuItem = {
// 				action: (factory) => new StringNode({ factory }),
// 				inChildrenTypes: [],
// 				label: 'String',
// 				outType: 'string'
// 			};
// 			const downloadSchemaItem: MoonMenuItem = {
// 				action: (factory) => new DownloadNode({ factory }),
// 				inChildrenTypes: ['Problem'],
// 				label: 'Download',
// 				outType: ''
// 			};
// 			moonMenuItemsStore.set([
// 				stringNodeItem,
// 				getNameNodeItem,
// 				makeArrayNodeItem,
// 				downloadSchemaItem,
// 				...moonItems
// 			]);
// 			newMoonItems.push(
// 				createNodeMenuItem({
// 					label: 'Get Name',
// 					addNode: getNameNodeItem.action,
// 					inTypes: complexTypesWithName,
// 					outTypes: ['groupNameRef'],
// 					description: 'Get the name of the GEOS element',
// 					tags: ['name', 'get']
// 				}),
// 				createNodeMenuItem({
// 					label: 'String',
// 					addNode: stringNodeItem.action,
// 					inTypes: [],
// 					outTypes: ['string'],
// 					description: 'Create a string',
// 					tags: ['string', 'create', 'basic'],
// 					menuPath: ['String']
// 				}),
// 				createNodeMenuItem({
// 					label: 'Display',
// 					addNode: (factory) => new DisplayNode({ factory }),
// 					inTypes: ['*'],
// 					tags: ['display', 'data', 'vizualization'],
// 					description: 'Display the input',
// 					menuPath: ['I/O']
// 				}),
// 				createNodeMenuItem({
// 					label: 'Select',
// 					addNode: (factory) => new SelectNode({ factory }),
// 					inTypes: ['*'],
// 					outTypes: ['*'],
// 					tags: ['select', 'choice']
// 				}),
// 				createNodeMenuItem({
// 					label: 'Format',
// 					addNode: (factory) => new FormatNode({ factory }),
// 					inTypes: ['*'],
// 					outTypes: ['groupNameRef'],
// 					tags: ['format', 'string']
// 				}),
// 				createNodeMenuItem({
// 					label: 'Make Array',
// 					addNode: makeArrayNodeItem.action,
// 					inTypes: ['*'],
// 					outTypes: ['array'],
// 					description: 'Make an array from the input',
// 					tags: ['array', 'make'],
// 					menuPath: ['Array']
// 				}),
// 				createNodeMenuItem({
// 					label: 'Not',
// 					addNode: (factory) => new NotNode({ factory }),
// 					inTypes: ['boolean'],
// 					outTypes: ['boolean'],
// 					description: 'Invert the input',
// 					tags: ['boolean', 'invert', 'not', '!'],
// 					menuPath: ['Boolean']
// 				}),
// 				createNodeMenuItem({
// 					label: 'Merge Arrays',
// 					addNode: (factory) => new MergeArrays({ factory }),
// 					inTypes: ['*'],
// 					outTypes: ['array'],
// 					description: 'Make an array from the input',
// 					tags: ['array', 'make'],
// 					menuPath: ['Array']
// 				}),
// 				createNodeMenuItem({
// 					label: 'Download',
// 					addNode: downloadSchemaItem.action,
// 					inTypes: [...geosContextV2.geosSchema.complexTypes.keys()],
// 					description: 'Download the problem as xml',
// 					tags: ['download', 'xml'],
// 					menuPath: ['I/O']
// 				})
// 			);

// 			newMoonItemsStore.set([...newMoonItems]);
// 		}

// 		const contextMenu = new ContextMenuPlugin<Schemes>({
// 			items: Presets.classic.setup(getMenuArray(items))
// 		});

// 		area.addPipe((context) => {
// 			if ((['pointermove', 'render', 'rendered'] as (typeof context.type)[]).includes(context.type))
// 				return context;
// 			const selector = __factory.selector;
// 			if (!selector) throw new ErrorWNotif("Selector doesn't exist");
// 			if (context.type === 'pointerdown') {
// 				const event = context.data.event;
// 				const nodeDiv =
// 					event.target instanceof HTMLElement
// 						? event.target.classList.contains('node')
// 							? event.target
// 							: event.target.closest('.node')
// 						: null;
// 				if (
// 					event.target instanceof HTMLElement &&
// 					event.button === 2 &&
// 					(event.target.classList.contains('node') || event.target.closest('.node')) !== null
// 				) {
// 					const entries = Array(...area.nodeViews.entries());

// 					const nodeId = entries.find((t) => t[1].element === nodeDiv?.parentElement)?.[0];
// 					if (!nodeId) return context;
// 					__factory.selectableNodes?.select(nodeId, true);
// 					const selectedNodes = wu(selector.entities.values())
// 						.filter((t) => editor.getNode(t.id) !== undefined)
// 						.toArray();
// 					// console.log('remember selected', selectedNodes);
// 					if (selectedNodes.length > 0) {
// 						this.selectedNodes = selectedNodes;
// 					}
// 				}
// 			}
// 			if (context.type === 'contextmenu') {
// 				// Context menu on node
// 				if (context.data.context !== 'root') {
// 					if (!(context.data.context instanceof Node)) return context;

// 					context.data.event.preventDefault();
// 					context.data.event.stopImmediatePropagation();
// 					return;
// 				}
// 				// Context menu on editor
// 				context.data.event.preventDefault();
// 				const variables: INodeMenuItem[] = [];

// 				for (const v of Object.values(get(editor.variables))) {
// 					variables.push(
// 						createNodeMenuItem({
// 							label: v.name,
// 							outTypes: [v.type],
// 							menuPath: ['Variables'],
// 							editorType: EditorType.XML,
// 							addNode: ({ factory }) => {
// 								return new VariableNode({ factory: __factory, variableId: v.id });
// 							}
// 						})
// 					);
// 				}

// 				spawnMoonMenu({
// 					items: [...variables, ...newMoonItems],
// 					searchbar: true,
// 					pos: { x: context.data.event.clientX, y: context.data.event.clientY }
// 				});
// 				moonMenuFactoryStore.set(__factory);
// 			}
// 			return context;
// 		});

// 		// area.use(contextMenu);
// 	}
// }

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
	const res: Map<string, NodeMenuItem<typeof XmlNode>> = new Map();

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

export const baseNodeMenuItems: NodeMenuItem<typeof Node>[] = [];
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
	nodeItems: NodeMenuItem<typeof Node>[];
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
			const connPlugn = factory.connectionPlugin
			if (!connPlugn) {
				console.warn('Connection plugin not found');
			} else {
				connPlugn.addPipe((context) => {
					if (context.type !== 'connectiondrop') return context;
					console.debug(context);
					// Check if the pointer is over a socket
					// context.
					if (!socketData) {
						const pos = { x: event.clientX, y: event.clientY };
						const items: NodeMenuItem[] = [];
						const anyItems: NodeMenuItem[] = [];
						const side = this.lastPickedSockedData.side;
						const { datastructure: droppedDatastructure, type: droppedType } =
							this.lastPickedSockedData.payload;
						for (const item of baseNodeMenuItems) {
							const types = side === 'output' ? item.inputTypes : item.outputTypes;
							for (const [k, { type, datastructure }] of Object.entries(types)) {
								if (
									type === droppedType ||
									(type === 'any' && datastructure === droppedDatastructure)
								) {
									(type === 'any' ? anyItems : items).push(item);
									break;
								}
							}
						}
						showContextMenu({
							expand: true,
							pos,
							searchbar: true,
							items: getMenuItemsFromNodeItems({
								factory: this.factory,
								pos,
								nodeItems: [...items, ...anyItems],
								action: (n) => {
									const matchingSocket = Object.entries(
										side === 'output' ? n.inputTypes : n.outputTypes
									).find(([k, { type, datastructure }]) => {
										if (
											type === droppedType ||
											(type === 'any' && datastructure === droppedDatastructure)
										) {
											return true;
										}
										return false;
									});
									if (!matchingSocket) {
										console.error("Can't find a valid key for the new node");
										return;
									}
									const newNodeKey = matchingSocket[0];
									const source = side === 'output' ? this.lastPickedSockedData!.payload.node : n;
									const sourceOutput =
										side === 'output' ? this.lastPickedSockedData!.key : newNodeKey;
									const target = side === 'output' ? n : this.lastPickedSockedData!.payload.node;
									const targetInput =
										side === 'output' ? newNodeKey : this.lastPickedSockedData!.key;

									this.factory
										.getEditor()
										.addNewConnection(source, sourceOutput, target, targetInput);
								}
							}),
							onHide: () => {
								this.drop();
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
				if (context.type === 'pointerdown') {
					const event = context.data.event;
					const nodeDiv =
						event.target instanceof HTMLElement
							? event.target.classList.contains('node')
								? event.target
								: event.target.closest('.node')
							: null;
					if (
						event.target instanceof HTMLElement &&
						event.button === 2 &&
						(event.target.classList.contains('node') || event.target.closest('.node')) !== null
					) {
						const entries = Array(...area.nodeViews.entries());

						const nodeId = entries.find((t) => t[1].element === nodeDiv?.parentElement)?.[0];
						if (!nodeId) return context;
						// factory.selectableNodes?.select(nodeId, true);
						// const selectedNodes = wu(selector.entities.values())
						// 	.filter((t) => editor.getNode(t.id) !== undefined)
						// 	.toArray();
						// console.log('remember selected', selectedNodes);
						// if (selectedNodes.length > 0) {
						// 	lastSelectedNodes = selectedNodes;
						// }
					}
				}

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
						nodeItems: [...baseNodeMenuItems, ...(additionalNodeItems || [])]
					});

					// Spawn context menu
					showContextMenu({
						items,
						pos,
						searchbar: true
					});
					// spawnMoonMenu({
					// 	items: [...variables, ...baseMenuItems],
					// 	searchbar: true,
					// 	pos: { x: context.data.event.clientX, y: context.data.event.clientY }
					// });
					// moonMenuFactoryStore.set(__factory);
				}
				return context;
			});
		}
	};
}
