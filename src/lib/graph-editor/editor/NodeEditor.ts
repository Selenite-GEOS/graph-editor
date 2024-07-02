import { NodeEditor as BaseNodeEditor } from 'rete';
import type { Schemes } from '../schemes';
import { Connection, Node, type ConnectionSaveData, type NodeSaveData } from '../nodes';
import { newLocalId } from '$utils';
import type { Variable } from '../variables';
import { get, writable, type Readable, type Writable } from 'svelte/store';
import { NodeFactory } from './NodeFactory';
import wu from 'wu';
import { _ } from '$lib/global';

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

export class NodeEditor extends BaseNodeEditor<Schemes> {
	public factory?: NodeFactory;
	variables: Writable<Record<string, Variable>> = writable({});

	// constructor() {
	// }
	setName(name: string, triggerListeners = true) {
		this.name = name.trim() !== '' ? name : get(_)('editor.default-name');
		if (triggerListeners) this.onChangeNameListeners.forEach((listener) => listener(this.name));
	}
	name = 'New Editor';
	nameStore: Readable<string> = {
		subscribe: (run, invalidate) => {
			this.addOnChangeNameListener(run);
			run(this.name);

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
		source = typeof source === 'string' ? this.getNode(source) : source;
		target = typeof target === 'string' ? this.getNode(target) : target;
		return await this.addConnection(new Connection(source, sourceOutput, target, targetInput));
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
			nodes: this.getNodes().map((node) => node.toJSON()),
			connections: this.getConnections().map((conn) => conn.toJSON()),
			editorName: this.name,
			variables,
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
