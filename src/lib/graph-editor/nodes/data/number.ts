/**
 * Nodes for creating and manipulating numbers.
 * @module
 */

import { description, path, registerNode, tags, type NodeParams } from '$Node';
import { InputControlNode } from './common';

/**
 * A node that outputs a number.
 */
@registerNode('number.NumberNode')
@description('A node that outputs a number.')
@tags('float', 'real', 'x')
export class NumberNode extends InputControlNode<'number'> {
	constructor(params?: NodeParams) {
		super({ label: 'Number', ...params, type: 'number' });
	}
}
