import { ClassicPreset } from 'rete';
import type { Socket } from './Socket.svelte';

export class Output<S extends Socket = Socket> extends ClassicPreset.Output<S> {
}
