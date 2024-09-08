import { AreaExtensions, AreaPlugin } from 'rete-area-plugin';
import type { NodeEditor, NodeEditorSaveData } from './NodeEditor.svelte';
import type { AreaExtra } from '../area/AreaExtra';
import type { Schemes } from '../schemes';
import { ControlFlowEngine, DataflowEngine } from 'rete-engine';
import { ExecSocket } from '../socket/ExecSocket';
import { structures } from 'rete-structures';
import { Connection, Node, nodeRegistry, type NodeSaveData } from '../nodes/Node.svelte';
import { readable, type Readable, type Writable } from 'svelte/store';
import { PythonDataflowEngine } from '$graph-editor/engine/PythonDataflowEngine';
import type { MakutuClassRepository } from '$lib/backend-interaction/types';
import { newLocalId } from '$utils';
import { ErrorWNotif, _ } from '$lib/global/index.svelte';
import type { AutoArrangePlugin } from 'rete-auto-arrange-plugin';
import type { CommentPlugin } from '$graph-editor/plugins/CommentPlugin';
import { persisted } from 'svelte-persisted-store';
import type { HistoryPlugin } from '$graph-editor/plugins/history';
import { defaultConnectionPath, type ConnectionPathType } from '$graph-editor/connection-path';
import { tick } from 'svelte';
import type { NotificationsManager } from '$graph-editor/plugins/notifications';
import { downloadJSON, Rect, XmlSchema, type SaveData } from '@selenite/commons';
import { Modal, modals } from '@selenite/commons';
import type {
	BaseComponent,
	ComponentParams,
	ComponentSupportInterface
} from '$graph-editor/components';
import { NodeLayout } from './NodeLayout';
import {
	NodeSelection as NodeSelector,
	type SelectOptions,
	type SelectorEntity
} from './NodeSelection.svelte';
import { NodeStorage } from '$graph-editor/storage';
import { CodeIntegration } from './CodeIntegration.svelte';
import type { ConnectionPlugin } from '$graph-editor/setup/ConnectionSetup';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { StoredGraph } from '$graph-editor/storage/types';
import { NodeSearch } from './NodeSearch.svelte';
import { ElementRect } from 'runed';

function createDataflowEngine() {
	return new DataflowEngine<Schemes>(({ inputs, outputs }) => {
		return {
			inputs: () =>
				Object.entries(inputs)
					.filter(([_, input]) => input && !(input.socket instanceof ExecSocket))
					.map(([name]) => name),
			outputs: () =>
				Object.entries(outputs)
					.filter(([_, output]) => output && !(output.socket instanceof ExecSocket))
					.map(([name]) => name)
		};
	});
}

function createPythonDataflowEngine() {
	return new PythonDataflowEngine<Schemes>(({ inputs, outputs }) => {
		return {
			inputs: () =>
				Object.entries(inputs)
					.filter(([_, input]) => input && !(input.socket instanceof ExecSocket))
					.map(([name]) => name),
			outputs: () =>
				Object.entries(outputs)
					.filter(([_, output]) => output && !(output.socket instanceof ExecSocket))
					.map(([name]) => name)
		};
	});
}

function createControlflowEngine() {
	return new ControlFlowEngine<Schemes>(({ inputs, outputs }) => {
		return {
			inputs: () =>
				Object.entries(inputs)
					.filter(([_, input]) => input && input.socket instanceof ExecSocket)
					.map(([name]) => name),
			outputs: () =>
				Object.entries(outputs)
					.filter(([_, output]) => output && output.socket instanceof ExecSocket)
					.map(([name]) => name)
		};
	});
}

// type ParamsConstraint = [Record<string, unknown> & { factory: NodeFactory }, ...unknown[]];
type WithFactory<T extends Record<string, unknown>> = T & { factory: NodeFactory };
type WithoutFactory<T> = Omit<T, 'factory'>;

// export function registerNode() {}

export class NodeFactory implements ComponentSupportInterface {
	components: BaseComponent[] = [];
	addComponentByClass<P extends Record<string, unknown>, C extends BaseComponent>(
		componentClass: new (params: P) => C,
		params: Omit<P, keyof ComponentParams>
	): C {
		const component = new componentClass({ ...(params as P), owner: this });
		this.components.push(component);
		return component;
	}
	minimapEnabled = $state(true);
	public notifications: NotificationsManager = {
		show: (notif) => {
			let res = '';
			if (notif.title) res += notif.title + ':';
			console.log(res, notif.message);
		},
		error(notif) {
			let res = '';
			if (notif.title) res += notif.title + ':';
			console.error(res, notif.message);
		},
		info(notif) {
			let res = '';
			if (notif.title) res += notif.title + ':';
			console.info(res, notif.message);
		},
		success(notif) {
			let res = '';
			if (notif.title) res += notif.title + ':';
			console.log('Succes', res, notif.message);
		},
		warn(notif) {
			let res = '';
			if (notif.title) res += notif.title + ':';
			console.warn(res, notif.message);
		},
		hide() {}
	};
	public readonly connectionPathType: Writable<ConnectionPathType> = persisted(
		'connectionPathType',
		defaultConnectionPath
	);

	surfaceRect = $state(new Rect());

	lastSelectedNode = $state<Node>();
	editor: NodeEditor;
	get previewedNodes() {
		return this.editor.previewedNodes;
	}

	modalStore: Readable<Modal> = readable(Modal.instance);

	private state: Map<string, unknown> = new Map();

	public id = newLocalId('node-factory');

	useState<T = unknown>(
		id: string,
		key: string,
		value?: T
	): { value: T; get: () => T; set: (value: T) => void } {
		const stateKey = id + '_' + key;
		if (!this.state.has(stateKey)) this.state.set(stateKey, value);
		const state = this.state;
		return {
			get: () => this.state.get(stateKey) as T,
			set: (value: T) => this.state.set(stateKey, value),
			get value() {
				return state.get(stateKey) as T;
			},
			set value(v: T) {
				state.set(stateKey, v);
			}
		};
	}

	getState<T>(id: string, key: string, initial?: T): T {
		const stateKey = id + '_' + key;
		if (!this.state.has(stateKey)) this.state.set(stateKey, initial);
		return this.state.get(stateKey) as T;
	}

	setState(id: string, key: string, value: unknown) {
		this.state.set(id + '_' + key, value);
	}

	lastAddedNode?: Node;
	async addNode<T extends Node, Params = Record<string, unknown>>(
		nodeClass: new (params: Params) => T,
		params: WithoutFactory<Params> = {} as WithoutFactory<Params>
	): Promise<T> {
		const paramsWithFactory: Params = { ...params, factory: this } as Params;

		await this.editor.addNode(new nodeClass(paramsWithFactory));
		if (!this.lastAddedNode) throw new Error('lastAddedNode is undefined');
		return this.lastAddedNode as T;
	}

	async addNodes(nodes: (Node | SaveData<Node>)[]) {
		await this.bulkOperation(async () => {
			for (const node of nodes) {
				await this.editor.addNode(
					node instanceof Node ? node : await Node.fromJSON(node, { factory: this })
				);
			}
		});
	}

	getNodes(): Node[] {
		return this.editor.getNodes();
	}

	get storage() {
		return NodeStorage.instance;
	}

	readonly pythonDataflowEngine: PythonDataflowEngine<Schemes> = createPythonDataflowEngine();

	async loadNode(nodeSaveData: NodeSaveData): Promise<Node> {
		const nodeClass = nodeRegistry.get(nodeSaveData.type);
		if (nodeClass) {
			const node = new nodeClass({
				...nodeSaveData.params,
				factory: this,
				initialValues: nodeSaveData.inputControlValues,
				state: nodeSaveData.state,
				id: nodeSaveData.id
			});
			if (node.initializePromise) {
				await node.initializePromise;
				if (node.afterInitialize) node.afterInitialize();
			}

			// node.setState({ ...node.getState(), ...nodeSaveData.state });
			node.applyState();
			// for (const key in nodeSaveData.inputControlValues) {
			// 	const inputControl = node.inputs[key]?.control;
			// 	if (
			// 		inputControl instanceof ClassicPreset.InputControl ||
			// 		inputControl instanceof InputControl
			// 	) {
			// 		console.log("key", key)
			// 		inputControl.value = nodeSaveData.inputControlValues[key];
			// 	}
			// }

			for (const key of nodeSaveData.selectedInputs) {
				node.selectInput(key);
			}

			for (const key of nodeSaveData.selectedOutputs) {
				node.selectOutput(key);
			}

			await this.editor.addNode(node);
			if (nodeSaveData.position && this.area) {
				this.area.translate(nodeSaveData.id, {
					x: nodeSaveData.position.x,
					y: nodeSaveData.position.y
				});
			} else if (this.area) {
				console.error("Node doesn't have a position", nodeSaveData);
			}
			return node;
		} else {
			console.debug('Node class not found', nodeSaveData);
			throw new Error(`Node class ${nodeSaveData.type} not found`);
		}
	}
	effetRootCleanup: (() => void) | undefined;
	private cleanup() {
		this.effetRootCleanup?.();
	}

	destroyArea() {
		this.destroy();
	}

	destroy() {
		console.log('Destroying area.');
		this.area?.destroy();
		this.cleanup();
		for (const c of this.components) {
			c.cleanup?.();
		}
	}

	/**
	 * Moves the view to the center of the nodes, with a zoom such that all nodes are visible.
	 * @param nodes - Nodes to center the view on. If not provided, all nodes are used.
	 */
	centerView(nodes?: Node[]) {
		if (!this.area) return;
		return AreaExtensions.zoomAt(this.area, nodes ?? this.editor.getNodes());
	}

	async openGraphForm(defaultName = 'New Graph') {
		const MacroBlockForm = (await import('$graph-editor/storage/MacroBlockForm.svelte')).default;
		const existingGraph = await NodeStorage.getGraph(this.editor.graphId);

		const action = existingGraph ? 'Update' : 'Create';
		const editor = this.editor;
		modals.show({
			component: MacroBlockForm,
			props: { editor: this.editor, existingGraph },
			get title() {
				return `${action} ${editor.graphName.trim().length === 0 ||  (!existingGraph && editor.graphName === defaultName) ? 'macro-block' : editor.graphName}`;
			},
			buttons: [
				'cancel',
				{
					label: action,
					type: 'submit'
				}
			],
			response: async (r) => {
				if (!r || !(typeof r === 'object') || !('id' in r))
					throw new ErrorWNotif('Graph form response not found');
				const g = r as StoredGraph;
				console.log('Saving graph to storage', g);
				try {
					await NodeStorage.saveGraph(g);

					this.notifications.success({
						title: 'Graph Storage',
						message: 'Graph saved!'
					});
				} catch (e) {
					console.error(e);
					this.notifications.error({
						title: 'Graph Storage',
						message: 'Failed to save graph.'
					});
				}
			}
		});
	}

	/**
	 * Loads a graph from a save.
	 * @param editorSaveData - Save data to load.
	 */
	async loadGraph(editorSaveData: NodeEditorSaveData) {
		await this.bulkOperation(async () => {
			console.log(`Load graph : ${editorSaveData.editorName} (id: ${editorSaveData.id})`);
			await this.editor.clear();
			this.editor.graphId = editorSaveData.id;
			// Load variables
			for (const v of Array.isArray(editorSaveData.variables)
				? editorSaveData.variables
				: Object.values(editorSaveData.variables)) {
				this.editor.variables[v.id] = v;
			}
			this.editor.setName(editorSaveData.editorName);
			for (const nodeSaveData of editorSaveData.nodes) {
				try {
					const node = await this.loadNode(nodeSaveData);
					if (editorSaveData.previewedNodes?.includes(node.id)) {
						this.editor.previewedNodes.add(node);
					}
				} catch (e) {
					console.error('Failed to load node', e);
					const name = nodeSaveData.state?.name ?? nodeSaveData.type;
					this.notifications.error({
						message: `Failed to load node ${name}.`,
						title: 'Graph Loading'
					});
				}
			}

			for (const commentSaveData of editorSaveData.comments ?? []) {
				if (!this.comment) {
					console.warn('No comment plugin');
					return;
				}
				console.log('load comment ', commentSaveData.text);
				try {
					this.comment.addFrame(commentSaveData.text, commentSaveData.links, {
						id: commentSaveData.id
					});
				} catch (e) {
					console.error('Failed to load comment', e);
				}
			}

			editorSaveData.connections.forEach(async (connectionSaveData) => {
				try {
					const source = this.editor.getNode(connectionSaveData.source);
					if (!source) {
						console.error('Source node not found for connection', connectionSaveData);
						throw new ErrorWNotif('Source node not found for connection');
					}
					const target = this.editor.getNode(connectionSaveData.target);
					if (!target) {
						console.error('Target node not found for connection', connectionSaveData);
						throw new ErrorWNotif('Target node not found for connection.');
					}
					const conn = new Connection(
						source,
						connectionSaveData.sourceOutput,
						target,
						connectionSaveData.targetInput
					);
					conn.id = connectionSaveData.id;
					conn.factory = this;
					await this.editor.addConnection(conn);
				} catch (e) {
					console.error('Failed to load connection', e);
				}
			});
			setTimeout(() => {
				if (this.area) AreaExtensions.zoomAt(this.area, this.editor.getNodes());
			});
		});
	}
	#area = $state<AreaPlugin<Schemes, AreaExtra>>();

	get area() {
		return this.#area;
	}
	transform = $state({ zoom: 1 });
	set area(area: AreaPlugin<Schemes, AreaExtra> | undefined) {
		if (area === this.#area) return;
		this.#area = area;
		this.#area?.addPipe((ctx) => {
			if (ctx.type === 'zoomed') {
				this.transform.zoom = ctx.data.zoom;
			}
			if (ctx.type === 'translated' || ctx.type === 'zoomed') {
				this.surfaceRect = this.#area?.area.content.holder.getBoundingClientRect() ?? new Rect();
			}
			return ctx;
		});
	}

	public readonly makutuClasses?: MakutuClassRepository;

	public readonly dataflowEngine = createDataflowEngine();
	private readonly controlflowEngine = createControlflowEngine();
	// public selector?: AreaExtensions.Selector<SelectorEntity>;
	selector: NodeSelector;
	get selection() {
		return this.selector;
	}

	search = this.addComponentByClass(NodeSearch, {});
	// public accumulating?: ReturnType<typeof AreaExtensions.accumulateOnCtrl>;
	// public selectableNodes?: ReturnType<typeof AreaExtensions.selectableNodes>;
	public arrange?: AutoArrangePlugin<Schemes>;
	public history: HistoryPlugin<Schemes> | undefined;
	connectionPlugin?: ConnectionPlugin;
	public comment: CommentPlugin<Schemes, AreaExtra> | undefined;
	#isDataflowEnabled = true;
	#xmlSchemas = new SvelteMap<string, XmlSchema>();
	get xmlSchemas() {
		return this.#xmlSchemas;
	}

	reactivateDataflowTimeout: NodeJS.Timeout | null = null;

	/**
	 * Nodes in the editor.
	 */
	get nodes() {
		return this.editor.getNodes();
	}
	/**
	 * Connections in the editor.
	 */
	get connections() {
		return this.editor.getConnections();
	}
	/**
	 * Executes callback without running dataflow engines.
	 *
	 * It is useful to execute multiple operations without unnecessarily running dataflow engines.
	 * @param callback Callback to execute
	 */
	async bulkOperation(callback: () => void | Promise<void>) {
		this.#isDataflowEnabled = false;
		try {
			await callback();
		} catch (e) {
			console.error('Bulk operation error', e);
		}
		if (this.reactivateDataflowTimeout) clearTimeout(this.reactivateDataflowTimeout);
		this.reactivateDataflowTimeout = setTimeout(() => {
			this.reactivateDataflowTimeout = null;
			this.#isDataflowEnabled = true;
			this.dataflowEngine.reset();
			this.runDataflowEngines();
		}, 100);
	}

	/**
	 * Removes all nodes and connections from the editor.
	 */
	async clear() {
		await this.bulkOperation(async () => {
			await this.editor.clear();
		});
	}

	layout: NodeLayout;

	codeIntegration: CodeIntegration;

	constructor(params: {
		editor: NodeEditor;
		area?: AreaPlugin<Schemes, AreaExtra>;
		makutuClasses?: MakutuClassRepository;
		arrange?: AutoArrangePlugin<Schemes>;
		history?: HistoryPlugin<Schemes>;
		comment?: CommentPlugin<Schemes, AreaExtra>;
		accumulating?: ReturnType<typeof AreaExtensions.accumulateOnCtrl>;
		xmlSchemas?: Record<string, XmlSchema | undefined>;
	}) {
		const { editor, area, makutuClasses, arrange, xmlSchemas = {} } = params;

		this.comment = params.comment;
		// this.accumulating = params.accumulating;
		this.history = params.history;
		this.layout = this.addComponentByClass(NodeLayout, {});
		// this.selector = selector;
		this.selector = this.addComponentByClass(NodeSelector, {});
		this.codeIntegration = this.addComponentByClass(CodeIntegration, {});
		this.area = area;
		this.arrange = arrange;
		this.makutuClasses = makutuClasses;
		this.editor = editor;
		this.editor.factory = this;

		for (const [key, schema] of Object.entries(xmlSchemas)) {
			if (schema) this.#xmlSchemas.set(key, schema);
		}
		editor.use(this.dataflowEngine);
		editor.use(this.controlflowEngine);
		editor.use(this.pythonDataflowEngine);

		// Assign connections to nodes
		editor.addPipe((context) => {
			if (context.type === 'nodecreated') {
				this.lastAddedNode = context.data;
			}

			if (context.type !== 'connectioncreated' && context.type !== 'connectionremoved')
				return context;
			const conn = context.data;
			const sourceNode = editor.getNode(conn.source);
			const targetNode = editor.getNode(conn.target);
			if (targetNode) {
				this.pythonDataflowEngine.reset(targetNode.id);
				this.resetDataflow(targetNode);
			}
			const socket = sourceNode?.outputs[conn.sourceOutput]?.socket;
			const outgoingConnections =
				socket instanceof ExecSocket || socket?.type == 'exec'
					? (sourceNode?.outgoingExecConnections ?? {})
					: (sourceNode?.outgoingDataConnections ?? {});

			const ingoingConnections =
				socket instanceof ExecSocket || socket?.type == 'exec'
					? (targetNode?.ingoingExecConnections ?? {})
					: (targetNode?.ingoingDataConnections ?? {});

			if (context.type === 'connectioncreated') {
				if (!sourceNode || !targetNode) {
					console.error('Connection created node not found', conn);
					return context;
				}
				if (!(conn.sourceOutput in outgoingConnections))
					outgoingConnections[conn.sourceOutput] = [];
				if (!(conn.targetInput in ingoingConnections)) ingoingConnections[conn.targetInput] = [];
				outgoingConnections[conn.sourceOutput].push(conn);
				ingoingConnections[conn.targetInput].push(conn);
			} else if (context.type === 'connectionremoved') {
				if (targetNode && targetNode.onRemoveIngoingConnection)
					targetNode.onRemoveIngoingConnection(conn);
				if (conn.sourceOutput in outgoingConnections) {
					const outgoingIndex: number = outgoingConnections[conn.sourceOutput]?.findIndex(
						(c) => c.id == conn.id
					);
					if (outgoingIndex === -1) throw new ErrorWNotif("Couldn't find outgoing connection");
					outgoingConnections[conn.sourceOutput].splice(outgoingIndex, 1);
					if (outgoingConnections[conn.sourceOutput].length === 0)
						delete outgoingConnections[conn.sourceOutput];
				}
				if (conn.targetInput in ingoingConnections) {
					const ingoingIndex = ingoingConnections[conn.targetInput]?.findIndex(
						(c) => c.id == conn.id
					);
					if (ingoingIndex === -1) throw new ErrorWNotif("Couldn't find ingoing connection");
					ingoingConnections[conn.targetInput].splice(ingoingIndex, 1);
					if (ingoingConnections[conn.targetInput].length === 0)
						delete ingoingConnections[conn.targetInput];
				}
			}

			return context;
		});
	}

	commentSelectedNodes(params: { text?: string } = {}): void {
		console.log('factory:commentSelectedNodes');
		if (!this.comment) {
			console.warn('No comment plugin');
			return;
		}
		const nodes = this.selector.nodes;
		if (!nodes) return;
		this.comment.addFrame(
			params.text,
			nodes.map((node) => node.id),
			{ editPrompt: true }
		);
	}

	/** Delete all selected elements */
	async deleteSelectedElements(): Promise<void> {
		console.debug('Delete selected elements.');
		const selector = this.selector;
		const editor = this.getEditor();

		// const allComments = wu(selector.entities.values()).every(({ label }) => label === 'comment');
		// for (const { id, label } of selector.entities.values()) {
		// 	switch (label) {
		// 		case 'comment':
		// 			const comment = this.comment?.comments.get(id);
		// 			if (!comment) throw new ErrorWNotif('Comment not found');
		// 			const commentText = comment.text;
		// 			const links = comment.links;
		// 			const commentId = comment.id;
		// 			const redo = () => {
		// 				this.comment?.delete(id);
		// 			};
		// 			if (allComments)
		// 				this.history?.add({
		// 					redo,
		// 					undo: () => {
		// 						this.comment?.addFrame(commentText, links, { id: commentId });
		// 					}
		// 				});
		// 			redo();
		// 			// this.comment?.delete(id);
		// 			break;
		// 	}
		// }
		// this.history?.separate();

		console.debug('removing', selector.typedEntities);
		for (const {
			entity: { id },
			type
		} of selector.typedEntities) {
			switch (type) {
				case 'connection':
					if (editor.getConnection(id)) await editor.removeConnection(id);
					break;
				case 'node':
					const node = editor.getNode(id);
					if (!node) continue;
					for (const conn of node.getConnections()) {
						if (editor.getConnection(conn.id)) await editor.removeConnection(conn.id);
					}
					await editor.removeNode(id);
					break;
				case 'comment':
					this.comment?.delete(id);
					break;
				default:
					console.warn(`Delete: Unknown label ${type}`);
			}
		}
		this.selector.unselectAll();
		// this.history?.separate();
	}

	/**
	 * Removes a node from the editor, as well as its connections.
	 * @param target node or node id
	 */
	async removeNode(target: string | Node) {
		let node: Node;
		if (typeof target === 'string') {
			const attempt = this.editor.getNode(target);
			if (!attempt) {
				console.warn("Can't remove, node not found");
				return;
			}
			node = attempt;
		} else {
			node = target;
		}
		for (const conn of node.getConnections()) {
			if (this.editor.getConnection(conn.id)) await this.editor.removeConnection(conn.id);
		}
		await this.editor.removeNode(node.id);
	}

	enable() {
		Node.activeFactory = this;
	}

	disable() {
		Node.activeFactory = undefined;
	}

	getNode(id: string): Node | undefined {
		return this.editor.getNode(id);
	}

	create<T extends Node>(type: new () => T): T {
		return new type();
	}

	getEditor(): NodeEditor {
		return this.editor;
	}

	getControlFlowEngine(): ControlFlowEngine<Schemes> {
		return this.controlflowEngine;
	}

	getArea(): AreaPlugin<Schemes, AreaExtra> | undefined {
		return this.area;
	}

	resetSuccessors(node: Node) {
		structures(this.editor)
			.successors(node.id)
			.nodes()
			.forEach((n) => this.dataflowEngine.reset(n.id));
	}

	downloadGraph() {
		downloadJSON(this.editor.graphName, this.editor);
	}

	loadFromFile() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = async () => {
			if (!input.files) return;
			const file = input.files[0];
			const reader = new FileReader();
			reader.onload = async () => {
				const data = reader.result as string;
				try {
					const json = JSON.parse(data);
					await this.loadGraph(json);
				} catch (e) {
					console.error('Failed to load graph', e);
				}
			};
			reader.readAsText(file);
		};
		input.click();
	}

	lastSearchNodeIndex = -1;
	/**
	 * Finds a node whose label or name matches the query.
	 * Repeated calls will cycle through the nodes.
	 * @param query
	 * @returns found node or undefined
	 */
	findNode(query: string): Node | undefined {
		console.log('mozza', this.lastSearchNodeIndex);
		query = query.toLowerCase();
		let nodes = this.editor.getNodes();
		const m = Math.min(this.lastSearchNodeIndex + 1, nodes.length);
		console.log('m', m);
		nodes = [nodes.slice(m), nodes.slice(0, m)].flat();
		console.log('mozza nodes', nodes);
		const resIndex = nodes.findIndex((n) => {
			return (
				n.label.toLowerCase().includes(query) || (n.name && n.name.toLowerCase().includes(query))
			);
		});
		this.lastSearchNodeIndex = resIndex === -1 ? -1 : (resIndex + m) % nodes.length;
		return resIndex !== -1 ? nodes[resIndex] : undefined;
	}

	focusNode(node?: Node): void {
		if (!node) {
			console.warn('Tried to focus an undefined node.');
			return;
		}
		if (this.area) AreaExtensions.zoomAt(this.area, [node], { scale: undefined });
	}
	focusNodes(nodes?: Node[], options: AreaExtensions.ZoomAt = {}): void {
		if (this.area) AreaExtensions.zoomAt(this.area, nodes ?? this.editor.getNodes(), options);
	}

	select(entity: SelectorEntity, options: SelectOptions = {}) {
		this.selector.select(entity, options);
	}

	selectConnection(id: string) {
		const conn = this.editor.getConnection(id);
		if (!conn) {
			console.warn('selectConnection: Connection not found', id);
			return;
		}
		this.selector.select(conn);
	}

	selectAll() {
		this.selector.selectAll();
	}

	unselectAll() {
		this.selector.unselectAll();
	}

	dataflowCache = new SvelteMap<Node, Record<string, unknown>>();

	async runDataflowEngines() {
		if (!this.#isDataflowEnabled) {
			console.warn('Dataflow engines are disabled');
			return;
		}
		await tick();
		console.debug('Running dataflow engines');
		try {
			this.editor
				.getNodes()
				// .filter((n) => n instanceof AddNode || n instanceof DisplayNode)
				.forEach(async (n) => {
					try {
						await this.dataflowEngine.fetch(n.id);
					} catch (e) {
						const err = e as Error;
						if (err.message === 'cancelled') return;
						console.error(e);
					}
					this.dataflowEngine.cache.get(n.id)?.then((res) => {
						// console.log('Dataflow engine finished', n.label, res);
						this.dataflowCache.set(n, res);
					});
					n.needsProcessing = false;
				});
		} catch (e) {
			console.error('Dataflow engine cancelled', e);
		}
	}

	async resetDataflow(node?: Node) {
		if (!this.#isDataflowEnabled) return;
		if (node) {
			if (this.dataflowCache.has(node)) this.dataflowEngine.reset(node.id);
		} else {
			this.dataflowEngine.reset();
		}
		await this.runDataflowEngines();
	}
}
