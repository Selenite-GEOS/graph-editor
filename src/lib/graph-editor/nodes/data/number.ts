/**
 * Nodes for creating and manipulating numbers.
 * @module
 */

import { description, path, registerNode, tags, type NodeParams } from '$graph-editor/nodes/Node.svelte';
import { InputControlNode } from './common-data-nodes.svelte';

/**
 * A node that outputs a number.
 */
@registerNode('number.NumberNode')
@description('A node that outputs a number.')
@tags('float', 'real', 'x')
export class NumberNode extends InputControlNode<'number'> {
	constructor(params?: NodeParams) {
		super({ label: 'Number', ...params, controlType: 'number' });
	}
}
