import { ClassicPreset } from 'rete';
import type { Socket } from '../../old-grah-editor/rete/socket/Socket';

export class Output<S extends Socket = Socket> extends ClassicPreset.Output<S> {}
