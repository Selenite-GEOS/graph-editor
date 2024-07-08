import { ClassicPreset } from 'rete';
import type { SocketType } from '../plugins/typed-sockets';
import type { Node } from '$graph-editor/nodes/Node';

export class Socket<T extends SocketType = SocketType> extends ClassicPreset.Socket {
	public readonly isArray: boolean;
	public readonly isRequired: boolean;
	public type: T;
	public value: unknown;
	public selected: boolean;
	public readonly node: Node;
	public displayLabel: boolean;

	constructor({
		name = '',
		isArray = false,
		isRequired = false,
		type = 'any' as T,
		displayLabel = true,
		node
	}: {
		name?: string;
		isArray?: boolean;
		isRequired?: boolean;
		type?: T;
		node: Node;
		displayLabel?: boolean;
	}) {
		super(name);
		this.isArray = isArray;
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
