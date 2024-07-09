import type { SocketType } from '$graph-editor/plugins/typed-sockets';
import {
	inputControlSocketType,
	socketToControl,
	type ControlOfSocket,
	type InputControl,
	type InputControlType,
	type InputControlValueType,
	type Socket,
	type SocketDatastructure,
	type SocketValueType
} from '$graph-editor/socket';
import { Node, type NodeParams } from '../Node';

export type InputControlNodeParams<T extends InputControlType, D extends SocketDatastructure = SocketDatastructure> = NodeParams & {
	type: T;
	datastructure?: D;
	initial?: InputControlValueType<T>;
};

export class InputControlNode<S extends SocketType = SocketType, D extends SocketDatastructure = SocketDatastructure> extends Node<
	{},
	{ value: Socket<S> },
	{ value: InputControl<ControlOfSocket<S>> }
> {
	inputControl: InputControl<ControlOfSocket<S>>;
	outSocket: Socket;
	constructor(params: InputControlNodeParams<ControlOfSocket<S>>) {
		super(params);
		const {datastructure = "scalar"} = params;
		this.inputControl = this.addInputControl('value', {
			type: params.type,
			datastructure,
			initial: params.initial,
			changeType: (type) => {
				console.warn("Change type", type)
				const controlType = socketToControl[type as keyof typeof socketToControl]
				if (!controlType) {
					console.error("No control type for", type)
					return;
				}
				this.inputControl.type = controlType;
				this.outSocket.type = type;
			}
		});

		this.outSocket = this.addOutData('value', { type: inputControlSocketType[params.type] as S, datastructure });
	}

	data(inputs?: {} | undefined): {
		[K in 'value']: SocketValueType<{ value: Socket<S> }[K]['type']>;
	} {
		return {
			value: this.controls.value.value
		};
	}
}

/**
 * Base class for converter nodes.
 * 
 * Converter nodes are used to convert data from one type to another type.
 * @template S Source type.
 * @template T Target type.
 */
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
