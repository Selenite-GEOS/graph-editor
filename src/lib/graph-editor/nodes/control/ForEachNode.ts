import { Node, path, registerNode, tags, type NodeParams, type SocketsValues } from '../Node.svelte';
import { getLeavesFromOutput } from '../utils';
import type { DataType, SocketType } from '../../plugins/typed-sockets';
import type { ExecSocket, Socket } from '$graph-editor/socket';
import { DynamicTypeComponent } from '../components/DynamicTypeComponent.svelte';

// Class defining a For Each Node
@registerNode('control.ForEach')
@path('Array')
@tags('loop', 'iteration')
export class ForEachNode<T extends DataType = DataType> extends Node<
	{ exec: ExecSocket; array: Socket<DataType, 'array'> },
	{
		loop: ExecSocket;
		exec: ExecSocket;
		item: Socket<DataType, 'scalar'>;
		index: Socket<'number', 'scalar'>;
	}
> {
	currentItemIndex?: number = -1;
	// state = { ...this.state, type: 'any' };
	numConnections = 0;

	constructor(params: NodeParams = {}) {
		super({ ...params, label: 'For Each' });
		const initialType: DataType = 'number';
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
		let dynamicTypeCmpnt: DynamicTypeComponent | undefined;
		this.addInData('array', {	
			control: {
				canChangeType: true
			},
			datastructure: 'array',
			type: initialType,
			changeType: (type) => {
				if (type === 'exec') {
					throw new Error('Cannot use exec as type');
				}
				if (!dynamicTypeCmpnt) return;
				dynamicTypeCmpnt.changeType(type);
				if (this.inputs.array?.socket) this.inputs.array.socket.type = type;
				if (this.outputs.item?.socket) this.outputs.item.socket.type = type;
			}
		});
		this.addOutData('item', {
			type: initialType
		});
		this.addOutData('index', {
			type: 'number'
		});
		dynamicTypeCmpnt = this.addComponentByClass(DynamicTypeComponent, {
			inputs: ['array'],
			outputs: ['item'],
			initial: initialType
		});
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
			this.processDataflow();
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
		const array = this.getData('array', inputs);
		if (this.currentItemIndex === undefined || this.currentItemIndex === -1) {
			return { item: array?.at(0), index: 0 };
		}
		const item = array[this.currentItemIndex];
		return { item, index: this.currentItemIndex };
	}
}
