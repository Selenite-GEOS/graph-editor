import type { NodeFactory } from '$rete';
import type { NodeEditor, NodeEditorSaveData } from '$rete/NodeEditor';
import type { EditorExample } from '$rete/example/types';
import type { Writable } from 'svelte/store';

export type EditorView = {
	key: string;
	example?: EditorExample;
	label: string;
	saveData?: NodeEditorSaveData;
};

export enum EditorType {
	XML,
	All,
	PyWorkflow
}

export type EditorContext = {
	activeEditor: Writable<NodeEditor | undefined>;
	getActiveFactory: () => NodeFactory | undefined;
	getEditorViewport: () => HTMLElement | undefined;
};

export type DragData = { type: 'macroNode'; graphId: string };
