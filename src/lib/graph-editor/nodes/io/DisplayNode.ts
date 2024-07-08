import { description, Node, path, type NodeParams } from '$Node';
import { registerNode } from '$graph-editor/editor';
import { InputControl, type Socket } from '$graph-editor/socket';

/**
 * This node displays the value of the input.
 */
@registerNode('io.DisplayNode')
@path('I/O')
@description('Displays an input.')
export class DisplayNode extends Node<{ input: Socket }, {}, { display: InputControl<'text'> }> {
	height = 120;
	width = 180;

	constructor(
		params: NodeParams & {
			initial?: string;
		} = {}
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

		if (this.controls.display instanceof InputControl) {
			this.controls.display.value =
				typeof inputValue === 'string' ? inputValue : JSON.stringify(inputValue);
			this.updateElement('control', this.controls.display.id);
		} else {
			console.error('DisplayNode', 'this.controls.display is not an InputControl');
		}

		return {};
	}
}
