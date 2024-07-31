import { ClassicPreset } from 'rete';
import type { Socket } from './Socket.svelte';

type OutputParams = {
	socket: Socket;
	label?: string;
	multipleConnections?: boolean;
};
export class Output extends ClassicPreset.Output<Socket> {
	constructor(params: OutputParams) {
		super(params.socket, params.label, params.multipleConnections);
		console.log('Output', params.socket);
		params.socket.port = this;
	}
}
