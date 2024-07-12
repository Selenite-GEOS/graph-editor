/**
 * Nodes for creating and manipulating booleans.
 * @module
 */

import type { Socket } from '$graph-editor/socket';
import {
	Node,
	registerConverter,
	registerNode,
	tags,
	type NodeParams,
	type SocketsValues
} from '$graph-editor/nodes/Node.svelte';
import { ConverterNode, InputControlNode } from './common-data-nodes.svelte';

@registerNode('boolean.BooleanNode')
export class BooleanNode extends InputControlNode {
	constructor(params?: NodeParams) {
		super({ label: 'Boolean', ...params, controlType: 'checkbox' });
	}
}

@registerNode('boolean.NotNode')
@tags('!', 'negate', 'invert')
export class NotNode extends Node<{ value: Socket<'boolean'> }, { value: Socket<'boolean'> }> {
	constructor(params: NodeParams = {}) {
		super({
			label: 'Not',
			...params
		});
		this.addInData('value', { type: 'boolean' });
		this.addOutData('value', { type: 'boolean' });
	}

	data(inputs?: { value: boolean } | undefined): SocketsValues<{ value: Socket<'boolean'> }> {
		return {
			value: !this.getData('value', inputs)
		};
	}
}

@registerConverter('boolean', 'string')
@registerNode('boolean.ToString')
export class BooleanToString extends ConverterNode<'boolean', 'string'> {
	constructor(params: NodeParams = {}) {
		super({
			label: 'To string',
			...params,
			source: 'boolean',
			target: 'string',
			convert(e) {
				return String(e);
			}
		});
	}
}

@registerConverter('boolean', 'number')
@registerNode('boolean.ToNumber')
export class BooleanToNumber extends ConverterNode<'boolean', 'number'> {
	constructor(params: NodeParams = {}) {
		super({
			label: 'To number',
			...params,
			source: 'boolean',
			target: 'number',
			convert(e) {
				return e === true ? 1 : 0;
			}
		});
	}
}
