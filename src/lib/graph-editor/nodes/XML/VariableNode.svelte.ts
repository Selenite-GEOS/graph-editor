import type { NodeEditor, NodeFactory } from '$graph-editor/editor';
import type { Output, Scalar } from '$graph-editor/socket';
import { get } from 'svelte/store';
import { hidden, Node, registerNode, type NodeParams, type SocketsValues } from '$graph-editor/nodes/Node.svelte';
import { isEqual } from 'lodash-es';
import type { DataType } from '$graph-editor/plugins/typed-sockets';
import { untrack } from 'svelte';


@registerNode('variable.Get')
@hidden
export class VariableNode extends Node<{}, { value: Scalar<DataType>}> {
	public readonly variableId: string = '';
	private lastValue: unknown;
	variable = $derived(this.editor?.variables[this.variableId]);

	constructor(params: NodeParams & {variableId?: string} = {}) {
		const {variableId} = params;
		super({ ...params, params: { variableId } });
		if (!this.editor || !variableId) return;
		this.variableId = variableId;
		const variable = this.editor.variables[variableId];
		this.addOutData('value',  { ...variable,  label: variable.name });

		$effect.root(() => {
			$effect(() => {
				if (!this.variable) {
					this.factory?.removeNode(this.id);
				}
				this.variable?.value;
				untrack(() => {
					this.processDataflow();
				})
			})
			$effect(() => {
				this.variable?.name
				untrack(() => {
					const output = this.outputs['value'];
					if (!output) return;
					output.label = this.variable?.name;
					if (this.variable)
						this.description = `Get the variable: ${this.variable.name}`;
				})
			})
		})
		
		// this.editor.variables.subscribe(async (variables) => {
		// 	if (variableId in variables) {
		// 		this.label = variables[variableId].name;
		// 		(this.outputs['value'] as Output).socket.type = variables[variableId].type;
		// 		const value = variables[variableId].value;
		// 		if (!isEqual(this.lastValue, value)) setTimeout(this.processDataflow);
		// 		this.lastValue = value;
		// 	} else {
		// 		for (const conns of Object.values(this.outgoingDataConnections))
		// 			for (const conn of Object.values(conns)) await this.editor.removeConnection(conn.id);

		// 		await this.editor.removeNode(this.id);
		// 		return;
		// 	}
		// 	this.updateElement();
		// 	try {
		// 		this.factory.dataflowEngine.reset(this.id);
		// 	} catch (e) {}
		// });
	}

	data(inputs?: SocketsValues<{}> | undefined): SocketsValues<{ value: Scalar<DataType>; }> | Promise<SocketsValues<{ value: Scalar<DataType>; }>> {
		return {
			value: this.variable?.value
		}
	}
}
