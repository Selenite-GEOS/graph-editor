import { ClassicPreset } from 'rete';
import { Node } from '$Node';
import { Socket } from '../../socket/Socket';
import { NodeFactory } from '$graph-editor/editor';

export class AddNode extends Node<{ a: Socket; b: Socket }, { value: Socket }> {
	constructor({ factory, a = 0, b = 0 }: { factory: NodeFactory; a?: number; b?: number }) {
		// super('Add', { factory });
		super({ label: 'Add', factory });
		this.height = 160;

		this.addInData('a', { type: 'number', initial: a });
		this.addInData('b', { type: 'number', initial: b });

		this.addOutput('value', new ClassicPreset.Output(new Socket({ type: 'number' }), ''));
	}

	data(
		inputs: Record<string, unknown>
	): Record<string, unknown> | Promise<Record<string, unknown>> {
		const a = this.getData<'number'>('a', inputs) ?? NaN;
		const b = this.getData<'number'>('b', inputs) ?? NaN;

		return { value: a + b };
	}
}
