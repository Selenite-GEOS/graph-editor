import { Node, registerNode, type NodeParams, type SocketsValues } from '../Node.svelte';
import type { Socket } from '$graph-editor/socket';
import { InputControlNode } from './common-data-nodes.svelte';
import type { SocketType } from '$graph-editor/plugins/typed-sockets';

@registerNode('array.Array')
export class ArrayNode extends InputControlNode<SocketType, 'array'> {
	constructor(params: NodeParams = {}) {
		super({
			label: 'Array',
			...params,
			controlType: 'text',
			datastructure: 'array',
			socketType: 'number'
		});
	}
}

@registerNode('array.MergeArrays')
export class MergeArraysNode extends Node<
	{ a: Socket<'any', 'array'>; b: Socket<'any', 'array'> },
	{ value: Socket<'any', 'array'> }
> {
	constructor(params: NodeParams = {}) {
		super({
			label: 'Merge Arrays',
			width: 180,
			height: 190,
			...params
		});
		this.addInData('a', {
			datastructure: 'array',
			type: 'any'
		});
		this.addInData('b', {
			datastructure: 'array',
			type: 'any'
		});
		this.addOutData('value', {
			datastructure: 'array',
			type: 'any'
		});
	}

	data(
		inputs?: { a: unknown[]; b: unknown[] } | undefined
	): SocketsValues<{ value: Socket<'any', 'array'> }> {
		const a = this.getData('a', inputs);
		const b = this.getData('b', inputs);
		return {
			value: [...a, ...b]
		};
	}
}
