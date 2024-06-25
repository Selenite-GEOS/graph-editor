import { ClassicPreset as Classic, ClassicPreset, NodeEditor } from 'rete';
import { DataflowEngine } from 'rete-engine';
import type DataflowNode from 'rete-engine';
import { Node } from '../Node';
import { Socket } from '../../socket/Socket';
import { NodeFactory } from '../NodeFactory';

export class AddNode extends Node {
	constructor({ factory, a = 0, b = 0 }: { factory: NodeFactory; a?: number; b?: number }) {
		// super('Add', { factory });
		super({ label: 'Add', factory });
		this.height = 160;

		const left = new ClassicPreset.Input(new Socket({ type: 'number' }), '');
		const right = new ClassicPreset.Input(new Socket({ type: 'number' }), '');

		left.addControl(
			new ClassicPreset.InputControl('number', {
				initial: a,
				change: this.processDataflow
			})
		);
		right.addControl(
			new ClassicPreset.InputControl('number', {
				initial: b,
				change: this.processDataflow
			})
		);

		this.addInput('left', left);
		this.addInput('right', right);

		this.addOutput('value', new ClassicPreset.Output(new Socket({ type: 'number' }), ''));
	}

	data(inputs: {
		left?: number[];
		right?: number[];
	}): Record<string, unknown> | Promise<Record<string, unknown>> {
		const leftControl = this.inputs.left?.control as ClassicPreset.InputControl<'number'>;

		const rightControl = this.inputs.right?.control as ClassicPreset.InputControl<'number'>;

		// iterates inputs and foreach input update the value of the control
		// for (const input in inputs) {
		// 	console.log('input', input);
		// }

		const { left, right } = inputs;
		const value =
			(left ? left[0] : leftControl.value || 0) + (right ? right[0] : rightControl.value || 0);

		if (this.outputs.value) this.outputs.value.socket.value = value;

		// this.controls.value.setValue(value);

		// if (this.update) this.update(this.controls.value);

		return { value };
	}
}
