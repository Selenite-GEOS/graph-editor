import { Connection, Node } from '../Node.svelte';
import { getLeavesFromOutput } from '../utils';
import type { NodeFactory } from '$graph-editor/editor';
import type { SocketType } from '../../plugins/typed-sockets';

// Class defining a For Each Node
export class ForEachNode extends Node {
	currentItemIndex?: number = undefined;
	state = { ...this.state, type: 'any' };
	numConnections = 0;

	constructor({ factory }: { factory: NodeFactory }) {
		super({ label: 'For Each', factory, height: 275 });

		this.pythonComponent.addVariables('item', 'index');
		this.pythonComponent.setCodeTemplateGetter(() => {
			return `
for $(index), $(item) in enumerate($(array)):
    {{loop}}?
{{exec}}
`;
		});

		this.addInExec();
		this.addOutExec('loop', 'Loop');
		this.oldAddInData({ name: 'array', displayName: 'Array', isArray: true });
		this.oldAddOutData({ name: 'item', displayName: 'Item' });
		this.oldAddOutData({ name: 'index', displayName: 'Index', type: 'number' });
		this.addOutExec('exec', 'Done');

		this.getEditor().addPipe((context) => {
			if (!['connectionremoved', 'connectioncreated'].includes(context.type)) return context;

			if (!('data' in context)) return context;

			if (!(context.data instanceof Connection)) return context;

			const conn = context.data;

			if (
				(conn.target !== this.id || conn.targetInput !== 'array') &&
				(conn.source !== this.id || conn.sourceOutput !== 'item')
			)
				return context;

			if (context.type === 'connectionremoved') {
				this.numConnections--;
				console.log('numConnections', this.numConnections);

				if (this.numConnections === 0) this.changeType('any');
			} else if (context.type === 'connectioncreated') {
				// }
				this.numConnections++;

				if (this.state.type !== 'any') return context;

				if (conn.target === this.id) {
					const sourceNode = this.getEditor().getNode(conn.source);
					const sourceOutput = sourceNode.outputs[conn.sourceOutput];
					if (sourceOutput) this.changeType(sourceOutput.socket.type);
				} else if (conn.source === this.id) {
					const targetNode = this.getEditor().getNode(conn.target);
					const targetInput = targetNode.inputs[conn.targetInput];
					if (targetInput) this.changeType(targetInput.socket.type);
				}
			}

			return context;
		});
	}
	changeType(type: SocketType) {
		// console.log('changeType', type);
		// console.log('this.state.type', this.state.type);

		if (type === this.state.type) return;
		// console.log('changeType', type);

		this.state.type = type;
		const input = this.inputs.array;

		if (input) {
			input.socket.type = type;
		}
		const output = this.outputs.item;
		if (output) {
			output.socket.type = type;
		}
		this.updateElement('node', this.id);
	}
	// Executes the node
	override async execute(input: string, forward: (output: string) => unknown): Promise<void> {
		const inputs = await this.fetchInputs();
		const array = inputs.array[0];

		for (let i = 0; i < array.length; i++) {
			this.currentItemIndex = i;

			this.getDataflowEngine().reset(this.id);
			const leavesFromLoopExec = getLeavesFromOutput(this, 'loop');
			const promises = this.getWaitPromises(leavesFromLoopExec);
			forward('loop');

			await Promise.all(promises);
		}

		super.execute(input, forward);
	}

	// Gets the data
	data(inputs: { array?: unknown[][] }): { item: unknown; index?: number } {
		if (this.currentItemIndex === undefined) {
			return { item: undefined, index: undefined };
		}

		const array = inputs.array ? inputs.array[0] : [];

		const item = array[this.currentItemIndex];
		return { item, index: this.currentItemIndex };
	}
}
