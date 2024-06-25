import { ClassicPreset, getUID } from 'rete';

export class Control extends ClassicPreset.Control {}

export type InputControlTypes =
	| 'integer'
	| 'select'
	| 'text'
	| 'number'
	| 'checkbox'
	| 'textarea'
	| 'vector'
	| 'unknown'
	| 'file'
	| 'remote-file'
	| 'group-name-ref';
export type InputControlValueType<T extends InputControlTypes> = T extends 'text'
	? string
	: T extends 'number'
	? number
	: T extends 'integer'
	? number
	: T extends 'file' | 'remote-file'
	? string
	: T extends 'checkbox'
	? boolean
	: T extends 'select'
	? string
	: T extends 'group-name-ref'
	? string
	: T extends 'textarea'
	? string
	: T extends unknown
	? unknown
	: T extends 'vector'
	? { x: number; y: number; z: number }
	: never;

export type InputControlOptions<N> = {
	readonly?: boolean;
	initial?: N;
	options?: string[] | null;
	change?: (value: N) => void;
	debouncedOnChange?: (value: N) => void;
	onHeightChange?: (height: number, info: unknown) => void;
	label?: string;
	pattern?: string | null;
};

export class InputControl<
	T extends InputControlTypes = 'unknown',
	N = InputControlValueType<T>
> extends Control {
	value?: N;
	readonly: boolean;

	constructor(public type: T, public options?: InputControlOptions<N>) {
		super();

		this.id = getUID();
		this.readonly = options?.readonly ? options.readonly : false;

		let initial = options?.initial;

		if (initial === undefined) {
			switch (type) {
				case 'text':
					initial = '';
					break;
				case 'file':
					initial = './vtkfile.vtk';
					break;
				case 'number':
					initial = 0;
					break;
				case 'checkbox':
					initial = false;
					break;
				case 'textarea':
					initial = '';
					break;
				case 'integer':
					initial = 0;
					break;
				case 'vector':
					initial = { x: 0, y: 0, z: 0 };
					break;
				case 'remote-file':
					initial = '';
					break;
				case 'select':
					initial = options?.options ? options.options[0] : '';
					break;
				case 'group-name-ref':
					initial = '';
					break;
				// default:
				// 	initial = '';
			}
			if (this.options?.change) this.options.change(initial);
		}

		this.value = initial;
		console.log('control value', this.value);
		// if (options && initial !== undefined && options.debouncedOnChange) {

		// 	options.debouncedOnChange(initial)
		// }
	}

	setValue(value?: N) {
		this.value = value;
		console.log('set value');
		if (this.options?.change && value !== undefined) this.options.change(value);
	}
}
