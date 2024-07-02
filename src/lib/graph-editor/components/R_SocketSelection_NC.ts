import type { Input } from '$graph-editor/Input';
import type { Output } from '$graph-editor/Output';
import type { Node } from '$graph-editor/node/Node';
import { NodeComponent } from './NodeComponent';

export class R_SocketSelection_NC extends NodeComponent {
	constructor({ owner }: { owner: Node }) {
		super({ id: 'R_SocketSelection_NC', owner: owner });
	}

	selectedInputs(): Record<string, Input> {
		const res: Record<string, Input> = {};
		for (const [key, input] of Object.entries(this.node.inputs)) {
			if (input?.socket.selected) res[key] = input;
		}
		return res;
	}

	selectedOutputs(): Record<string, Output> {
		const res: Record<string, Output> = {};
		for (const [key, output] of Object.entries(this.node.outputs)) {
			if (output?.socket.selected) res[key] = output;
		}
		return res;
	}
}
