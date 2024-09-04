import type { NodeEditor, NodeFactory } from '$graph-editor';
import { getContext } from 'svelte';

export function getEditorFromContext(): { editor?: NodeEditor; factory?: NodeFactory } {
	const editorContext = getContext('editor') as {
		activeFactory?: NodeFactory;
		factory?: NodeFactory;
		activeEditor?: NodeEditor;
		editor?: NodeEditor;
	};

    return {
        get editor() {
            return editorContext.activeEditor || editorContext.editor;
        },
        get factory() {
            return editorContext.activeFactory || editorContext.factory || editorContext.activeEditor?.factory || editorContext.editor?.factory;
        }
    }
}
