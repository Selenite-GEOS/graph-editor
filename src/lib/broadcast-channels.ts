import type { NodeEditorSaveData } from '$rete/NodeEditor';
import { BroadcastChannel } from 'broadcast-channel';

export class EditMacroNodeChannel extends BroadcastChannel<{
	graph: NodeEditorSaveData;
}> {
	constructor() {
		super('edit-macro-node');
	}
}
