import { ClassicPreset} from 'rete'
import type { Socket } from './Socket.svelte';
import { newLocalId } from '@selenite/commons';

export type PortParams<S extends Socket = Socket> = {
	socket: S;
	multipleConnections: boolean;
    label?: string;
    description?: string;
};
export class Port<S extends Socket = Socket> implements ClassicPreset.Port<S> {
    readonly socket: S;
    readonly id: string
    readonly multipleConnections: boolean = false;
    label = $state<string>();   
    description = $state<string>(); 
    constructor(params: PortParams<S>) {
        this.id = newLocalId('port');
        this.socket = params.socket;
        this.socket.port = this;
        Object.assign(this, params);
    }
}


export class Output<S extends Socket = Socket> extends Port<S> implements ClassicPreset.Output<S> {
}