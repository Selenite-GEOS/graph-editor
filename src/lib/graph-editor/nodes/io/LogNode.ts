import { Node, path, registerNode, type NodeParams } from '$graph-editor/nodes/Node.svelte';
import type { ExecSocket, Socket } from '$graph-editor/socket';

@registerNode('io.Log')
@path('I/O')
export class LogNode extends Node<
	{ message: Socket<'string', 'scalar'>; time:Socket<'number', 'scalar'>, exec: Socket<'exec'> },
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
			type: 'string',
		});
		this.addInData('time', {
			label: 'Time',
			isLabelDisplayed: true,
			type: 'number',
			initial: 3
		});
	}

	async execute(
		input: 'exec',
		forward: (output: 'exec') => unknown,
		forwardExec?: boolean
	): Promise<void> {
		const msg = await this.getDataWithInputs('message');
		const time = await this.getDataWithInputs('time')
		console.log(`Log: ${msg}`);
		this.factory?.notifications.show({
			title: 'Log',
			message: typeof msg === 'string' ? msg : JSON.stringify(msg),
			autoClose: time * 1000
		});
		super.execute(input, forward);
	}
}
