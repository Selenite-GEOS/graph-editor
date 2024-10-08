import {
	description,
	Node,
	path,
	registerNode,
	tags,
	type NodeParams,
	type SocketsValues
} from '$graph-editor/nodes/Node.svelte';
import { Socket, type Scalar } from '../../socket/Socket.svelte';

@registerNode('math.AddNode')
@tags('+', 'sum')
@path('Number')
@description('Adds two numbers together.')
export class AddNode extends Node<
	{ a: Scalar<'number'>; b: Scalar<'number'> },
	{ value: Scalar<'number'> }
> {
	constructor(params: NodeParams & { a?: number; b?: number } = {}) {
		super({ label: 'Add', height: 190, ...params });
		const { a = 0, b = 0 } = params;
		this.addInData('a', { type: 'number', initial: a, hideLabel: true });
		this.addInData('b', { type: 'number', initial: b, hideLabel: true });

		this.addOutData('value', { type: 'number' });
	}

	data(inputs?: { a: number; b: number } | undefined): SocketsValues<{ value: Scalar<'number'> }> {
		const a = this.getData('a', inputs);
		const b = this.getData('b', inputs);
		return { value: a + b };
	}
}
