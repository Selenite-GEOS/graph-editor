import { ClassicPreset } from 'rete';
import type { DataflowNode } from 'rete-engine';
import type { AreaExtra } from '$graph-editor/area';
import type { SocketType } from '$graph-editor/plugins';
import type { NodeFactory } from '$graph-editor/editor';
import type { GetRenderTypes } from 'rete-area-plugin/_types/types';
import { Stack } from '$lib/types/Stack';
import {
	type ComponentSupportInterface,
	type BaseComponent,
	PythonNodeComponent,
	R_SocketSelection_NC
} from '$graph-editor/components';
import {
	Socket,
	ExecSocket,
	Output,
	Input,
	Control,
	InputControl,
	type InputControlOptions,
	type InputControlTypes,
	type InputControlValueType
} from '$graph-editor/socket';

import { ErrorWNotif } from '$lib/global';

interface ControlParams<N> {
	type: InputControlTypes;
	options?: InputControlOptions<N>;
}

export interface OutDataParams {
	socketLabel?: string;
	name: string;
	displayLabel?: boolean;
	displayName?: string;
	isArray?: boolean;
	type?: SocketType;
}

export interface InDataParams<N> {
	socketLabel?: string;
	name: string;
	displayName?: string;
	initial?: unknown;
	control?: ControlParams<N>;
	isRequired?: boolean;
	isArray?: boolean;
	type?: SocketType;
	index?: number;
}

export interface NodeParams {
	label?: string;
	name?: string;
	width?: number;
	height?: number;
	factory: NodeFactory;
	params?: Record<string, unknown>;
}

export type NodeSaveData = {
	params: Record<string, unknown>;
	id: string;
	type: string;
	position?: { x: number; y: number };
	state: Record<string, unknown>;
	inputControlValues: Record<string, unknown>;
	selectedInputs: string[];
	selectedOutputs: string[];
};

export class Node<
		Inputs extends {
			[key in string]: Socket;
		} = {
			[key in string]: Socket;
		},
		Outputs extends {
			[key in string]: Socket;
		} = {
			[key in string]: Socket;
		},
		Controls extends {
			[key in string]: Control;
		} = {
			[key in string]: Control;
		}
	>
	extends ClassicPreset.Node<Inputs, Outputs, Controls>
	implements DataflowNode, ComponentSupportInterface
{
	width = 190;
	height = 120;

	private components: BaseComponent[] = [];
	static activeFactory: NodeFactory | undefined;
	private outData: Record<string, unknown> = {};
	private resolveEndExecutes = new Stack<() => void>();
	private naturalFlowExec: string | undefined = 'exec';
	protected factory: NodeFactory;
	protected params: Record<string, unknown>;
	static id: string;
	static nodeCounts = BigInt(0);
	protected state: Record<string, unknown> = {};
	inputs: { [key in keyof Inputs]?: Input<Exclude<Inputs[key], undefined>> | undefined } = {};
	outputs: { [key in keyof Outputs]?: Output<Exclude<Outputs[key], undefined>> | undefined } = {};
	readonly pythonComponent: PythonNodeComponent;
	readonly socketSelectionComponent: R_SocketSelection_NC;
	readonly ingoingDataConnections: Record<string, Connection<Node, Node>[]> = {};
	readonly ingoingExecConnections: Record<string, Connection<Node, Node>[]> = {};
	readonly outgoingDataConnections: Record<string, Connection<Node, Node>[]> = {};
	readonly outgoingExecConnections: Record<string, Connection<Node, Node>[]> = {};
	onRemoveIngoingConnection?: (conn: Connection) => void;

	initializePromise?: Promise<void>;
	afterInitialize?: () => void;

	getFactory(): NodeFactory {
		return this.factory;
	}
	getState(): Record<string, unknown> {
		return this.state;
	}

	getConnections(): Connection[] {
		return [
			...Object.values(this.ingoingDataConnections),
			...Object.values(this.ingoingExecConnections),
			...Object.values(this.outgoingDataConnections),
			...Object.values(this.outgoingExecConnections)
		].flat();
	}

	constructor(params: NodeParams) {
		const { label = '', width = 190, height = 120, factory } = params;
		super(label);
		this.pythonComponent = this.addComponentByClass(PythonNodeComponent);
		this.socketSelectionComponent = this.addComponentByClass(R_SocketSelection_NC);
		this.state = {};
		Node.nodeCounts++;
		if (params.params && 'factory' in params.params) {
			delete params.params['factory'];
		}
		this.params = params.params || {};
		this.factory = factory;
		if (factory === undefined) {
			throw new Error(name + ': Factory is undefined');
		}
		// format.subscribe((_) => (this.label = _(label)));
		this.width = width;
		this.height = height;
	}
	setState(state: Record<string, unknown>) {
		this.state = state;
	}

	getOutgoers(key: string): Node[] | null {
		if (key in this.outgoingExecConnections) {
			return this.outgoingExecConnections[key].map((conn) => this.getEditor().getNode(conn.target));
		} else if (key in this.outgoingDataConnections) {
			return this.outgoingDataConnections[key].map((conn) => this.getEditor().getNode(conn.target));
		}
		return null;
	}

	addComponentByClass<T extends BaseComponent>(
		componentClass: new (options: { owner: Node }) => T
	): T {
		const component = new componentClass({ owner: this });
		this.components.push(component);
		return component;
	}

	getPosition(): { x: number; y: number } | undefined {
		return this.getArea()?.nodeViews.get(this.id)?.position;
	}

	applyState() {
		//to be overriden
	}

	toJSON(): NodeSaveData {
		if ((this.constructor as typeof Node).id === undefined) {
			console.error('Node missing in registry', this);
			throw new ErrorWNotif(
				`A node can't be saved as it's missing in the node registry. Node : ${this.label}`
			);
		}
		const inputControlValues: Record<string, unknown> = {};
		const selectedInputs: string[] = [];
		const selectedOutputs: string[] = [];
		for (const key in this.inputs) {
			const value = this.getData(key);
			if (value !== undefined) {
				inputControlValues[key] = value;
			}
			if (this.inputs[key]?.socket.selected) selectedInputs.push(key);
		}
		for (const key in this.outputs) {
			if (this.outputs[key]?.socket.selected) selectedOutputs.push(key);
		}

		return {
			params: this.params,
			id: this.id,
			type: (this.constructor as typeof Node).id,
			state: this.state,
			position: this.getArea()?.nodeViews.get(this.id)?.position,
			inputControlValues: inputControlValues,
			selectedInputs,
			selectedOutputs
		};
	}

	selectInput(key: string) {
		this.inputs[key]?.socket.select();
	}

	deselectInput(key: string) {
		this.inputs[key]?.socket.deselect();
	}

	selectOutput(key: string) {
		this.outputs[key]?.socket.select();
	}

	deselectOutput(key: string) {
		this.outputs[key]?.socket.deselect();
	}

	setNaturalFlow(outExec: string | undefined) {
		this.naturalFlowExec = outExec;
	}

	getNaturalFlow(): string | undefined {
		return this.naturalFlowExec;
	}

	async fetchInputs() {
		try {
			return await this.factory.dataflowEngine.fetchInputs(this.id);
		} catch (e) {
			if (e && (e as { message: string }).message === 'cancelled') {
				console.log('gracefully cancelled Node.fetchInputs');
				return {};
			} else throw e;
		}
	}

	getDataflowEngine() {
		return this.factory.dataflowEngine;
	}

	getEditor() {
		return this.factory.getEditor();
	}

	setFactory(nodeFactory: NodeFactory) {
		this.factory = nodeFactory;
	}

	getArea() {
		return this.factory.getArea();
	}

	// Callback called at the end of execute
	onEndExecute() {
		if (!this.resolveEndExecutes.isEmpty()) {
			const resolve = this.resolveEndExecutes.pop();
			if (resolve) {
				resolve();
			}
		}
	}

	waitForEndExecutePromise(): Promise<void> {
		return new Promise<void>((resolve) => {
			this.resolveEndExecutes.push(resolve);
		});
	}

	execute(input: string, forward: (output: string) => unknown, forwardExec = true) {
		if (forwardExec && this.outputs.exec) {
			forward('exec');
		}
		this.onEndExecute();
	}

	addInExec(name = 'exec', displayName = '') {
		const input = new Input(new ExecSocket({ name: displayName, node: this }), undefined, true);
		this.addInput(name, input as unknown as Input<Exclude<Inputs[keyof Inputs], undefined>>);
	}

	addOutData({
		name = 'data',
		displayName = '',
		socketLabel = '',
		displayLabel = true,
		isArray = false,
		type = 'any'
	}: OutDataParams) {
		const output = new Output(
			new Socket({ name: socketLabel, isArray: isArray, type: type, node: this, displayLabel }),
			displayName
		);
		this.addOutput(name, output as unknown as Output<Exclude<Outputs[keyof Outputs], undefined>>);
	}

	addInData<N>({
		name = 'data',
		displayName = '',
		socketLabel = '',
		control = undefined,
		isArray = false,
		isRequired = false,
		type = 'any',
		index = undefined
	}: InDataParams<N>): Input {
		const input = new Input(
			new Socket({
				name: socketLabel,
				isArray: isArray,
				type: type,
				isRequired: isRequired,
				node: this
			}),
			displayName,
			isArray,
			{ isRequired: isRequired, index }
		);
		if (control) {
			if (control.options) {
				const debouncedOnChange = control.options.debouncedOnChange;
				control.options.debouncedOnChange = (value: unknown) => {
					if (debouncedOnChange) debouncedOnChange(value as N);
					this.getDataflowEngine().reset(this.id);
				};
			}
			input.addControl(new InputControl(control.type, control.options));
		}
		this.addInput(name, input as unknown as Input<Exclude<Inputs[keyof Inputs], undefined>>);
		return input;
	}

	addOutExec(name = 'exec', displayName = '', isNaturalFlow = false) {
		if (isNaturalFlow) this.naturalFlowExec = name;
		const output = new Output(new ExecSocket({ name: displayName, node: this }), displayName);
		this.addOutput(name, output as unknown as Output<Exclude<Outputs[keyof Outputs], undefined>>);
	}

	processDataflow = () => {
		this.factory.process(this);
	};

	getWaitPromises(nodes: Node[]): Promise<void>[] {
		return nodes.map((node) => node.waitForEndExecutePromise());
	}

	getData<T extends InputControlTypes, N = InputControlValueType<T>>(
		key: string,
		inputs?: Record<string, unknown>
	): N | undefined {
		// const checkedInputs2 = inputs as Record<string, N>;
		// if (checkedInputs2 && key in checkedInputs2) {
		// 	console.log("get", checkedInputs2[key]);

		// 	return checkedInputs2[key];
		// }
		// if ()

		const checkedInputs = inputs as Record<string, unknown[]>;
		const isArray = this.inputs[key]?.socket.isArray;

		if (checkedInputs && key in checkedInputs) {
			// console.log(checkedInputs);
			// console.log("get0", checkedInputs[key][0]);
			if (checkedInputs[key].length > 1) {
				return checkedInputs[key] as N;
			}
			return checkedInputs[key][0] as N;
		}

		const inputControl = this.inputs[key]?.control as InputControl<T, N>;

		if (inputControl) {
			return inputControl.value;
		}
		return undefined;
	}

	data(
		inputs?: Record<string, unknown> | undefined
	): Record<string, unknown> | Promise<Record<string, unknown>> {
		const res: Record<string, unknown> = {};
		for (const key in this.outputs) {
			if (!(this.outputs[key]?.socket instanceof ExecSocket)) res[key] = undefined;
		}

		return { ...res, ...this.getOutData() };
	}

	setData(key: string, value: unknown) {
		this.outData[key] = value;

		// this.getDataflowEngine().reset(this.id);
		// this.processDataflow();
	}

	getOutData() {
		return this.outData;
	}

	updateElement(type: GetRenderTypes<AreaExtra> = 'node', id?: string): void {
		if (id === undefined) id = this.id;
		const area = this.getArea();
		if (area) {
			area.update(type, id);
		}
	}
}

export type ConnectionSaveData = {
	id: string;
	source: string;
	target: string;
	sourceOutput: string;
	targetInput: string;
};
export class Connection<
	A extends Node = Node,
	B extends Node = Node
> extends ClassicPreset.Connection<A, B> {
	// constructor(source: A, sourceOutput: keyof A['outputs'], target: B, targetInput: keyof B['inputs']) {
	// 	super(source, sourceOutput, target, targetInput);

	// }
	selected?: boolean;
	factory?: NodeFactory;

	toJSON(): ConnectionSaveData {
		return {
			id: this.id,
			source: this.source,
			target: this.target,
			sourceOutput: this.sourceOutput as string,
			targetInput: this.targetInput as string
		};
	}
}
