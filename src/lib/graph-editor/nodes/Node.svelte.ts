import { Node, type NodeParams } from './Node';

export class SvelteNode extends Node {
	c = $state(0);
	constructor(params: NodeParams) {
		super(params);
		const step = 2 * Math.random() - 1;
		setInterval(() => {
			this.c = this.c + step;
			// console.log("node c", this.c)
		}, 0);
	}
}
