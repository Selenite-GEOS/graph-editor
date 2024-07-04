import { Node } from '$Node';
import type { NodeFactory } from '$graph-editor/editor';

export class SelectNode extends Node {
	state: { pickA: boolean } = { ...this.state, pickA: '' };

	constructor({ factory }: { factory: NodeFactory }) {
		super({ factory, label: 'Select', height: 255 });

		this.oldAddInData({
			name: 'a',
			displayName: 'A',
			type: 'any'
		});
		this.oldAddInData({
			name: 'b',
			displayName: 'B',
			type: 'any'
		});

		this.oldAddInData({
			name: 'pickA',
			socketLabel: 'Pick A',
			displayName: 'Pick A',
			type: 'boolean',
			control: {
				type: 'checkbox',
				options: {
					label: 'Pick A',
					initial: true,
					change: () => setTimeout(this.processDataflow)
				}
			}
		});

		this.addOutData({
			name: 'value',
			type: 'any'
		});
	}

	data(inputs?: Record<string, unknown> | undefined): Record<string, unknown> {
		return {
			value: this.getData('pickA', inputs) ? this.getData('a', inputs) : this.getData('b', inputs)
		};
	}
}
