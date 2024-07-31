import type { SocketType } from '$graph-editor/plugins/typed-sockets';
import { cloneDeep } from 'lodash-es';
import { ClassicPreset, getUID } from 'rete';
import type {
	Socket,
	SocketDatastructure,
	SocketValueWithDatastructure
} from '../socket/Socket.svelte';
import { valueConverters } from '$graph-editor/common';
import type { HTMLAttributes, HTMLBaseAttributes, HTMLInputAttributes } from 'svelte/elements';

export type ControlParams = {
	placeInHeader: boolean;
};

export function applyParams<T extends object>(
	target: T,
	constructor: new () => T,
	params: Record<string, unknown>
) {
	if (Object.keys(params).length === 0) return;
	const ref = new constructor();
	Object.assign(target, Object.fromEntries(Object.entries(params).filter(([k]) => k in ref)));
}

/**
 * A control represents widgets the user can interact with.
 */
export class Control extends ClassicPreset.Control {
	placeInHeader = $state(false);
	constructor(params: Partial<ControlParams> = {}) {
		super();
		applyParams(this, Control, params);
	}
}

/**
 * Supported types of input control.
 */
export const inputControlTypes = [
	'text',
	'number',
	'checkbox',
	'textarea',
	'integer',
	'vector',
	'remote-file',
	'select',
	'group-name-ref'
] as const;
/**
 *  Supported types of input control.
 */
export type InputControlType = (typeof inputControlTypes)[number];
export function isInputControlType(type: unknown): type is InputControlType {
	return inputControlTypes.includes(type as InputControlType);
}
/**
 * Default values for each type of input control.
 */
export const defaultInputControlValues = {
	text: '',
	number: 0,
	checkbox: true,
	textarea: '',
	integer: 0,
	vector: { x: 0, y: 0, z: 0 },
	'remote-file': '',
	select: '',
	'group-name-ref': ''
};
export const inputControlSocketType: Record<InputControlType, SocketType> = {
	'group-name-ref': 'groupNameRef',
	'remote-file': 'path',
	checkbox: 'boolean',
	integer: 'integer',
	number: 'number',
	select: 'options',
	text: 'string',
	textarea: 'string',
	vector: 'vector'
};

export const socketToControl = {
	path: 'remote-file',
	string: 'text',
	integer: 'integer',
	number: 'number',
	boolean: 'checkbox',
	vector: 'vector',
	any: 'text',
	groupNameRef: 'group-name-ref'
} as const;
export const socketTypesWithControl = Object.keys(socketToControl) as SocketType[];
export type ControlOfSocket<S extends SocketType> = S extends keyof typeof socketToControl
	? (typeof socketToControl)[S]
	: 'text';
export type SocketValueType<S extends SocketType> = S extends 'any'
	? unknown
	: ControlOfSocket<S> extends InputControlType
		? InputControlValueType<ControlOfSocket<S>>
		: unknown;
let testa: SocketValueType<'boolean'>;
export function assignControl(
	socketType: SocketType,
	default_?: InputControlType
): InputControlType | undefined {
	return socketType in socketToControl ? socketToControl[socketType] : default_;
}
/**
 * Type utility to get the value type of an input control based on its type.
 */
export type InputControlValueType<T extends InputControlType> =
	(typeof defaultInputControlValues)[T];

export type InputControlParams<
	T extends InputControlType,
	D extends SocketDatastructure = SocketDatastructure
> = {
	type: T;
	datastructure: D;
	initial?: SocketValueWithDatastructure<InputControlValueType<T>, D>;
	readonly?: boolean;
	props?: HTMLInputAttributes;
	onChange?: (value: InputControlValueType<T>) => void;
	label?: string;
	changeType?: (type: SocketType) => void;
	socketType: SocketType;
	// socket?: Socket<(typeof inputControlSocketType)[T]>;
};
export function getDatastructure<T extends InputControlType, D extends SocketDatastructure>({
	datastructure,
	type,
	values
}: {
	datastructure: D;
	type: T;
	values?: InputControlValueType<T>[];
}): SocketValueWithDatastructure<InputControlValueType<T>, D> {
	const defaultValue = defaultInputControlValues[type] as InputControlValueType<T>;
	if (!values || values.length === 0) values = [defaultValue];
	switch (datastructure) {
		case 'scalar':
			return values[0] as SocketValueWithDatastructure<InputControlValueType<T>, D>;
		case 'array':
			return [...values] as SocketValueWithDatastructure<InputControlValueType<T>, D>;
		default:
			throw new Error('Invalid datastructure');
	}
}
export function getDatastructureValues<T, D extends SocketDatastructure>({
	datastructure,
	data
}: {
	datastructure: D;
	data: SocketValueWithDatastructure<T, D>;
}): T[] {
	switch (datastructure) {
		case 'scalar':
			return [data as T];
		case 'array':
			return [...(data as T[])];
		default:
			throw new Error('Invalid datastructure');
	}
}

export class InputControl<
	T extends InputControlType = InputControlType,
	D extends SocketDatastructure = SocketDatastructure
> extends Control {
	#value = $state() as SocketValueWithDatastructure<InputControlValueType<T>, D>;
	readonly = $state(false);
	onChange?: InputControlParams<T>['onChange'];
	label = $state('');
	type = $state<InputControlType>('text');
	datastructure: D;
	#socketType: SocketType = $state('any');
	changeType?: (type: SocketType) => void = $state();
	props = $state<HTMLInputAttributes>({});

	constructor(params: InputControlParams<T, D>) {
		super();
		this.props = params.props ?? {};
		this.id = getUID();
		this.datastructure = params.datastructure;
		this.readonly = params.readonly ?? false;
		this.label = params.label ?? '';
		this.onChange = params.onChange;
		this.#value = params.initial ?? getDatastructure(params);
		this.type = params.type;
		this.changeType = params.changeType;
		this.#socketType = params.socketType;
	}

	get value(): SocketValueWithDatastructure<InputControlValueType<T>, D> {
		return this.#value;
	}

	set value(v: SocketValueWithDatastructure<InputControlValueType<T>, D>) {
		this.#value = v;
		if (this.onChange && v !== undefined && !this.readonly) this.onChange(v);
	}

	get socketType() {
		return this.#socketType;
	}

	set socketType(t) {
		console.debug(`Converting values from ${this.#socketType} to ${t}`);
		const converter = valueConverters[t];
		let values: unknown[];
		if (!converter) {
			console.warn('No converter for', t);
		} else {
			values = getDatastructureValues({
				datastructure: this.datastructure,
				data: this.value
			}).map(converter);
		}
		this.value = getDatastructure({
			datastructure: this.datastructure,
			values,
			type: socketToControl[t]
		});
		this.#socketType = t;
	}
}
// const test = new InputControl({ type: 'checkbox', initial: true });
