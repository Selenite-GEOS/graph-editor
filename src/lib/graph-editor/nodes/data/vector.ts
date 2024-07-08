/**
 * Nodes for creating and manipulating vectors.
 * @module
 */

import { description, registerNode, tags, type NodeParams } from '$Node';
import { InputControlNode } from './common';

/**
 * A node that outputs a vector.
 */
@registerNode('vector.VectorNode')
@description('A node that outputs a vector.')
@tags('3d', 'tensor', 'point')
export class VectorNode extends InputControlNode<'vector'> {
	constructor(params?: NodeParams) {
		super({ label: 'Vector', ...params, type: 'vector' });
	}
}
