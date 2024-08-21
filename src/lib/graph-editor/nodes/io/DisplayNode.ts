import {
	description,
	Node,
	path,
	registerNode,
	type NodeParams,
	type SocketsValues
} from '$graph-editor/nodes/Node.svelte';
import { InputControl, type Socket } from '$graph-editor/socket';

/**
 * This node displays the value of an input.
 */
@path('I/O')
@description('Displays an input.')
@registerNode('io.DisplayNode')
export class DisplayNode extends Node<
	{ input: Socket<'any'> },
	{},
	{ display: InputControl<'text'> }
> {
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
		this.addInputControl('display', { type: 'textarea', readonly: true, socketType: 'string', datastructure: 'scalar' });
	}

	data(inputs?: { input: string } | undefined): SocketsValues<{}> {
		const inputValue = this.getData('input', inputs);
		this.controls.display.value =
		typeof inputValue === 'string' ? inputValue : JSON.stringify(inputValue);
		console.debug('Displaying input', this.controls.display.value);
		this.updateElement('control', this.controls.display.id);
		return {};
	}
}
