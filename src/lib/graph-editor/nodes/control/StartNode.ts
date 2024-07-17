import { Node, registerNode, type NodeParams } from '../Node.svelte';
import { ButtonControl, ExecSocket } from '$graph-editor/socket';
import { notifications } from '$graph-editor/plugins/notifications';

@registerNode('control.start')
export class StartNode extends Node<{}, { exec: ExecSocket }> {
	running = false;
	constructor(params: NodeParams = {}) {
		super({ label: 'Start', ...params });
		this.addOutExec();
		this.addControl(
			'playBtn',
			new ButtonControl({
				label: 'Play',
				onClick: async () => {
					if (this.running) {
						console.warn('Node is already running');
						notifications.show({
							color: 'yellow',
							title: 'Warning',
							message: 'Graph is already executing.'
						});
						return;
					}
					this.running = true;
					let waitPromise = this.getWaitForChildrenPromises('exec');
					this.factory?.getControlFlowEngine().execute(this.id);
					await waitPromise;
					this.running = false;
				}
			})
		);
	}
	execute(_: never, forward: (output: 'exec') => void) {
		forward('exec');
	}
}
