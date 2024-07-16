import { Node, registerNode, type NodeParams } from '../Node.svelte';
import { ButtonControl, ExecSocket } from '$graph-editor/socket';

@registerNode('control.start')
export class StartNode extends Node<{}, {exec: ExecSocket}> {
	constructor(params: NodeParams = {}) {
		super({ label: 'Start', ...params });
		this.addOutExec();
		this.addControl(
			'playBtn',
			new ButtonControl('Play', async () => {
				this.factory?.getControlFlowEngine().execute(this.id);
			})
		);
	}
	execute(_: never, forward: (output: 'exec') => void) {
		forward('exec');
	}
}
