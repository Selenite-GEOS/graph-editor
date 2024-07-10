/**
 * Nodes for creating and manipulating strings.
 * @module
 */

import { description, registerNode, tags, type NodeParams } from '$graph-editor/nodes/Node.svelte';
import { InputControlNode } from './common-data-nodes.svelte';

/**
 * Creates a string.
 */
@registerNode('string.StringNode')
@description('Creates a string')
@tags('string', 'data', 'scalar', 'basic')
export class StringNode extends InputControlNode<'text'> {
	constructor(params?: NodeParams) {
		super({ label: 'String', ...params, controlType: 'text' });
	}
}
