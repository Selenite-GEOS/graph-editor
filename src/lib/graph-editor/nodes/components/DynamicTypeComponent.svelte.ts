import { NodeComponent, type NodeComponentParams } from '$graph-editor/components';
import type { DataType, SocketType } from '$graph-editor/plugins/typed-sockets';
import type { Socket } from '$graph-editor/socket';
import { ErrorWNotif } from '$lib/global/todo.svelte';
import type { Node } from '../Node.svelte';

type R = Record<string, Socket>;
export type DynamicTypeParams<
	Inputs extends R = R,
	Outputs extends Record<string, Socket> = Record<string, Socket>
> = NodeComponentParams<Inputs, Outputs> & {
	initial?: SocketType;
	inputs?: (keyof Inputs)[];
	outputs?: (keyof Outputs)[];
};
export class DynamicTypeComponent<
	Inputs extends Record<string, Socket> = Record<string, Socket>,
	Outputs extends Record<string, Socket> = Record<string, Socket>
> extends NodeComponent<Inputs, Outputs> {
	numConnections = 0;

	get state() {
		return this.node.state.dynamicTypeCmpnt as { type: SocketType };
	}

	get dynamicTypeInputs(): (keyof Inputs)[] | '*' {
		return this.params.inputs ?? [];
	}
	get dynamicTypeOutputs(): (keyof Outputs)[] | '*' {
		return this.params.outputs ?? [];
	}
	params: DynamicTypeParams<Inputs, Outputs>;
	constructor(params: DynamicTypeParams<Inputs, Outputs>) {
		super(params);
		this.params = params;
		const node = this.node as Node<
			Record<string, Socket>,
			Record<string, Socket>,
			{},
			{ dynamicTypeCmpnt: { type: SocketType } }
		>;
		if (!node.state.dynamicTypeCmpnt) {
			node.state.dynamicTypeCmpnt = { type: params.initial ?? 'any' };
		}
		this.changeType(this.state.type);

		this.cleanup = $effect.root(() => {
			$effect(() => {
				const factory = node.factory;
				if (!factory) return;
				const editor = factory.editor;
				// const isSetupState = factory.useState('dynamic-type-component', 'isSetup', false)
				console.debug('Adding dynamic type pipe');

				node.getEditor()?.addPipe((context) => {
					if (context.type !== 'connectioncreated' && context.type !== 'connectionremoved')
						return context;

					const conn = context.data;

					if (
						(conn.target !== node.id ||
							(this.dynamicTypeInputs !== '*' &&
								!this.dynamicTypeInputs.includes(conn.targetInput))) &&
						(conn.source !== node.id ||
							(this.dynamicTypeOutputs !== '*' &&
								!this.dynamicTypeOutputs.includes(conn.sourceOutput)))
					)
						return context;

					if (context.type === 'connectionremoved') {
						this.numConnections--;
						console.debug('numConnections', this.numConnections);

						if (this.numConnections === 0) this.changeType('any');
					} else if (context.type === 'connectioncreated') {
						this.numConnections++;

						if (node.state.dynamicTypeCmpnt?.type !== 'any') return context;

						if (conn.target === node.id) {
							const sourceNode = editor.getNode(conn.source);
							if (!sourceNode) throw new ErrorWNotif('Failed to find source node');
							const sourceOutput = sourceNode.outputs[conn.sourceOutput];
							if (sourceOutput) this.changeType(sourceOutput.socket.type);
						} else if (conn.source === node.id) {
							const targetNode = editor.getNode(conn.target);
							if (!targetNode) throw new ErrorWNotif('Failed to find target node');
							const targetInput = targetNode.inputs[conn.targetInput];
							if (targetInput) this.changeType(targetInput.socket.type);
						}
					}

					return context;
				});
			});
		});
	}
	changeType(type: SocketType) {
		// console.log('changeType', type);
		// console.log('this.state.type', this.state.type);

		// if (type === this.state.type) return;
		console.debug('changeType', type);

		this.state.type = type;

		for (const input of this.dynamicTypeInputs) {
			const inp = this.node.inputs[input];
			if (inp) inp.socket.type = type;
		}
		for (const output of this.dynamicTypeOutputs) {
			const out = this.node.outputs[output];
			if (out) out.socket.type = type;
		}

		this.node.updateElement();
	}
}
