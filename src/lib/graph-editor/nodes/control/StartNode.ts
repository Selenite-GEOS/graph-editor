import { Node } from '../Node';
import { ButtonControl } from '$graph-editor/socket';
import type { NodeFactory } from '$graph-editor/editor';

export class StartNode extends Node {
	constructor({ factory }: { factory: NodeFactory }) {
		super({ label: 'Start', factory, height: 130 });
		this.addOutExec();
		this.addControl(
			'playBtn',
			new ButtonControl('Play', () => {
				this.factory.getControlFlowEngine().execute(this.id);
				console.log('play');
			})
		);
	}
	execute(_: never, forward: (output: 'exec') => void) {
		forward('exec');
	}
	data() {
		return {};
	}
}
