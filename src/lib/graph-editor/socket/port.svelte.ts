import type { ClassicPreset } from 'rete';
import type { Socket } from './Socket.svelte';
import { localId, newLocalId } from '@selenite/commons';

export type PortParams<S extends Socket = Socket> = {
	socket: S;
	multipleConnections?: boolean;
	label?: string;
	description?: string;
	index?: number;
};
export class Port<S extends Socket = Socket> implements ClassicPreset.Port<S> {
	readonly socket: S;
	readonly id: string;
	readonly multipleConnections: boolean;
	label = $state<string>();
	description = $state<string>();
	index = $state<number>();
	constructor(params: PortParams<S>) {
		this.id = localId('port');
		this.socket = params.socket;
		this.socket.port = this;
		this.multipleConnections = params.multipleConnections ?? false;
		this.label = params.label;
		this.description = params.description;
		this.index = params.index;
	}
}

export class Output<S extends Socket = Socket> extends Port<S> implements ClassicPreset.Output<S> {
	constructor(params: PortParams<S>) {
		super({ multipleConnections: true, ...params });
	}
}
