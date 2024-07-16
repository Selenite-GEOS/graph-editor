import { Node, path, registerNode, type NodeParams } from '$graph-editor/nodes/Node.svelte';
import type { ExecSocket, Socket } from '$graph-editor/socket';

@registerNode('io.Log')
@path('I/O')
export class LogNode extends Node<
	{ message: Socket<'string'>; exec: Socket<'exec'> },
	{ exec: ExecSocket }
> {
	constructor(params: NodeParams = {}) {
		super({ label: 'Log', ...params });
		this.pythonComponent.addCode('print($(message))');
		this.pythonComponent.setCodeTemplateGetter(
			() =>
				`
if (rank == 0):
    {{this}}
{{exec}}
`
		);
		this.addInExec();
		this.addOutExec();
		this.addInData('message', {
			label: 'Message',
			type: 'string'
		});
	}

	async execute(
		input: 'exec',
		forward: (output: 'exec') => unknown,
		forwardExec?: boolean
	): Promise<void> {
		const msg = await this.getDataWithInputs('message');
		console.log(`Log: ${msg}`);
		this.factory?.notifications.show({
			title: 'Log',
			message: typeof msg === 'string' ? msg : JSON.stringify(msg)
		});
		super.execute(input, forward);
	}
}
