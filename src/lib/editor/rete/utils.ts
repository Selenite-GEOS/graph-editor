import type { NodeEditorSaveData } from './NodeEditor';

export function isNodeEditorSaveData(a: unknown): a is NodeEditorSaveData {
	if (typeof a !== 'object' || a === null) return false;

	return (
		'nodes' in a && 'connections' in a && 'editorName' in a && typeof a.editorName === 'string'
	);
}
