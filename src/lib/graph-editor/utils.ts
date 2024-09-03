import type { NodeEditorSaveData } from '$graph-editor/editor';
import type { StoredGraph } from './storage/types';
import type { Variable } from './variables';

export function isNodeEditorSaveData(a: unknown): a is NodeEditorSaveData {
	if (typeof a !== 'object' || a === null) return false;

	return (
		'nodes' in a && 'connections' in a && 'editorName' in a && typeof a.editorName === 'string'
	);
}

export const dragGraphType = 'selenite/graph';
export const dragVariableType = 'selenite/graph-variable';


export function onGraphDragStart(g: StoredGraph): (e: DragEvent) => void {
	document.body.style.userSelect = 'none';
	const removeSelectNode = () => {
		document.body.style.userSelect = '';
		document.removeEventListener('dragend', removeSelectNode);
	}
	document.addEventListener('dragend', removeSelectNode);
	return (e) => {
		e.dataTransfer?.setData(dragGraphType, JSON.stringify(g));
	}
}

export function isDraggedGraph(e: DragEvent): boolean {
	return e.dataTransfer?.types.includes(dragGraphType) ?? false;
}

export function getDraggedGraph(e: DragEvent): StoredGraph | undefined {
	const data = e.dataTransfer?.getData(dragGraphType);
	if (!data) return undefined;

	return JSON.parse(data);
}

export function variableDragStart(v: Variable) {
	return (e: DragEvent) => {
		e.dataTransfer?.setData(dragVariableType, v.id);
	}
}

export function isDraggedVariable(e: DragEvent): boolean {
	return e.dataTransfer?.types.includes(dragVariableType) ?? false;
}

export function getDraggedVariableId(e: DragEvent): string | undefined {
	return e.dataTransfer?.getData(dragVariableType);
}