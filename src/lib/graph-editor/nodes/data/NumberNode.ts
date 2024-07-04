import { Node, type NodeParams } from '$Node';
import type { NodeFactory } from '$graph-editor/editor';
import { InputControl, Socket } from '$graph-editor/socket';

export class NumberNode extends Node<{}, { value: Socket }, { value: InputControl<'number'> }> {
	constructor(
		params: NodeParams & {
			initial?: number;
			change?: () => void;
		}
	) {
		super({ label: 'Number', ...params });
		this.addInputControl('value', { type: 'number', initial: params.initial });
		this.addOutData({ name: 'value', type: 'number' });
	}

	data(): Record<string, unknown> | Promise<Record<string, unknown>> {
		return {
			value: this.controls.value instanceof InputControl ? this.controls.value.value : 0
		};
	}
}
