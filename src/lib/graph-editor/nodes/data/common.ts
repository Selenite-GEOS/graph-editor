import {
	inputControlSocketType,
	type InputControl,
	type InputControlType,
	type InputControlValueType,
	type Socket
} from '$graph-editor/socket';
import { Node, type NodeParams } from '../Node';

export type InputControlNodeParams<T extends InputControlType> = NodeParams & {
	type: T;
	initial?: InputControlValueType<T>;
};
export class InputControlNode<T extends InputControlType> extends Node<
	{},
	{ value: Socket },
	{ value: InputControl<T> }
> {
	constructor(params: InputControlNodeParams<T>) {
		super(params);

		this.addInputControl('value', {
			type: params.type,
			initial: params.initial
		});

		this.addOutData('value', { type: inputControlSocketType[params.type] });
	}
	data(
		inputs?: Record<string, unknown> | undefined
	): Record<string, unknown> | Promise<Record<string, unknown>> {
		return {
			value: this.controls.value.value
		};
	}
}
