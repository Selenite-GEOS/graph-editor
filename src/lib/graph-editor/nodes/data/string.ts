/**
 * Nodes for creating and manipulating strings.
 * @module
 */

import { description, registerNode, tags, type NodeParams } from '$Node';
import { InputControlNode } from './common';

/**
 * Creates a string.
 */
@registerNode('string.StringNode')
@description('Creates a string')
@tags('string', 'data', 'scalar', 'basic')
export class StringNode extends InputControlNode<'text'> {
	constructor(params?: NodeParams) {
		super({ label: 'String', ...params, type: 'text' });
	}
}
