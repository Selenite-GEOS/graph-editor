import { ClassicPreset } from 'rete';
import { Node } from '../Node';
import { Socket } from '../../socket/Socket';
import type { NodeFactory } from '../NodeFactory';

/**
 * This node displays the value of the input.
 */
export class DisplayNode extends Node {
	height = 120;
	width = 180;

	constructor({
		factory,
		initial = 0,
		change
	}: {
		factory: NodeFactory;
		initial?: unknown;
		change?: () => void;
	}) {
		// super('Display', { factory });
		super({ label: 'Display', factory, params: { initial, change } });

		// Setup input
		this.addInData({
			name: 'input',
			displayName: 'Input',
			control: {
				type: 'text',
				options: {
					debouncedOnChange: (value: string) => {
						console.log('debounced display input change');
						this.getDataflowEngine().reset(this.id);
						this.getDataflowEngine().fetch(this.id);
					}
				}
			}
		});

		// Display value
		this.addControl('display', new ClassicPreset.InputControl('text', { initial, readonly: true }));
	}

	data(inputs: { input?: number[] }): Record<string, unknown> | Promise<Record<string, unknown>> {
		const inputValue = this.getData('input', inputs);
		console.log('Data');
		if (this.controls.display instanceof ClassicPreset.InputControl) {
			this.controls.display.setValue(inputValue);
			this.updateElement('control', this.controls.display.id);
		} else {
			console.error('DisplayNode', 'this.controls.display is not an InputControl');
		}

		return {};
	}
}
