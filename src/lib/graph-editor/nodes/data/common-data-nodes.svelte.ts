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
	type SocketValueType,
	type SocketValueWithDatastructure as WithDatastructure
} from '$graph-editor/socket';
import type { HTMLInputAttributes } from 'svelte/elements';
import { Node, type NodeParams, type SocketsValues } from '../Node.svelte';

export type InputControlNodeParams<
	S extends SocketType,
	T extends InputControlType,
	D extends SocketDatastructure = SocketDatastructure
> = NodeParams & {
	controlType: T;
	datastructure?: D;
	initial?: InputControlValueType<T>;
	socketType?: S;
	props?: HTMLInputAttributes;
};

export class InputControlNode<
	S extends SocketType = SocketType,
	D extends SocketDatastructure = SocketDatastructure
> extends Node<
	{},
	{ value: Socket<S> },
	{ value: InputControl<ControlOfSocket<S>> },
	{ type: SocketType; controlType: InputControlType }
> {
	inputControl: InputControl<ControlOfSocket<S>>;
	outSocket: Socket<S, D>;
	constructor(params: InputControlNodeParams<S, ControlOfSocket<S>>) {
		super(params);
		const { datastructure = 'scalar' } = params;
		const socketType =
			(this.state.type as S) ??
			params.socketType ??
			inputControlSocketType[params.controlType] ??
			'any';
		const controlType = (this.state.controlType as ControlOfSocket<S>) ?? params.controlType;

		this.inputControl = this.addInputControl('value', {
			type: controlType,
			socketType,
			datastructure,
			initial: params.initial,
			props: params.props,
			changeType: (type) => this.changeType(type as S)
		});

		this.outSocket = this.addOutData('value', {
			type: socketType,
			datastructure
		}) as Socket<S, D>;
	}

	changeType(type: S) {
		console.warn('Change type', type);
		const controlType = socketToControl[type as keyof typeof socketToControl];
		if (!controlType) {
			console.error('No control type for', type);
			return;
		}
		this.inputControl.socketType = type;
		this.inputControl.type = controlType;
		this.outSocket.type = type;
		this.state.controlType = controlType;
		this.state.type = type;
	}

	data(inputs?: {} | undefined): {
		[K in 'value']: SocketValueType<{ value: Socket<S> }[K]['type']>;
	} {
		return {
			value: this.controls.value.value as SocketValueType<S>
		};
	}
}

type SocketConverter<S extends SocketType, T extends SocketType, D extends SocketDatastructure> = (
	v: WithDatastructure<SocketValueType<S>, D>
) => WithDatastructure<SocketValueType<T>, D>;
/**
 * Base class for converter nodes.
 *
 * Converter nodes are used to convert data from one type to another type.
 * @template S Source type.
 * @template T Target type.
 */
export class ConverterNode<
	S extends SocketType = 'any',
	T extends SocketType = 'any',
	D extends SocketDatastructure = SocketDatastructure
> extends Node<{ value: Socket<S, D> }, { value: Socket<T, D> }> {
	convert: SocketConverter<S, T, D>;
	constructor(
		params: NodeParams & {
			source: S;
			target: T;
			convert: SocketConverter<S, T, D>;
		}
	) {
		super(params);
		this.convert = params.convert;
		this.addInData('value', { type: params.source });
		this.addOutData('value', { type: params.target });
	}

	data(
		inputs?: SocketsValues<{ value: Socket<S, D> }> | undefined
	): SocketsValues<{ value: Socket<T, D> }> {
		return {
			value: this.convert(this.getData('value', inputs))
		};
	}
}
