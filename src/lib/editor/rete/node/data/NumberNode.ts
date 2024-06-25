import { Node } from '../Node';
import type { NodeFactory } from '../NodeFactory';
import { InputControl } from '$rete/control/Control';

export class NumberNode extends Node {
	height = 130;
	width = 180;

	constructor({
		factory,
		initial = 0,
		change
	}: {
		factory: NodeFactory;
		initial: number;
		change?: () => void;
	}) {
		// super('Number', { factory });
		super({ label: 'Number', factory, params: { initial, change } });
		this.addControl(
			'value',
			new InputControl('number', {
				initial,
				debouncedOnChange: this.processDataflow
			})
		);
		this.addOutData({ name: 'value', type: 'number' });
	}

	data(): Record<string, unknown> | Promise<Record<string, unknown>> {
		return {
			value: this.controls.value instanceof InputControl ? this.controls.value.value : 0
		};
	}
}
