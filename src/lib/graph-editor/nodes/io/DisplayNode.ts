import { Node, type NodeParams } from '$Node';
import { InputControl, type Socket } from '$graph-editor/socket';

/**
 * This node displays the value of the input.
 */
export class DisplayNode extends Node<{ input: Socket }, {}, { display: InputControl<'text'> }> {
	height = 120;
	width = 180;

	constructor(
		params: NodeParams & {
			initial?: string;
		}
	) {
		super({
			label: 'Display',
			...params
		});
		this.addInData('input', { type: 'any', initial: params.initial });

		// Display value
		this.addInputControl('display', { type: 'text', readonly: true });
	}

	data(inputs: { input?: number[] }): Record<string, unknown> | Promise<Record<string, unknown>> {
		const inputValue = this.getData('input', inputs);
		console.log('Data');
		console.log(inputValue);
		if (this.controls.display instanceof InputControl) {
			this.controls.display.value = inputValue;
			this.updateElement('control', this.controls.display.id);
		} else {
			console.error('DisplayNode', 'this.controls.display is not an InputControl');
		}

		return {};
	}
}
