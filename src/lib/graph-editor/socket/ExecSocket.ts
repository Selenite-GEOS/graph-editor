import type { Node } from '$graph-editor/node/Node';
import { Socket } from './Socket';

export class ExecSocket extends Socket {
	constructor({ name, node }: { name?: string; node: Node }) {
		super({ name: name, type: 'exec', node });
	}
}
