import type { SocketType } from '$graph-editor/plugins/typed-sockets';
import {
	inputControlSocketType,
	type ControlOfSocket,
	type InputControl,
	type InputControlType,
	type InputControlValueType,
	type Socket,
	type SocketValueType
} from '$graph-editor/socket';
import { Node, type NodeParams } from '../Node';

export type InputControlNodeParams<T extends InputControlType> = NodeParams & {
	type: T;
	initial?: InputControlValueType<T>;
};

export class InputControlNode<S extends SocketType = SocketType> extends Node<
	{},
	{ value: Socket<S> },
	{ value: InputControl<ControlOfSocket<S>> }
> {
	constructor(params: InputControlNodeParams<ControlOfSocket<S>>) {
		super(params);

		this.addInputControl('value', {
			type: params.type,
			initial: params.initial
		});

		this.addOutData('value', { type: inputControlSocketType[params.type] as S });
	}

	data(inputs?: {} | undefined): {
		[K in 'value']: SocketValueType<{ value: Socket<S> }[K]['type']>;
	} {
		return {
			value: this.controls.value.value
		};
	}
}

export class ConverterNode<S extends SocketType = 'any', T extends SocketType = 'any'> extends Node<
	{ value: Socket<S> },
	{ value: Socket<T> }
> {
	convert: (v: SocketValueType<S>) => SocketValueType<T>;
	constructor(
		params: NodeParams & {
			source: S;
			target: T;
			convert: (e: SocketValueType<S>) => SocketValueType<T>;
		}
	) {
		super(params);
		this.convert = params.convert;
		this.addInData('value', { type: params.source });
		this.addOutData('value', { type: params.target });
	}

	data(inputs?: { value: SocketValueType<S> } | undefined): {
		[K in 'value']: SocketValueType<{ value: Socket<T> }[K]['type']>;
	} {
		return {
			value: this.convert(this.getData('value', inputs))
		};
	}
}
