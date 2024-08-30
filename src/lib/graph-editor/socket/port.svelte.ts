import type { ClassicPreset} from 'rete'
import type { Socket } from './Socket.svelte';
import { newLocalId } from '@selenite/commons';

export type PortParams<S extends Socket = Socket> = {
	socket: S;
	multipleConnections?: boolean;
    label?: string;
    description?: string;
};
export class Port<S extends Socket = Socket> implements ClassicPreset.Port<S> {
    readonly socket: S;
    readonly id: string
    readonly multipleConnections: boolean;
    label = $state<string>();   
    description = $state<string>(); 
    constructor(params: PortParams<S>) {
        this.id = newLocalId('port');
        this.socket = params.socket;
        this.socket.port = this;
        this.multipleConnections = params.multipleConnections ?? false;
        this.label = params.label;
        this.description = params.description;
    }
}


export class Output<S extends Socket = Socket> extends Port<S> implements ClassicPreset.Output<S> {
    constructor(params: PortParams<S>) {
        super({multipleConnections: true, ...params});
    }
}