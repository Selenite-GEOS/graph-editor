import { ClassicPreset } from 'rete';
import type { Socket } from '../../old-graph-editor/rete/socket/Socket';

export class Output<S extends Socket = Socket> extends ClassicPreset.Output<S> {}
