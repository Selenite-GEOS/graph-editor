import { ClassicPreset } from 'rete';
import type { DataType, SocketType } from '../plugins/typed-sockets';
import type { Node } from '$graph-editor/nodes/Node.svelte';
import type { Port } from 'rete/_types/presets/classic';

const socketDatastructures = ['scalar', 'array'] as const;
export type SocketDatastructure = (typeof socketDatastructures)[number];
export type SocketValueWithDatastructure<T, D extends SocketDatastructure> = D extends 'scalar'
	? T
	: D extends 'array'
		? T[]
		: never;
export type Scalar<S extends DataType = DataType> = Socket<S, 'scalar'>
export class Socket<
	S extends SocketType = SocketType,
	D extends SocketDatastructure = SocketDatastructure
> extends ClassicPreset.Socket {
	// readonly isArray: boolean;
	readonly datastructure: D;
	readonly isRequired: boolean;
	type: S = $state('any' as S);
	value: unknown;
	selected: boolean;
	readonly node: Node;
	displayLabel: boolean | undefined;
	port = $state<Port<Socket>>(); 

	constructor({
		name = '',
		datastructure = 'scalar' as D,
		isRequired = false,
		type = 'any' as S,
		displayLabel,
		node
	}: {
		name?: string;
		isRequired?: boolean;
		datastructure?: D;
		type?: S;
		node: Node;
		displayLabel?: boolean;
	}) {
		super(name);
		this.datastructure = datastructure;
		this.isRequired = isRequired;
		this.type = type;
		this.selected = false;
		this.node = node;
		this.displayLabel = displayLabel;
	}

	select() {
		this.selected = true;
	}

	deselect() {
		this.selected = false;
	}

	toggleSelection() {
		this.selected = !this.selected;
	}
}
