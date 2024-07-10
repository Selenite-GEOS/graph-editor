/**
 * Nodes for creating and manipulating vectors.
 * @module
 */

import { description, registerNode, tags, type NodeParams } from '$graph-editor/nodes/Node.svelte';
import { InputControlNode } from './common-data-nodes.svelte';

/**
 * A node that outputs a vector.
 */
@registerNode('vector.VectorNode')
@description('A node that outputs a vector.')
@tags('3d', 'tensor', 'point')
export class VectorNode extends InputControlNode<'vector'> {
	constructor(params?: NodeParams) {
		super({ label: 'Vector', ...params, controlType: 'vector' });
	}
}
