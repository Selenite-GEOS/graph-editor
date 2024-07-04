import type { SocketType } from '$graph-editor/plugins/typed-sockets';
import { cloneDeep } from 'lodash-es';
import { ClassicPreset, getUID } from 'rete';

/**
 * A control represents objects the users can interact with.
 */
export class Control extends ClassicPreset.Control {}

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
	checkbox: false,
	textarea: '',
	integer: 0,
	vector: { x: 0, y: 0, z: 0 },
	'remote-file': '',
	select: '',
	'group-name-ref': ''
};

const socketToControl = {
	path: 'remote-file',
	string: 'text',
	integer: 'integer',
	number: 'number',
	boolean: 'checkbox',
	vector: 'vector',
	any: 'text',
	groupNameRef: 'group-name-ref'
} as const;
export type ControlOfSocket<S extends SocketType> = S extends keyof typeof socketToControl
	? (typeof socketToControl)[S]
	: undefined;
export type SocketValueType<S extends SocketType> =
	ControlOfSocket<S> extends InputControlType
		? InputControlValueType<ControlOfSocket<S>>
		: undefined;
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

export type InputControlParams<T extends InputControlType> = {
	type: T;
	initial?: InputControlValueType<T>;
	readonly?: boolean;
	onChange?: (value: InputControlValueType<T>) => void;
	label?: string;
};
export class InputControl<T extends InputControlType> extends Control {
	#value? = $state<InputControlValueType<T>>();
	readonly = $state(false);
	onChange?: InputControlParams<T>['onChange'];
	label = $state('');
	type = $state<InputControlType>();

	constructor(params: InputControlParams<T>) {
		super();
		this.id = getUID();
		this.readonly = params.readonly ?? false;
		this.label = params.label ?? '';
		this.onChange = params.onChange;
		this.#value = cloneDeep(params.initial ?? defaultInputControlValues[params.type]);
		this.type = params.type;
	}

	get value(): InputControlValueType<T> | undefined {
		return this.#value;
	}

	set value(v: InputControlValueType<T>) {
		this.#value = cloneDeep(v);
		if (this.onChange && v !== undefined && !this.readonly) this.onChange(v);
	}
}
const test = new InputControl({ type: 'checkbox', initial: true });
