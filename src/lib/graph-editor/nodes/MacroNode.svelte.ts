// import { GraphVersionStore } from '$houdini';
import { NodeFactory, NodeEditor } from '$graph-editor/editor';
import type { NodeEditorSaveData } from '$graph-editor/editor';
import { type InputControl, type Input, assignControl, Socket } from '$graph-editor/socket';
import { ExecSocket } from '$graph-editor/socket/ExecSocket';
import { getLeavesFromOutput } from './utils';
import {
	Node,
	Connection,
	registerNode,
	hidden,
	type SocketsValues
} from '$graph-editor/nodes/Node.svelte';

import type { DataType } from '$graph-editor/plugins/typed-sockets';
import type { StoredGraph } from '$graph-editor/storage/types';
import { NodeStorage, VariableNode, type NodeParams } from '$graph-editor';
import { cloneDeep, upperFirst } from 'lodash-es';
import { tick } from 'svelte';
import { sleep } from '@selenite/commons';

@registerNode('macro.Input')
@hidden
export class InputNode extends Node<{}, { value: Socket<DataType> }> {
	#value: unknown;

	constructor(params: NodeParams & { isArray?: boolean } = {}) {
		super(params);
		this.addOutData('value', {
			type: 'any',
			datastructure: params.isArray ? 'array' : 'scalar'
		});
	}

	data(
		inputs?: SocketsValues<{}> | undefined
	): SocketsValues<{ value: Socket<DataType, 'scalar' | 'array'> }> {
		return { value: this.value };
	}

	get value() {
		return this.#value;
	}

	set value(v: unknown) {
		this.#value = v;
		this.factory?.dataflowEngine.reset(this.id);
	}

	setValue(val: unknown) {
		this.value = val;
	}
}

@registerNode('macro.OutExec')
@hidden
class OutExecNode extends Node {
	onExecute?: () => Promise<void>;

	constructor(params: NodeParams & { onExecute?: () => Promise<void> } = {}) {
		super(params);
		this.onExecute = params.onExecute;
		this.addInExec();
	}

	override async execute(input: string, forward: (output: string) => unknown): Promise<void> {
		await this.onExecute?.();
		super.execute(input, forward);
	}
}

function makeMacroKey(microKey: string, nodeId: string): string {
	return microKey + '¤' + nodeId;
}

@registerNode('macro.Macro')
@hidden
export class MacroNode extends Node {
	readonly macroEditor?: NodeEditor;
	readonly macroFactory?: NodeFactory;
	private inputNodes: Record<string, InputNode> = {};
	private macroInputs: Record<string, Input> = {};
	forward?: (output: string) => unknown;

	graph = $state<StoredGraph>();

	constructor(
		params: NodeParams & {
			graph?: StoredGraph;
		} = {}
	) {
		const { graph } = params;
		super({ label: graph?.name, ...params, params: { graph } });
		if (!graph) return;
		this.graph = graph;
		const graphData = graph.graph;
		const g = graphData;
		this.description = graph.description;
		// Setup macro editor
		this.macroEditor = new NodeEditor();
		this.macroFactory = new NodeFactory({
			editor: this.macroEditor
		});
		const macroEditor = this.macroEditor;

		//
		// VARIABLES
		//
		// Load variables
		const savedVars = graphData.variables;
		for (const v of Array.isArray(savedVars) ? savedVars : Object.values(savedVars)) {
			this.macroEditor.variables[v.id] = v;
		}

		// Add variables inputs
		for (const { keep, id, description, label, priority } of graph.variables ?? []) {
			if (!keep) continue;
			const v = this.macroEditor.variables[id];
			const controlType = assignControl(v.type);
			if (!controlType) {
				console.error('unhandled socket type', v.type, 'for variable', v.id, 'with value', v.value);
				continue;
			}
			this.addInData(v.id, {
				index: priority,
				label: label ?? v.name,
				description,
				initial: v.value,
				datastructure: v.isArray ? 'array' : 'scalar',
				type: v.type,
				alwaysShowLabel: true,
				control: {
					initial: v.value,
					onChange: async (val: unknown) => {
						if (!this.macroEditor) return;
						this.macroEditor.variables[v.id].value = val;
					}
				}
			});
		}

		//
		// Nodes Inputs
		//
		if (graph.inputs) {
			for (const i of graph.inputs) {
				const macroKey = makeMacroKey(i.key, i.nodeId);
				let initial = i.default;
				if (typeof i.default === 'string')
					try {
						initial = JSON.parse(i.default);
					} catch (e) {}
				this.macroInputs[macroKey] = this.addInData(macroKey, {
					label: i.label,
					type: i.type,
					initial,
					index: i.priority,
					description: i.description,
					datastructure: i.datastructure,
					isRequired: true,
					alwaysShowLabel: true,
					control: {
						onChange: async (val: unknown) => {
							this.inputNodes[macroKey]?.setValue(val);
						}
					}
				});
			}
		}

		// Node Outputs
		if (graph.outputs) {
			for (const o of graph.outputs) {
				const macroKey = makeMacroKey(o.key, o.nodeId);
				this.addOutData(macroKey, {
					index: typeof o.priority !== 'undefined' ? -o.priority : undefined,
					label: upperFirst(o.label),
					description: o.description,
					type: o.type,
					datastructure: o.datastructure
				});
			}
		}

		// Replace array connections instead of merging
		this.macroEditor.addPipe(async (ctx) => {
			if (ctx.type === 'connectioncreate') {
				const outputSocket = this.macroEditor!.getNode(ctx.data.source)?.outputs[
					ctx.data.sourceOutput
				]?.socket;
				const inputSocket = this.macroEditor!.getNode(ctx.data.target)?.inputs[ctx.data.targetInput]
					?.socket;
				if (outputSocket?.datastructure === 'array' && inputSocket?.datastructure === 'array') {
					if (ctx.data.targetInput in inputSocket.node.ingoingDataConnections) {
						for (const conn of inputSocket.node.ingoingDataConnections[ctx.data.targetInput]) {
							await this.macroEditor?.removeConnection(conn.id);
						}
					}
				}
			}
			return ctx;
		});

		// Initialize the macro editor with all the nodes
		this.initializePromise = this.initialize({
			graphId: graph.id,
			saveData: graph.graph
		});

		this.onRemoveIngoingConnection = (conn: Connection) => {
			const macroKey = conn.targetInput;
			if (!(macroKey in this.inputNodes)) return;
			const inputNode = this.inputNodes[macroKey];
			if (!inputNode) throw new Error('Input node not found for ' + macroKey);

			inputNode.setValue(this.getData(macroKey));
		};
	}

	async initialize(params: { graphId: string; saveData: NodeEditorSaveData }): Promise<void> {
		if (!this.macroFactory || !this.macroEditor) return;
		const { saveData } = params;

		this.label = saveData.editorName;
		await this.macroFactory.loadGraph(saveData);
		// Variables

		for (const node of this.macroEditor.getNodes()) {
			for (const [key, input] of Object.entries(node.socketSelectionComponent.selectedInputs())) {
				const isMicroMacroInput = key.includes('¤');

				const macroKey = key + '¤' + node.id;
				if (input.socket instanceof ExecSocket) {
					this.addInExec(macroKey, input.socket.name);
					continue;
				}
				let inputNode: InputNode;
				if (isMicroMacroInput) {
					const [microKey, microNodeId, ...microMacroNodeIds] = key.split('¤');
					let microMacroNode = node as MacroNode;
					while (microMacroNodeIds.length > 0) {
						const microMacroNodeId = microMacroNodeIds.pop() as string;
						// console.log("loop microMacroNode", microMacroNode)
						delete microMacroNode.macroInputs[key];
						microMacroNode = microMacroNode.macroFactory!.getNode(microMacroNodeId) as MacroNode;
					}
					// console.log("loop microMacroNode", microMacroNode)
					inputNode = microMacroNode.inputNodes[microKey + '¤' + microNodeId];
					// console.log('Deleting micro macro input', microKey + '¤' + microNodeId);
					delete microMacroNode.macroInputs[key];
					// console.log('micromacro macro inputs', microMacroNode.macroInputs);
				} else {
					inputNode = await this.macroFactory.addNode(InputNode, {
						isArray: input.socket.datastructure === 'array'
					});
					if (!inputNode) throw new Error('Failed to add input node ' + macroKey);
					for (const conn of [
						...(node.ingoingDataConnections[key] ?? []),
						...(node.ingoingExecConnections[key] ?? [])
					]) {
						await this.macroEditor.removeConnection(conn.id);
					}

					await this.macroEditor.addNewConnection(inputNode, 'value', node, key);
				}

				this.inputNodes[macroKey] = inputNode;

				const baseInputControl = input.control as InputControl<'text'> | undefined;

				// this.macroInputs[macroKey] = this.addInData(macroKey, {
				// 	label: input.socket.name,
				// 	type: input.socket.type,
				// 	datastructure: input.socket.datastructure,
				// 	isRequired: input.socket.isRequired,
				// 	control: baseInputControl
				// 		? {
				// 				initial: baseInputControl.value,
				// 				onChange: async (val: unknown) => {
				// 					inputNode.value = val;
				// 					this.macroFactory?.dataflowEngine.reset(inputNode.id);
				// 				}
				// 			}
				// 		: undefined
				// });
				// this.macroInputs[macroKey] = this.oldAddInData({
				// 	name: macroKey,
				// 	displayName: input.socket.name,
				// 	type: input.socket.type,
				// 	isArray: input.socket.isArray,
				// 	isRequired: input.socket.isRequired,
				// 	socketLabel: input.socket.name,
				// 	control: baseInputControl
				// 		? {
				// 				type: baseInputControl.type,
				// 				options: {
				// 					...baseInputControl.options,
				// 					initial: baseInputControl.value,
				// 					debouncedOnChange: async (val: unknown) => {
				// 						inputNode.setValue(val);
				// 						console.log(inputNode);
				// 						inputNode.getFactory().dataflowEngine.reset(inputNode.id);
				// 						// this.factory.dataflowEngine.reset(this.id)
				// 						try {
				// 							this.factory.dataflowEngine.reset(this.id);
				// 						} catch (e) {
				// 							console.error('bozo');
				// 						}
				// 					}
				// 				}
				// 			}
				// 		: undefined
				// });
				if (baseInputControl) inputNode.value = baseInputControl.value;
			}
			for (const [microKey, output] of Object.entries(
				node.socketSelectionComponent.selectedOutputs()
			)) {
				const macroKey = makeMacroKey(microKey, node.id);
				// console.log('macroKey', macroKey);
				if (output.socket instanceof ExecSocket) {
					this.addOutExec(macroKey, output.socket.name);
					const execNode = await this.macroFactory.addNode(OutExecNode, {
						onExecute: async () => {
							if (macroKey in this.outgoingExecConnections) {
								const conn = this.outgoingExecConnections[macroKey][0];
								if (!this.forward) throw new Error('Forward not set');
								const promises = this.getWaitPromises(getLeavesFromOutput(this, macroKey));
								this.factory?.getControlFlowEngine().execute(conn.target, conn.targetInput);
								await Promise.all(promises);
							}
							// this.execute(macroKey, () => {});
						}
					});

					await this.macroEditor.addNewConnection(node, microKey, execNode, 'exec');
					continue;
				}
			}
		}
		this.updateElement();
	}

	override execute(input: string, forward: (output: string) => unknown): void {
		if (!this.macroFactory) return;
		this.forward = forward;
		const [key, nodeId] = input.split('¤');
		this.macroFactory.getControlFlowEngine().execute(nodeId, key);
		super.execute(input, forward, false);
	}

	async data(inputs?: SocketsValues<R> | undefined): Promise<SocketsValues<{}>> {
		// console.log(this.graph?.name, "macro in data", inputs)
		if (!this.macroFactory) throw new Error('Macro factory not set');
		if (!this.macroEditor) throw new Error('Macro editor not set');
		const variables = this.macroEditor.variables;
		for (const key in variables) {
			this.macroEditor.variables[key].value = this.getData(key, inputs);
		}

		// Set macro input nodes values
		for (const [macroKey, input] of Object.entries(this.macroInputs)) {
			// console.log('setting input', macroKey, 'to', this.getData(macroKey, inputs));
			this.inputNodes[macroKey].value = this.getData(macroKey, inputs);
		}
		// Wait for states to update
		await tick();
		await this.macroFactory.resetDataflow();
		await sleep();

		const res: Record<string, unknown> = {};
		for (const outputKey of Object.keys(this.outputs)) {
			const [microOutputKey, microNodeId, ...microMacroNodeIds] = outputKey.split('¤');

			// In case of several nested macro nodes, find the appropriate micro factory to get the
			// right data node
			let macroFactory = this.macroFactory;
			while (microMacroNodeIds.length > 0) {
				const microMacroNodeId = microMacroNodeIds.pop() as string;
				macroFactory = (macroFactory.getNode(microMacroNodeId) as MacroNode)
					.macroFactory as NodeFactory;
			}
			const microRes = await macroFactory.dataflowEngine.fetch(microNodeId);
			// console.log(this.graph?.name, microNodeId,'microRes', microRes);
			res[outputKey] = microRes[microOutputKey];
		}

		// console.log(this.graph?.name, "macro out data", res)
		return res;
	}

	async isOutdated(): Promise<boolean> {
		if (!this.graph) return false;

		const version = (await NodeStorage.getGraph(this.graph.id))?.version;
		if (version === undefined) throw new Error('Failed to fetch graph version');
		return version !== this.params.graphVersion;
	}
}
