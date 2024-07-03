import { ClassicPreset } from 'rete';
import type { Socket } from '../../old-graph-editor/rete/socket/Socket';

export class Input<S extends Socket = Socket> extends ClassicPreset.Input<S> {
	public readonly isRequired: boolean;
	public readonly index?: number;
	constructor(
		socket: S,
		label?: string,
		multipleConnections?: boolean,
		{ isRequired = false, index = undefined }: { isRequired?: boolean; index?: number } = {}
	) {
		super(socket, label, multipleConnections);
		this.index = index;
		this.isRequired = isRequired;
	}
}
