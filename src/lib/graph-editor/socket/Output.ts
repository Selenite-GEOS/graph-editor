import { ClassicPreset } from 'rete';
import type { Socket } from './Socket.svelte';

type OutputParams = {
	socket: Socket;
	label?: string;
	multipleConnections?: boolean;
	description?: string;
};
export class Output extends ClassicPreset.Output<Socket> {
	description?: string;
	constructor(params: OutputParams) {
		super(params.socket, params.label, params.multipleConnections);
		params.socket.port = this;
		this.description = params.description;
	}
}
