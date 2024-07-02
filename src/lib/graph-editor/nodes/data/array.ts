import { merge } from 'lodash-es';
import { Node, type NodeParams } from '../Node';

export class MergeArrays extends Node {
	constructor(params: NodeParams) {
		super({
			label: 'Merge Arrays',
			width: 150,
			height: 160,
			...params
		});
		this.addInData({ name: 'a', displayName: 'A', socketLabel: 'A', isArray: true, type: 'any' });
		this.addInData({ name: 'b', displayName: 'B', socketLabel: 'B', isArray: true, type: 'any' });
		this.addOutData({ name: 'value', isArray: true, type: 'any' });
	}

	data(inputs?: Record<string, unknown> | undefined): Record<string, unknown> {
		const a = this.getData('a', inputs) as unknown[];
		const b = this.getData('b', inputs) as unknown[];

		return {
			value: merge(a, b)
		};
	}
}
