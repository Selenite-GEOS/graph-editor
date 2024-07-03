import { Node, type NodeParams } from '$Node';

export class NotNode extends Node {
	constructor(params: NodeParams) {
		super({
			label: 'Not',
			width: 100,
			height: 135,
			...params
		});
		this.addInData({ name: 'value', displayName: 'Value', socketLabel: 'Value', type: 'boolean' });
		this.addOutData({ name: 'value', type: 'boolean' });
	}

	data(inputs?: Record<string, unknown> | undefined): Record<string, unknown> {
		const value = this.getData('value', inputs) as boolean;

		return {
			value: !value
		};
	}
}
