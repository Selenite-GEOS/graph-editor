import type { Node } from '$graph-editor/nodes';
import { Socket } from './Socket.svelte';

export class ExecSocket extends Socket<'exec'> {
	constructor({ name, node }: { name?: string; node: Node }) {
		super({ name: name, type: 'exec', node });
	}
}