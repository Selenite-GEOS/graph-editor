/**
 * Nodes for creating and manipulating booleans.
 * @module
 */

import type { Socket } from '$graph-editor/socket';
import { Node, registerConverter, registerNode, type NodeParams, type SocketsValues } from '$Node';
import { ConverterNode, InputControlNode } from './common';

@registerNode('boolean.BooleanNode')
export class BooleanNode extends InputControlNode {
	constructor(params?: NodeParams) {
		super({ label: 'Boolean', ...params, type: 'checkbox' });
	}
}

@registerNode('boolean.NotNode')
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
