import type { NodeEditorSaveData } from '$graph-editor/NodeEditor';
import { BroadcastChannel } from 'broadcast-channel';

export class EditMacroNodeChannel extends BroadcastChannel<{
	graph: NodeEditorSaveData;
}> {
	constructor() {
		super('edit-macro-node');
	}
}
