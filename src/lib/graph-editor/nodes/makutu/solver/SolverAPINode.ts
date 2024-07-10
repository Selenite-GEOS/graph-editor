import type { APINodeParams } from '$graph-editor/node/APINode';
import type { NodeParams } from '../../Node.svelte';
import { ObjectAPINode } from '../../ObjectAPINode';

export class SolverAPINode extends ObjectAPINode {
	// constructor(name: string, url: string, { factory, height = 218, width = undefined }: NodeParams) {
	constructor(params: APINodeParams) {
		const { label = '', url = '', factory, height = 218, width = undefined } = params;
		super({
			...params,
			label: label,
			url: '/makutu/solver' + url,
			height: height,
			width: width,
			objectKey: 'solver',
			objectLabel: 'Solver',
			factory
		});
	}
}
