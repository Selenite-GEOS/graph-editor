import { ClassicPreset } from 'rete';
import type { SocketType } from '../plugins/typed-sockets';
import type { Node } from '$graph-editor/nodes/Node.svelte';

const socketDatastructures = ["scalar", "array"] as const
export type SocketDatastructure = typeof socketDatastructures[number];
export type SocketValueWithDatastructure<T, D extends SocketDatastructure> = D extends 'scalar' ? T : D extends 'array' ? T[] : never;
export class Socket<S extends SocketType = SocketType, D extends SocketDatastructure = SocketDatastructure> extends ClassicPreset.Socket {
	// public readonly isArray: boolean;
	public readonly datastructure: D;
	public readonly isRequired: boolean;
	public type: S = $state('any' as S);
	public value: unknown;
	public selected: boolean;
	public readonly node: Node;
	public displayLabel: boolean;

	constructor({
		name = '',
		datastructure = 'scalar' as D,
		isRequired = false,
		type = 'any' as S,
		displayLabel = true,
		node
	}: {
		name?: string;
		isRequired?: boolean;
		datastructure?: D
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
