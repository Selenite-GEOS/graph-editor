import { GraphVersionStore } from '$houdini';
import { NodeFactory, NodeEditor } from '$graph-editor/editor';
import type { NodeEditorSaveData } from '$graph-editor/editor';
import  { type InputControl, type Input, assignControl } from '$graph-editor/socket';
import { ExecSocket } from '$graph-editor/socket/ExecSocket';
import { getLeavesFromOutput } from './utils';
import { get } from 'svelte/store';
import wu from 'wu';
import { VariableNode, Node, Connection } from '$graph-editor/nodes';

export class InputNode extends Node {
	private value: unknown;

	constructor({ factory, isArray }: { factory: NodeFactory; isArray: boolean }) {
		super({ factory });
		this.addOutData({
			name: 'value',
			isArray
		});
	}

	override data(inputs?: Record<string, unknown> | undefined): Record<string, unknown> {
		return { value: this.value };
	}

	setValue(val: unknown) {
		this.value = val;
		this.factory.dataflowEngine.reset(this.id);
	}
}

class OutExecNode extends Node {
	onExecute: () => Promise<void>;

	constructor({ factory, onExecute }: { factory: NodeFactory; onExecute: () => Promise<void> }) {
		super({ factory });
		this.onExecute = onExecute;
		this.addInExec();
	}

	override async execute(input: string, forward: (output: string) => unknown): Promise<void> {
		await this.onExecute();
		super.execute(input, forward);
	}
}

export class MacroNode extends Node {
	static hidden = true;

	readonly macroEditor: NodeEditor;
	readonly macroFactory: NodeFactory;
	private inputNodes: Record<string, InputNode> = {};
	private macroInputs: Record<string, Input> = {};
	forward?: (output: string) => unknown;

	graphId: string;

	protected state: {
		[key: string]: unknown;
		variablesValues: Record<string, unknown>;
	} = { ...this.state, variablesValues: {} };

	constructor({
		factory,
		saveData,
		graphId,
		graphVersion = 1
	}: {
		factory: NodeFactory;
		saveData: NodeEditorSaveData;
		graphId: string;
		graphVersion: number;
	}) {
		super({ factory, params: { saveData, graphId, graphVersion }, height: 60, width: 200 });
		this.graphId = graphId;

		// Setup macro editor
		this.macroEditor = new NodeEditor();
		this.macroFactory = new NodeFactory({
			editor: this.macroEditor,
			makutuClasses: factory.makutuClasses
		});

		this.macroEditor.addPipe(async (ctx) => {
			if (ctx.type === 'connectioncreate') {
				const outputSocket = this.macroEditor.getNode(ctx.data.source).outputs[
					ctx.data.sourceOutput
				]?.socket;
				const inputSocket = this.macroEditor.getNode(ctx.data.target).inputs[ctx.data.targetInput]
					?.socket;
				if (outputSocket?.isArray === true && inputSocket?.isArray === true) {
					if (ctx.data.targetInput in inputSocket.node.ingoingDataConnections) {
						for (const conn of inputSocket.node.ingoingDataConnections[ctx.data.targetInput]) {
							await this.macroEditor.removeConnection(conn.id);
						}
					}
				}
			}
			return ctx;
		});

		// Compute number of sockets
		let numSockets = 0;
		for (const node of saveData.nodes) {
			numSockets += node.selectedInputs.length + node.selectedOutputs.length;
		}
		// this.height += numSockets * 55;

		// Initialize the macro editor with all the nodes
		this.initializePromise = this.initialize({
			graphId,
			saveData,
			setHeight: (height: number) => this.setHeight(height)
		});
		this.onRemoveIngoingConnection = (conn: Connection) => {
			const macroKey = conn.targetInput;
			if (!(macroKey in this.inputNodes)) return;
			const inputNode = this.inputNodes[macroKey];
			if (!inputNode) throw new Error('Input node not found for ' + macroKey);

			inputNode.setValue(this.getData(macroKey));
		};
		// this.afterInitialize = () => {
		//     console.log("MacroNode.afterInitialize")
		//     let numSockets = 0;
		//     for (const node of this.macroEditor.getNodes()) {
		//         numSockets += Object.keys(node.socketSelectionComponent.selectedInputs()).length + Object.keys(node.socketSelectionComponent.selectedOutputs()).length;
		//     }
		//     this.height += numSockets * 55;
		//     this.updateElement();
		// }
	}

	setHeight(height: number) {
		this.height = height;
	}

	async initialize(params: {
		graphId: string;
		saveData: NodeEditorSaveData;
		setHeight: (height: number) => void;
	}): Promise<void> {
		const { saveData, setHeight } = params;

		this.label = saveData.editorName;
		await this.macroFactory.loadGraph(saveData);
		// Variables
		const variables = get(this.macroEditor.variables);
		for (const v of Object.values(variables)) {
			if (!v.exposed) continue;
			const controlType = assignControl(v.type);
			if (!controlType) {
				console.error('unhandled socket type', v.type, 'for variable', v.id, 'with value', v.value);
				continue;
			}
			this.addInData({
				name: v.id,
				displayName: v.name,
				initial: v.value,
				isArray: v.isArray,
				control: v.isArray
					? undefined
					: {
							type: controlType,

							options: {
								label: v.name,
								initial: v.value,
								change: (value) => {
									try {
										this.factory.dataflowEngine.reset(this.id);
									} catch (e) {
										console.warn('dataflow engine reset');
									}
									// Store variables values in state
									// so it can be saved and restored
									this.state.variablesValues[v.id] = value;
									this.macroEditor.variables.set({
										...get(this.macroEditor.variables),
										[v.id]: { ...v, value }
									});
									wu(this.macroEditor.getNodes())
										.filter((n) => n instanceof VariableNode && n.variableId === v.id)
										.forEach((n) => {
											this.macroFactory.dataflowEngine.reset(n.id);
										});
								}
							}
						},
				type: v.type,
				socketLabel: v.name
			});
			this.height += 65;
		}

		for (const node of this.macroEditor.getNodes()) {
			for (const [key, input] of Object.entries(node.socketSelectionComponent.selectedInputs())) {
				const isMicroMacroInput = key.includes('¤');

				const macroKey = key + '¤' + node.id;
				if (input.socket instanceof ExecSocket) {
					this.addInExec(macroKey, input.socket.name);
					setHeight(this.height + 33);
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
						microMacroNode = microMacroNode.macroFactory.getNode(microMacroNodeId) as MacroNode;
					}
					// console.log("loop microMacroNode", microMacroNode)
					inputNode = microMacroNode.inputNodes[microKey + '¤' + microNodeId];
					console.log('Deleting micro macro input', microKey + '¤' + microNodeId);
					delete microMacroNode.macroInputs[key];
					console.log('micromacro macro inputs', microMacroNode.macroInputs);
				} else {
					inputNode = await this.macroFactory.addNode(InputNode, {
						isArray: input.socket.isArray
					});
					if (!inputNode) throw new Error('Failed to add input node ' + macroKey);
					await this.macroEditor.addNewConnection(inputNode, 'value', node, key);
				}

				this.inputNodes[macroKey] = inputNode;

				const baseInputControl = input.control as InputControl<'text'> | undefined;

				this.macroInputs[macroKey] = this.addInData({
					name: macroKey,
					displayName: input.socket.name,
					type: input.socket.type,
					isArray: input.socket.isArray,
					isRequired: input.socket.isRequired,
					socketLabel: input.socket.name,
					control: baseInputControl
						? {
								type: baseInputControl.type,
								options: {
									...baseInputControl.options,
									initial: baseInputControl.value,
									debouncedOnChange: async (val: unknown) => {
										inputNode.setValue(val);
										console.log(inputNode);
										inputNode.getFactory().dataflowEngine.reset(inputNode.id);
										// this.factory.dataflowEngine.reset(this.id)
										try {
											this.factory.dataflowEngine.reset(this.id);
										} catch (e) {
											console.error('bozo');
										}
									}
								}
							}
						: undefined
				});
				setHeight(this.height + (baseInputControl ? 65 : 37));
				if (baseInputControl) inputNode.setValue(baseInputControl.value);
			}
			for (const [microKey, output] of Object.entries(
				node.socketSelectionComponent.selectedOutputs()
			)) {
				const macroKey = microKey + '¤' + node.id;
				console.log('macroKey', macroKey);
				if (output.socket instanceof ExecSocket) {
					this.addOutExec(macroKey, output.socket.name);
					const execNode = await this.macroFactory.addNode(OutExecNode, {
						onExecute: async () => {
							if (macroKey in this.outgoingExecConnections) {
								const conn = this.outgoingExecConnections[macroKey][0];
								if (!this.forward) throw new Error('Forward not set');
								const promises = this.getWaitPromises(getLeavesFromOutput(this, macroKey));
								this.factory.getControlFlowEngine().execute(conn.target, conn.targetInput);
								await Promise.all(promises);
							}
							// this.execute(macroKey, () => {});
						}
					});

					await this.macroEditor.addNewConnection(node, microKey, execNode, 'exec');
					setHeight(this.height + 33);
					continue;
				}
				this.addOutData({
					name: macroKey,
					displayName: output.socket.name,
					type: output.socket.type,
					isArray: output.socket.isArray,
					socketLabel: output.socket.name
				});
				setHeight(this.height + 37);
			}
		}
		this.updateElement();
	}

	override applyState(): void {
		if (!this.state.variablesValues) return;
		for (const [key, value] of Object.entries(this.state.variablesValues)) {
			const control = this.inputs[key]?.control as InputControl<'unknown'>;
			if (control) {
				// console.log('MacroNode.applyState', key, value);
				control.setValue(value);
				// control.options.change(value);
			}
		}
	}

	override execute(input: string, forward: (output: string) => unknown): void {
		this.forward = forward;
		const [key, nodeId] = input.split('¤');
		this.macroFactory.getControlFlowEngine().execute(nodeId, key);
		super.execute(input, forward, false);
	}

	override async data(inputs: Record<string, unknown[]>): Promise<Record<string, unknown>> {
		this.macroFactory.dataflowEngine.reset();
		const variables = get(this.macroEditor.variables);
		for (const key in variables) {
			variables[key].value = this.getData(key, inputs);
		}
		this.macroEditor.variables.set(variables);

		console.log('macro node inputs', inputs);
		console.log('macroeditor', this.macroEditor);
		console.log('variables', variables);

		// Set macro input nodes values
		for (const [macroKey, input] of Object.entries(this.macroInputs)) {
			const [microKey, nodeId] = macroKey.split('¤');
			this.inputNodes[macroKey].setValue(this.getData(macroKey, inputs));
			console.log('macroKey', 'setting value', this.getData(macroKey, inputs));
		}

		const res: Record<string, unknown> = {};
		for (const outputKey of Object.keys(this.outputs)) {
			const [microOutputKey, microNodeId, ...microMacroNodeIds] = outputKey.split('¤');

			// In case of several nested macro nodes, find the appropriate micro factory to get the
			// right data node
			let macroFactory = this.macroFactory;
			while (microMacroNodeIds.length > 0) {
				const microMacroNodeId = microMacroNodeIds.pop() as string;
				macroFactory = (macroFactory.getNode(microMacroNodeId) as MacroNode).macroFactory;
			}

			const microRes = await macroFactory.dataflowEngine.fetch(microNodeId);
			res[outputKey] = microRes[microOutputKey];
		}
		console.log('MacroNode.data', res);
		return res;
	}

	async isOutdated(): Promise<boolean> {
		const version = (
			await new GraphVersionStore().fetch({
				variables: {
					id: this.graphId
				}
			})
		).data?.graph.graph.version;
		if (version === undefined) throw new Error('Failed to fetch graph version');
		return version !== this.params.graphVersion;
	}
}
