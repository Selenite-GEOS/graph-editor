import { Node } from '../Node';
import { notifications } from '@mantine/notifications';
import { getLeavesFromOutput } from '../utils';
import type { NodeFactory } from '../../editor/NodeFactory';

export class TimeLoopNode extends Node {
	currentTime?: number;

	constructor({ factory }: { factory: NodeFactory }) {
		// super('Time Loop', { factory, height: 440, width: 200 });
		super({ label: 'Time Loop', factory, height: 440, width: 200 });
		// TODO: implement display progress

		this.addInExec();

		this.addInData({
			name: 'start',
			displayName: 'Start',
			socketLabel: 'Start',
			type: 'number',
			control: {
				type: 'number',
				options: {
					initial: 0,
					label: 'Start'
				}
			}
		});

		this.addInData({
			name: 'end',
			displayName: 'End',
			socketLabel: 'End',
			type: 'number',
			control: {
				type: 'number',
				options: {
					initial: 2,
					label: 'End'
				}
			}
		});
		this.addInData({
			name: 'step',
			displayName: 'Step',
			socketLabel: 'Step',
			type: 'number',
			control: {
				type: 'number',
				options: {
					initial: 0.01,
					label: 'Step'
				}
			}
		});
		this.addInData({
			name: 'displayProgress',
			displayName: 'Display Progress',
			type: 'boolean',
			control: {
				type: 'checkbox',
				options: {
					label: 'Display Progress',
					initial: true
				}
			}
		});
		this.addOutExec('loop', 'Loop');
		this.addOutData({
			name: 'time',
			displayName: 'Time',
			socketLabel: 'Time',
			type: 'number'
		});
		this.addOutExec('done', 'Done', true);

		this.pythonComponent.addVariables('t');
		this.pythonComponent.addDynamicOutput('time');
		this.pythonComponent.setDataCodeGetter('time', () => '$(t)');
		this.pythonComponent.setCodeTemplateGetter(() => {
			return `
$(t) = $(start)
while $(t) < $(end):
    {{loop}}
    $(t) += $(step)
{{done}}
`;
		});
	}

	override async execute(
		input: string,
		forward: (output: string) => unknown,
		forwardExec?: boolean
	): Promise<void> {
		const inputs = await this.fetchInputs();
		const displayProgress = this.getData<'checkbox'>('displayProgress', inputs);
		const start = this.getData<'number'>('start', inputs);
		const end = this.getData<'number'>('end', inputs);
		const step = this.getData<'number'>('step', inputs);

		if (start === undefined || end === undefined || step === undefined) {
			forward('done');
			super.execute(input, forward, forwardExec);
			return;
		}

		this.currentTime = start;
		let cycle = 0;
		// console.log('leaves', leavesFromLoopExec);

		while (this.currentTime <= end + 1e-9) {
			// console.log('start', start, 'end', end, 'step', step);
			if (displayProgress && cycle % 100 === 0) {
				console.log(this.currentTime);
				notifications.show({ title: 'Time Loop', message: `Time: ${this.currentTime}s` });
			}

			this.getDataflowEngine().reset(this.id);
			const leavesFromLoopExec = getLeavesFromOutput(this, 'loop');
			const promises = this.getWaitPromises(leavesFromLoopExec);
			forward('loop');

			await Promise.all(promises);

			cycle++;
			this.currentTime = step * cycle + start;
		}

		// console.log(displayProgress, start, end, step);

		forward('done');
		super.execute(input, forward, forwardExec);
	}

	override data(
		inputs?: Record<string, unknown> | undefined
	): Record<string, unknown> | Promise<Record<string, unknown>> {
		return { time: this.currentTime };
	}
}
