import { Node, registerNode, type NodeParams, type SocketsValues } from '../Node.svelte';
import { getLeavesFromOutput } from '../utils';
import type { DataType, SocketType } from '../../plugins/typed-sockets';
import type { ExecSocket, Socket } from '$graph-editor/socket';
import { DynamicTypeComponent } from '../components/DynamicTypeComponent';

// Class defining a For Each Node
@registerNode('control.ForEach')
export class ForEachNode<T extends DataType = DataType> extends Node<
	{ exec: ExecSocket; array: Socket<'any', 'array'> },
	{
		loop: ExecSocket;
		exec: ExecSocket;
		item: Socket<'any', 'scalar'>;
		index: Socket<'number', 'scalar'>;
	}
> {
	currentItemIndex?: number = -1;
	// state = { ...this.state, type: 'any' };
	numConnections = 0;

	constructor(params: NodeParams = {}) {
		super({ ...params, label: 'For Each' });

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
		this.addOutExec('exec', 'Done');
		this.addInData('array', {
			datastructure: 'array',
			type: 'any'
		});
		this.addOutData('item', {
			type: 'any'
		});
		this.addOutData('index', {
			type: 'number'
		});
		this.addComponentByClass(DynamicTypeComponent, { inputs: ['array'], outputs: ['item'] });
	}

	// Executes the node
	async execute(
		input: 'exec',
		forward: (output: 'exec' | 'loop') => unknown,
		forwardExec?: boolean
	): Promise<void> {
		const array = await this.getDataWithInputs('array');
		for (let i = 0; i < array.length; i++) {
			this.needsProcessing = true;
			this.currentItemIndex = i;

			this.getDataflowEngine().reset(this.id);
			const leavesFromLoopExec = getLeavesFromOutput(this, 'loop');
			const promises = this.getWaitPromises(leavesFromLoopExec);
			forward('loop');

			await Promise.all(promises);
			this.needsProcessing = false;
		}

		super.execute(input, forward);
	}

	data(
		inputs?: SocketsValues<{ exec: ExecSocket; array: Socket<'any', 'array'> }> | undefined
	): SocketsValues<{ item: Socket<'any', 'scalar'>; index: Socket<'number', 'scalar'> }> {
		if (this.currentItemIndex === undefined) {
			return { item: undefined, index: -1 };
		}
		const array = this.getData('array', inputs);
		const item = array[this.currentItemIndex];
		return { item, index: this.currentItemIndex };
	}
}
