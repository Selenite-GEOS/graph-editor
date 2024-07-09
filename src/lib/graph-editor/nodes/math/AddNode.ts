import { Node, registerNode, type NodeParams, type SocketsValues } from '$Node';
import { Socket } from '../../socket/Socket';

@registerNode('math.AddNode')
export class AddNode extends Node<{ a: Socket<"number">; b: Socket<"number"> }, { value: Socket }> {
	constructor({ factory, a = 0, b = 0 }: NodeParams & { a?: number; b?: number } = {}) {
		super({ label: 'Add', factory, height: 170 });

		this.addInData('a', { type: 'number', initial: a });
		this.addInData('b', { type: 'number', initial: b });

		this.addOutData('value', { type: 'number'})
	}

	data(inputs?: { a: number; b: number; } | undefined): SocketsValues<{ value: Socket; }> {
		const a = this.getData('a', inputs);
		const b = this.getData('b', inputs);
		return { value: a + b}
	}
}
