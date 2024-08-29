import { Scope, NodeEditor as BaseNodeEditor } from 'rete';
import { Connection, Node } from '../nodes';
import { newLocalId } from '$utils';
import type { Variable } from '../variables';
import { get, writable, type Readable, type Writable } from 'svelte/store';
import { NodeFactory } from './NodeFactory.svelte';
import wu from 'wu';
import { _ } from '$lib/global/index.svelte';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { animationFrame, browser, type SaveData } from '@selenite/commons';
import type { Schemes } from '$graph-editor/schemes';

export type CommentSaveData = {
	id: string;
	text: string;
	links: string[];
};

export type NodeEditorSaveData = SaveData<NodeEditor>;

/**
 * A graph editor for visual programming.
 *
 * A low level class that manages nodes and connections.
 */
export class NodeEditor extends BaseNodeEditor<Schemes> {
	public factory?: NodeFactory;
	get area() {
		return this.factory?.getArea();
	}
	variables: Writable<Record<string, Variable>> = writable({});
	previewedNodes = new SvelteSet<Node>();

	// constructor() {
	// }
	setName(name: string) {
		this.graphName = name;
	}
	readonly name = 'Node Editor';
	#graphName = $state('New Graph');
	get graphName() {
		return this.#graphName;
	}
	set graphName(n) {
		this.#graphName = n.trim();
		this.onChangeNameListeners.forEach((listener) => listener(n));
	}
	nameStore: Readable<string> = {
		subscribe: (run, invalidate) => {
			this.addOnChangeNameListener(run);
			run(this.graphName);

			return () => {
				this.onChangeNameListeners.splice(
					this.onChangeNameListeners.findIndex((v) => v === run),
					1
				);
			};
		}
	};
	onChangeNameListeners: ((name: string) => void)[] = [];
	addOnChangeNameListener(listener: (name: string) => void) {
		this.onChangeNameListeners.push(listener);
	}

	id = newLocalId('node-editor');

	nodesMap = new SvelteMap<string, Node>();
	connectionsMap = new SvelteMap<string, Connection>();	

	get nodes() {
		return this.getNodes();
	}

	get connections() {
		return this.getConnections();
	}

	constructor() {
		super()
		// @ts-expect-error delete base class properties
		delete this.nodes;
		// @ts-expect-error delete base class properties
		delete this.connections;
	}

	/**
	 * Gets a node by id.
	 * @param id - id of the node
	 * @returns The node or undefined
	 */
	// @ts-expect-error
	getNode(id: string): Node | undefined {
		return this.nodesMap.get(id);
	}

	/**
	 * Gets all nodes.
	 * @returns An array of all nodes in the editor
	 */
	getNodes():  Node[] {
		return [...this.nodesMap.values()];
	}

	/**
	 * Gets a connection by id.
	 * @param id - id of the connection
	 * @returns The connection or undefined
	 */
	// @ts-expect-error
	getConnection(id: string): Connection | undefined {
		return this.connectionsMap.get(id);
	}

	/**
	 * Gets all connections.
	 * @returns An array of all connections in the editor
	 */
	getConnections(): Connection[] {
		return [...this.connectionsMap.values()];
	}

	/**
	 * Returns whether the editor has a node with the given id.
	 * @param id - id of the node to check for
	 */
	hasNode(id: string): boolean;
	/**
	 * Returns whether the editor has a node.
	 * @param node - node to check for
	 */
	hasNode(node: Node): boolean;
	hasNode(ref: string | Node) {
		if (typeof ref === 'string') {
			return this.nodesMap.has(ref);
		} else {
			return this.nodesMap.has(ref.id);
		}
	}

	/**
	 * Returns whether the editor has a connection with the given id.
	 * @param id - id of the connection to check for
	 */
	hasConnection(id: string): boolean;
	/**
	 * Returns whether the editor has a connection.
	 * @param connection - connection to check for
	 */
	hasConnection(connection: Connection): boolean;
	hasConnection(ref: string | Connection) {
		if (typeof ref === 'string') {
			return this.connectionsMap.has(ref);
		} else {
			return this.connectionsMap.has(ref.id);
		}
	}

	/**
	 * Adds a node to the editor.
	 * @param node - node to add
	 * @returns Whether the node was added
	 */
	async addNode(node: Node): Promise<boolean> {
		if (this.nodesMap.has(node.id)) {
			console.error('Node has already been added', node);
			return false;
		}
		if (!(await this.emit({ type: 'nodecreate', data: node }))) return false;

		this.nodesMap.set(node.id, node);
		await this.emit({ type: 'nodecreated', data: node });
		return true;
	}

	/**
	 * Adds a connection to the editor.
	 * @param conn - connection to add
	 * @returns Whether the connection was added
	 */
	async addConnection(conn: Connection): Promise<boolean> {
		if (this.hasConnection(conn)) {
			console.error('Connection has already been added', conn.id);
			return false;
		}

		if (!(await this.emit({ type: 'connectioncreate', data: conn }))) return false;

		this.connectionsMap.set(conn.id, conn);
		conn.factory = this.factory;

		await this.emit({ type: 'connectioncreated', data: conn });
		return true;
	}

	async addExecConnection(source: Node, target: Node): Promise<boolean> {
		try {
		return await this.addConnection(new Connection(source, 'exec', target, 'exec'));
		} catch (e) {
			console.error('Error adding connection', e);
			return false;
		}
	}

	async addNewConnection(
		source: Node | string,
		sourceOutput: string,
		target: Node | string,
		targetInput: string
	): Promise<Connection | undefined> {
		const source_ = typeof source === 'string' ? this.getNode(source) : source;
		const target_ = typeof target === 'string' ? this.getNode(target) : target;
		if (!source_ || !target_) {
			console.error('Node not found');
			return undefined;
		}
		try {
			const conn = new Connection(source_, sourceOutput, target_, targetInput);
			conn.factory = this.factory;
		 await this.addConnection(new Connection(source_, sourceOutput, target_, targetInput));
			return conn;
		} catch (e) {
			console.error(
				'Error adding connection',
				source_.label + (('-' + source_.name) ?? ''),
				sourceOutput,
				target_.label + (('-' + source_.name) ?? ''),
				targetInput,
				e
			);
			return undefined;
		}
	}

	async removeNode(id: string): Promise<boolean>;
	async removeNode(node: Node): Promise<boolean>;
	async removeNode(ref: string | Node) {
		let node: Node | undefined;
		if (typeof ref === 'string') {
			node = this.nodesMap.get(ref);
		} else {
			node = ref;
		}
		if (!node) {
			console.error("Couldn't find node to remove", node);
			return false;
		}

		if (!(await this.emit({ type: 'noderemove', data: node }))) return false;

		this.nodesMap.delete(node.id);
		this.previewedNodes.delete(node);

		await this.emit({ type: 'noderemoved', data: node });
		return true;
	}

	async removeConnection(id: string): Promise<boolean>;
	async removeConnection(conn: Connection): Promise<boolean>;
	async removeConnection(ref: string | Connection) {
		let conn: Connection | undefined;
		if (typeof ref === 'string') {
			conn = this.connectionsMap.get(ref);
		} else {
			conn = ref;
		}
		if (!conn) {
			console.error("Couldn't find connection to remove", conn);
			return false;
		}

		if (!(await this.emit({ type: 'connectionremove', data: conn }))) return false;

		this.connectionsMap.delete(conn.id);

		await this.emit({ type: 'connectionremoved', data: conn });
		return true;
	}

	clearing = $state(false)

	async clear() {
		if (this.nodesMap.size === 0) return true;
		if (!(await this.emit({ type: 'clear' }))) {
			await this.emit({ type: 'clearcancelled' });
			return false;
		}
		this.clearing = true;
		if (browser) {
			document.body.style.cursor = 'wait';
			await animationFrame(2)
		}

		for (const connection of this.connectionsMap.values()) await this.removeConnection(connection);
		for (const node of this.nodesMap.values()) await this.removeNode(node);

		if (browser) {
			document.body.style.cursor = '';

		}

		await this.emit({ type: 'cleared' });
		this.clearing = false;
		return true;
	}

	toJSON() {
		const variables = get(this.variables);

		for (const v of Object.values(variables)) {
			variables[v.id] = { ...v, highlighted: false };
		}

		return {
			editorName: this.graphName,
			graphName: this.graphName,
			variables,
			previewedNodes: Array.from(this.previewedNodes).map((node) => node.id),
			nodes: this.getNodes().map((node) => node.toJSON()),
			connections: this.getConnections().map((conn) => conn.toJSON()),
			comments: this.factory?.comment
				? wu(this.factory?.comment?.comments.values())
						.map((t) => {
							return {
								id: t.id,
								text: t.text,
								links: t.links
							};
						})
						.toArray()
				: []
		};
	}
}
