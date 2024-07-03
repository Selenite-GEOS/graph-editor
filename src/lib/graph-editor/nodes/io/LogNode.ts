import { Node } from '$Node';
import type { NodeFactory } from '$graph-editor/editor';

export class LogNode extends Node {
	// protected state: Record<string, unknown>;
	// state: Record<string, unknown>;
	state: { message: string } = { ...this.state, message: 'Hello' };

	constructor({ message = 'Hello', factory }: { message?: string; factory: NodeFactory }) {
		// super('Log', { factory });
		super({ label: 'Log', factory, params: { message }, height: 250 });
		this.state.message = message;
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
		this.addInData({
			name: 'message',
			displayName: 'Message',
			socketLabel: 'Message',
			type: 'any',
			control: {
				type: 'textarea',
				options: {
					initial: message,
					label: 'Message',
					debouncedOnChange: (value) => {
						this.state.message = value;
						console.log(this.state);
					}
				}
			}
		});

		// const messageInput = new Input(new Socket(), 'Message');
		// messageInput.addControl(new InputControl('text', { initial: message }));
		// this.addInput('message', messageInput);
	}

	override applyState(): void {
		console.log('applyState', this.state);
		const messageControl = this.inputs.message?.control as ClassicPreset.InputControl<'text'>;
		messageControl.setValue(this.state.message);
	}

	async execute(input: string, forward: (output: string) => unknown) {
		const messageControl = this.inputs.message?.control as ClassicPreset.InputControl<'text'>;

		const inputs = (await this.fetchInputs()) as {
			message: string[];
		};
		const res = inputs.message ? inputs.message[0] : messageControl.value;
		console.log(res);

		this.factory.notifications.show({
			title: 'Log',
			message: typeof res === 'string' ? res : JSON.stringify(res)
		});

		forward('exec');
		super.execute(input, forward, false);
	}

	data() {
		return {};
	}
}
