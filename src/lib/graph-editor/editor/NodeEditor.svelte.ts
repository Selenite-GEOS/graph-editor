import { NodeEditor as BaseNodeEditor } from 'rete';
import type { Schemes } from '../schemes';
import { Connection, Node, type ConnectionSaveData, type NodeSaveData } from '../nodes';
import { newLocalId } from '$utils';
import type { Variable } from '../variables';
import { get, writable, type Readable, type Writable } from 'svelte/store';
import { NodeFactory } from './NodeFactory';
import wu from 'wu';
import { _, ErrorWNotif } from '$lib/global/index.svelte';

export type CommentSaveData = {
	id: string;
	text: string;
	links: string[];
};

export type NodeEditorSaveData = {
	nodes: NodeSaveData[];
	connections: ConnectionSaveData[];
	editorName: string;
	variables: Record<string, Variable>;
	comments?: CommentSaveData[];
};

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

	// constructor() {
	// }
	setName(name: string) {
		this.graphName = name;
	}
	protected readonly name = 'Node Editor';
	#graphName = $state('New Graph')
	get graphName() {
		return this.#graphName;
	}
	set graphName(n) {
		this.#graphName = n.trim() !== '' ? n : get(_)('editor.default-name');
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
	id = newLocalId('node-editor');

	// @ts-expect-error
	getNode(id: string): Node | undefined {
		return super.getNode(id);
	}

	async addExecConnection(source: Node, target: Node): Promise<boolean> {
		return await this.addConnection(new Connection(source, 'exec', target, 'exec'));
	}

	async addNewConnection(
		source: Node | string,
		sourceOutput: string,
		target: Node | string,
		targetInput: string
	): Promise<boolean> {
		
		const source_ = typeof source === 'string' ? this.getNode(source) : source;
		const target_ = typeof target === 'string' ? this.getNode(target) : target;
		if (!source_ || !target_) {
			console.error('Node not found');
			return false;
		}
		return await this.addConnection(new Connection(source_, sourceOutput, target_, targetInput));
	}

	async addConnection(data: Connection): Promise<boolean> {
		data.factory = this.factory;
		return await super.addConnection(data);
	}

	addOnChangeNameListener(listener: (name: string) => void) {
		this.onChangeNameListeners.push(listener);
	}

	toJSON(): NodeEditorSaveData {
		const variables = get(this.variables);

		for (const v of Object.values(variables)) {
			variables[v.id] = { ...v, highlighted: false };
		}

		return {
			editorName: this.graphName,
			variables,
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
