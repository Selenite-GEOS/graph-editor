import type { NodeFactory } from './NodeFactory';
import type { NodeEditor, NodeEditorSaveData } from './NodeEditor';
import type { EditorExample } from '$graph-editor/examples';
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
