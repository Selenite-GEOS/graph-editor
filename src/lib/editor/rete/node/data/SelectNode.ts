import { Node } from '../Node';
import type { NodeFactory } from '../NodeFactory';

export class SelectNode extends Node {
	state: { pickA: boolean } = { ...this.state, pickA: '' };

	constructor({ factory }: { factory: NodeFactory }) {
		super({ factory, label: 'Select', height: 255 });

		this.addInData({
			name: 'a',
			displayName: 'A',
			type: 'any'
		});
		this.addInData({
			name: 'b',
			displayName: 'B',
			type: 'any'
		});

		this.addInData({
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
