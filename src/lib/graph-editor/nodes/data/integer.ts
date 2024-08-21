import { description, registerNode, tags, type NodeParams } from "../Node.svelte";
import { InputControlNode } from "./common-data-nodes.svelte";

/**
 * A node that outputs a number.
 */
@registerNode('integer.IntegerNode')
@description('Produces a number.')
@tags('int', 'integer', 'i', 'c', 'n', 'entier')
export class NumberNode extends InputControlNode<'integer'> {
	constructor(params?: NodeParams) {
		super({ label: 'Integer', ...params, controlType: 'integer', props: { class: 'w-3' } });
	}
}
