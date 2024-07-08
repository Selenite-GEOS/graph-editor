import { description, Node, path, registerNode, type NodeParams } from '$Node';
import { InputControl, type Socket } from '$graph-editor/socket';

/**
 * This node displays the value of an input.
 */
@path('I/O')
@description('Displays an input.')
@registerNode('io.DisplayNode')
export class DisplayNode extends Node<{ input: Socket }, {}, { display: InputControl<'text'> }> {
	height = 120;
	width = 300;

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

		// Value display
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
