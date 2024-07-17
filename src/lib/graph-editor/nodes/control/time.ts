import type { ExecSocket, Socket } from '$graph-editor/socket';
import { Node, path, registerNode, type NodeParams } from '$Node';
import { tick } from 'svelte';
import { getLeavesFromOutput } from '../utils';

@registerNode('control.time.Sleep')
@path('Control')
export class SleepNode extends Node<
	{ time: Socket<'number', 'scalar'>; exec: ExecSocket },
	{ exec: ExecSocket }
> {
	constructor(params: NodeParams = {}) {
		super({ label: 'Sleep', ...params });
		this.addInExec();
		this.addOutExec();
		this.addInData('time', { type: 'number', initial: 0.5 });
	}

	async execute(
		input: 'exec',
		forward: (output: 'exec') => unknown,
		forwardExec?: boolean
	): Promise<void> {
        const time = await this.getDataWithInputs('time');
		this.needsProcessing = true;
        await tick()
        this.needsProcessing = false;
		await new Promise((resolve) => setTimeout(resolve, time * 1000));
		const leavesFromLoopExec = getLeavesFromOutput(this, 'exec');
		const promises = this.getWaitPromises(leavesFromLoopExec);
		forward('exec');
		await Promise.all(promises);
        super.execute(input, forward, false);
	}
}
