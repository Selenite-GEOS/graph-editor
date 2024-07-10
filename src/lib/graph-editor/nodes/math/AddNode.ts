import {
	Node,
	registerNode,
	type NodeParams,
	type SocketsValues
} from '$graph-editor/nodes/Node.svelte';
import { Socket } from '../../socket/Socket.svelte';

@registerNode('math.AddNode')
export class AddNode extends Node<{ a: Socket<'number'>; b: Socket<'number'> }, { value: Socket }> {
	constructor(params: NodeParams & { a?: number; b?: number } = {}) {
		super({ label: 'Add', height: 190, ...params });
		const { a = 0, b = 0 } = params;
		this.addInData('a', { type: 'number', initial: a });
		this.addInData('b', { type: 'number', initial: b });

		this.addOutData('value', { type: 'number' });
	}

	data(inputs?: { a: number; b: number } | undefined): SocketsValues<{ value: Socket }> {
		const a = this.getData('a', inputs);
		const b = this.getData('b', inputs);
		return { value: a + b };
	}
}
