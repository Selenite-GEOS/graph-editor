import { ClassicPreset } from 'rete';
import type { DataflowNode } from 'rete-engine';
import type { AreaExtra } from '$graph-editor/area';
import type { SocketType } from '$graph-editor/plugins/typed-sockets';
import type { NodeFactory, NodeEditor } from '$graph-editor/editor';
import type { GetRenderTypes } from 'rete-area-plugin/_types/types';
import { Stack } from '$lib/types/Stack';
import {
	type ComponentSupportInterface,
	type BaseComponent,
	PythonNodeComponent,
	R_SocketSelection_NC,
	type NodeComponentParams
} from '$graph-editor/components';
import {
	Socket,
	ExecSocket,
	Output,
	Input,
	Control,
	InputControl,
	type InputControlType,
	type InputControlParams,
	assignControl,
	type SocketValueType,
	type SocketValueWithDatastructure,
	type SocketDatastructure
} from '$graph-editor/socket';

import { ErrorWNotif } from '$lib/global/index.svelte';
import type { ConverterNode } from './data/common-data-nodes.svelte';
import type { AreaPlugin } from 'rete-area-plugin';
import type { Schemes } from '$graph-editor/schemes';
import { structures } from 'rete-structures';
import { getLeavesFromOutput } from './utils';
import type { HTMLInputAttributes } from 'svelte/elements';
import { uuidv4 } from '@selenite/commons';
import type { SelectorEntity } from '$graph-editor/editor/NodeSelection.svelte';

/**
 * A map of node classes indexed by their id.
 */
export const nodeRegistry = new Map<string, NodeConstructor>();

/**
 * Registers a node class.
 */
export function registerNode<
	Inputs extends { [x: string]: Socket<SocketType> },
	Outputs extends { [x: string]: Socket<SocketType> },
	Controls extends { [x: string]: Control },
	T extends 'abstract' | 'real' = 'real'
>(id: string, type?: T) {
	// this is the decorator factory, it sets up
	// the returned decorator function
	return function (
		target: T extends 'abstract' ? unknown : NodeConstructor<Node<Inputs, Outputs, Controls>>
	) {
		target.id = id;
		if (type === 'abstract') target.visible = false;
		if (nodeRegistry.has(id)) {
			console.warn('Node already registered', id);
		}
		console.debug('Registering node', target.id);
		nodeRegistry.set(target.id, target as NodeConstructor);
	};
}

/**
 * Registered converter nodes, from source to target.
 */
export const converters = new Map<SocketType, Map<SocketType, NodeConstructor>>();

/**
 * Registers a converter node.
 */
export function registerConverter<S extends SocketType, T extends SocketType>(
	source: S,
	target: T
) {
	return function (nodeClass: typeof ConverterNode<S, T>) {
		console.debug(`Registering converter from ${source} to ${target}`);
		if (!converters.has(source)) converters.set(source, new Map());
		converters.get(source)!.set(target, nodeClass);
	};
}

export function hidden(nodeClass: NodeConstructor) {
	nodeClass.visible = false;
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
	control?: InputControlParams<N>;
	isRequired?: boolean;
	isArray?: boolean;
	type?: SocketType;
	index?: number;
}

function sortedByIndex<K extends string | number, V extends { index?: number }>(
	entries: [K, V][]
): [K, V][] {
	return entries.toSorted((a, b) => (a[1].index ?? 0) - (b[1].index ?? 0));
}

export interface NodeParams {
	// <Inputs extends {
	// 			[key in string]: Socket;
	// 		} = {
	// 			[key in string]: Socket;
	// 		},
	// 		Outputs extends {
	// 			[key in string]: Socket;
	// 		} = {
	// 			[key in string]: Socket;
	// 		},
	// 		Controls extends {
	// 			[key in string]: Control;
	// 		} = {
	// 			[key in string]: Control;
	// 		}>
	label?: string;
	name?: string;
	width?: number;
	height?: number;
	factory?: NodeFactory;
	params?: Record<string, unknown>;
	initialValues?: Node['initialValues'];
	state?: Record<string, unknown>;
}

export type NodeSaveData = {
	params: Record<string, unknown>;
	id: string;
	type: string;
	position?: { x: number; y: number };
	state: Record<string, unknown>;
	inputControlValues: Node['initialValues'];

	selectedInputs: string[];
	selectedOutputs: string[];
};

export type NodeConstructor<N = Node> = {
	new (params?: NodeParams): N;
	id?: string;
	/** Menu path of the node. */
	path?: string[];
	/** Search tags of the node. */
	tags?: string[];
	/** Description of the node. */
	description?: string;
	/** Visibility of node */
	visible?: boolean;
};

/**
 * Decorator that adds a path to a node.
 */
export function path<N>(...path: string[]) {
	return function (target: NodeConstructor<N>) {
		target.path = path;
	};
}

/**
 * Decorator that adds tags to a node
 */
export function tags<N>(...tags: string[]) {
	return function (target: NodeConstructor<N>) {
		target.tags = tags;
	};
}

/**
 * Decorator that adds a description to a node.
 */
export function description<N>(description: string) {
	return function (target: NodeConstructor<N>) {
		target.description = description;
	};
}
type Sockets<Inputs extends { [key in string]?: Input | undefined }> = {
	[K in keyof Inputs]: Inputs[K] extends Input ? Inputs[K]['socket'] : never;
};
export type SocketsValues<
	Sockets extends {
		[key in string]: Socket;
	}
> = {
	[K in keyof Sockets]: SocketValueWithDatastructure<
		SocketValueType<Sockets[K]['type']>,
		Sockets[K]['datastructure']
	>;
};

type DataSocket<T extends Exclude<SocketType, 'exec'> = Exclude<SocketType, 'exec'>> = Socket<
	T,
	SocketDatastructure
>;
type ExecSocketsKeys<Sockets extends Record<string, DataSocket | ExecSocket>> = {
	[K in keyof Sockets]: Sockets[K] extends DataSocket ? never : K extends string ? K : never;
}[keyof Sockets];
type DataSocketsKeys<Sockets extends Record<string, DataSocket | ExecSocket>> = Exclude<
	keyof Sockets,
	ExecSocketsKeys<Sockets>
>;
type Test = { a: DataSocket; b: ExecSocket; c: ExecSocket };
const r: DataSocketsKeys<Test> = 'a';
type ExecSockets<Sockets extends Record<string, Socket | ExecSocket>> = {
	[K in ExecSocketsKeys<Sockets>]: Sockets[K];
};
type DataSockets<Sockets extends Record<string, Socket | ExecSocket>> = {
	[K in DataSocketsKeys<Sockets>]: Sockets[K];
};
export class Node<
		Inputs extends Record<string, Socket> = Record<string, Socket>,
		Outputs extends {
			[key in string]: Socket;
		} = {
			[key in string]: Socket;
		},
		Controls extends {
			[key in string]: Control;
		} = {
			[key in string]: Control;
		},
		State extends Record<string, unknown> = Record<string, unknown>,
		Params extends Record<string, unknown> = Record<string, unknown>
	>
	implements ClassicPreset.Node<Inputs, Outputs, Controls>, DataflowNode, ComponentSupportInterface
{
	#width = $state(100);
	#height = $state(50);

	get width() {
		return this.#width;
	}
	get height() {
		return this.#height;
	}
	set height(h: number) {
		this.#height = h;
		this.emitResized();
	}
	set width(w: number) {
		this.#width = w;
		this.emitResized();
	}

	async emitResized() {
		this.area?.emit({
			type: 'noderesized',
			data: { id: this.id, size: { height: this.height, width: this.width } }
		});
	}
	// updateConnections() {
	// 	console.debug("update conns")
	// 	for (const conn of this.getConnections()) {
	// 		this.updateElement('connection', conn.id)
	// 	}
	// }

	get editor(): NodeEditor | undefined {
		return this.factory?.getEditor();
	}

	get area(): AreaPlugin<Schemes, AreaExtra> | undefined {
		return this.factory?.getArea();
	}

	static description: string = '';
	static visible: boolean = true;
	static inputTypes?: string[];
	static outputTypes?: string[];

	// width = 190;
	// height = 120;
	private components: BaseComponent[] = [];
	static activeFactory: NodeFactory | undefined;
	private outData: Record<string, unknown> = {};
	private resolveEndExecutes = new Stack<() => void>();
	private naturalFlowExec: string | undefined = 'exec';
	factory = $state<NodeFactory>();
	protected params: Params = {} as Params;
	static id: string;
	static nodeCounts = BigInt(0);
	state = $state<{ name?: string } & Partial<State>>({} as State);
	get name(): string | undefined {
		return this.state.name;
	}
	set name(n: string) {
		if (n.trim() === '') {
			this.state.name = undefined;
			return;
		}
		this.state.name = n;
	}
	inputs: { [key in keyof Inputs]?: Input<Exclude<Inputs[key], undefined>> | undefined } = $state(
		{}
	);
	outputs: { [key in keyof Outputs]?: Output<Exclude<Outputs[key], undefined>> | undefined } =
		$state({});
	controls = $state<Controls>({} as Controls);
	needsProcessing = $state(false);
	sortedInputs = $derived(sortedByIndex(Object.entries(this.inputs)) as [string, Input<Socket>][]);
	sortedOutputs = $derived(
		sortedByIndex(Object.entries(this.outputs)) as [string, Output<Socket>][]
	);
	sortedControls = $derived(sortedByIndex(Object.entries(this.controls)) as [string, Control][]);
	readonly pythonComponent: PythonNodeComponent;
	readonly socketSelectionComponent: R_SocketSelection_NC;
	readonly ingoingDataConnections: Record<string, Connection<Node, Node>[]> = {};
	readonly ingoingExecConnections: Record<string, Connection<Node, Node>[]> = {};
	readonly outgoingDataConnections: Record<string, Connection<Node, Node>[]> = {};
	readonly outgoingExecConnections: Record<string, Connection<Node, Node>[]> = {};
	onRemoveIngoingConnection?: (conn: Connection) => void;

	initializePromise?: Promise<void>;
	initialValues?: {
		inputs: Record<string, unknown>;
		controls: Record<string, unknown>;
	};
	afterInitialize?: () => void;

	getFactory(): NodeFactory | undefined {
		return this.factory;
	}
	getState(): Record<string, unknown> {
		return this.state;
	}
	addInput<K extends keyof Inputs>(key: K, input: Input<Exclude<Inputs[K], undefined>>): void {
		this.inputs[key] = input;
	}

	addOutput<K extends keyof Outputs>(key: K, output: Output<Exclude<Outputs[K], undefined>>): void {
		this.outputs[key] = output;
	}

	getConnections(): Connection[] {
		return [
			...Object.values(this.ingoingDataConnections),
			...Object.values(this.ingoingExecConnections),
			...Object.values(this.outgoingDataConnections),
			...Object.values(this.outgoingExecConnections)
		].flat();
	}

	constructor(params: NodeParams = {}) {
		const { label = '', width = 190, height = 120, factory } = params;
		this.id = uuidv4();
		this.label = label;
		this.initialValues = params.initialValues;
		this.pythonComponent = this.addComponentByClass(PythonNodeComponent);
		this.socketSelectionComponent = this.addComponentByClass(R_SocketSelection_NC);
		this.state = (params.state ?? {}) as State;

		Node.nodeCounts++;
		if (params.params && 'factory' in params.params) {
			delete params.params['factory'];
		}
		this.params = params.params || {};
		this.factory = factory;
		// if (factory === undefined) {
		// 	throw new Error(name + ': Factory is undefined');
		// }
		// format.subscribe((_) => (this.label = _(label)));
		this.width = width;
		this.height = height;
	}
	label = $state('');
	id: string;
	get selected() {
		return this.factory?.selector.isSelected(this) ?? false;
	}

	get picked() {
		return this.factory ? this.factory.selector.picked === this : false;
	}

	hasInput<K extends keyof Inputs>(key: K) {
		return key in this.inputs;
	}
	removeInput(key: keyof Inputs): void {
		delete this.inputs[key];
	}
	hasOutput<K extends keyof Outputs>(key: K) {
		return key in this.outputs;
	}
	removeOutput(key: keyof Outputs): void {
		delete this.outputs[key];
	}
	hasControl<K extends keyof Controls>(key: K) {
		return key in this.controls;
	}
	addControl<K extends keyof Controls>(key: K, control: Controls[K]): void {
		this.controls[key] = control;
	}
	removeControl(key: keyof Controls): void {
		throw new Error('Method not implemented.');
	}
	setState(state: Record<string, unknown>) {
		this.state = state;
	}

	getOutgoers(key: string): Node[] | null {
		if (key in this.outgoingExecConnections) {
			return this.outgoingExecConnections[key]
				.map((conn) => this.getEditor().getNode(conn.target))
				.filter((n) => n !== undefined) as Node[];
		} else if (key in this.outgoingDataConnections) {
			return this.outgoingDataConnections[key]
				.map((conn) => this.getEditor().getNode(conn.target))
				.filter((n) => n !== undefined) as Node[];
		}
		return null;
	}

	addComponentByClass<
		T extends BaseComponent,
		N extends NodeComponentParams<Inputs, Outputs>,
		P,
		Inputs extends Record<string, Socket>,
		Outputs extends Record<string, Socket>
	>(componentClass: new (options: N & P) => T, params: P): T {
		const component = new componentClass({
			owner: this as unknown as Node<Inputs, Outputs>,
			...params
		} as N & P);
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
		console.debug('Saving', this);
		const inputControlValues: Node['initialValues'] = { inputs: {}, controls: {} };
		const selectedInputs: string[] = [];
		const selectedOutputs: string[] = [];
		for (const key in this.inputs) {
			const value = this.getData(key);
			if (value !== undefined) {
				inputControlValues.inputs[key] = value;
			}
			if (this.inputs[key]?.socket.selected) selectedInputs.push(key);
		}
		for (const key in this.outputs) {
			if (this.outputs[key]?.socket.selected) selectedOutputs.push(key);
		}

		for (const key in this.controls) {
			const control = this.controls[key];
			if (!(control instanceof InputControl)) continue;
			inputControlValues.controls[key] = control.value;
		}

		return {
			id: this.id,
			type: (this.constructor as typeof Node).id,
			params: this.params,
			state: $state.snapshot(this.state) as State,
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

	async fetchInputs(): Promise<SocketsValues<Inputs>> {
		if (!this.factory) {
			throw new Error("Can't fetch inputs, node factory is undefined");
		}
		try {
			return (await this.factory.dataflowEngine.fetchInputs(this.id)) as SocketsValues<Inputs>;
		} catch (e) {
			if (e && (e as { message: string }).message === 'cancelled') {
				console.log('gracefully cancelled Node.fetchInputs');
				return {} as SocketsValues<Inputs>;
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
		return this.factory?.getArea();
	}

	// Callback called at the end of execute
	onEndExecute() {
		// if (!this.resolveEndExecutes.isEmpty()) {
		while (!this.resolveEndExecutes.isEmpty()) {
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

	inputTypes = $derived.by(() => {
		const res: Record<string, { type: SocketType; datastructure: SocketDatastructure }> = {};
		for (const k of Object.keys(this.inputs)) {
			const socket = this.inputs[k]?.socket;
			if (socket) {
				res[k] = { type: socket.type, datastructure: socket.datastructure };
			}
		}
		return res;
	});

	outputTypes = $derived.by(() => {
		const res: Record<string, { type: SocketType; datastructure: SocketDatastructure }> = {};
		for (const k of Object.keys(this.outputs)) {
			const socket = this.outputs[k]?.socket;
			if (socket) {
				res[k] = { type: socket.type, datastructure: socket.datastructure };
			}
		}
		return res;
	});

	async getWaitForChildrenPromises(output: ExecSocketsKeys<Outputs>): Promise<void> {
		const leavesFromLoopExec = getLeavesFromOutput(this as Node, output);
		const promises = this.getWaitPromises(leavesFromLoopExec);
		await Promise.all(promises);
	}

	execute(
		input: ExecSocketsKeys<Inputs>,
		forward: (output: ExecSocketsKeys<Outputs>) => unknown,
		forwardExec = true
	): void | Promise<void> {
		this.needsProcessing = true;
		if (forwardExec && this.outputs.exec) {
			forward('exec' as ExecSocketsKeys<Outputs>);
		}
		this.onEndExecute();
		setTimeout(() => {
			this.needsProcessing = false;
		});
	}

	addInExec(name: ExecSocketsKeys<Inputs> = 'exec' as ExecSocketsKeys<Inputs>, displayName = '') {
		const input = new Input({
			index: -1,
			socket: new ExecSocket({ name: displayName, node: this }),
			isRequired: true
		});
		this.addInput(name, input as unknown as Input<Exclude<Inputs[keyof Inputs], undefined>>);
	}

	addOutData<K extends DataSocketsKeys<Outputs> & string>(
		key: K,
		params: {
			datastructure?: Outputs[K]['datastructure'];
			showLabel?: boolean;
			type: Outputs[K]['type'];
			isArray?: boolean;
			label?: string;
		}
	) {
		if (key in this.outputs) {
			throw new Error(`Output ${String(key)} already exists`);
		}
		const output = new Output(
			new Socket({
				name: params.label ?? key,
				datastructure: params.datastructure ?? 'scalar',
				type: params.type,
				node: this,
				displayLabel: params.showLabel
			}),
			(params.showLabel ?? true) ? (params.label ?? key) : undefined
		);
		this.addOutput(key, output as unknown as Output<Exclude<Outputs[keyof Outputs], undefined>>);
		return output.socket;
	}

	oldAddOutData({
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

	addInData<K extends DataSocketsKeys<Inputs>>(
		key: K,
		params?: {
			type?: Inputs[K]['type'];
			datastructure?: Inputs[K]['datastructure'] extends 'scalar'
				? 'scalar' | undefined
				: Inputs[K]['datastructure'];
			control?: Partial<InputControlParams<InputControlType>>;
			label?: string;
			isRequired?: boolean;
			isLabelDisplayed?: boolean;
			initial?: SocketValueType<Inputs[K]['type']>;
			index?: number;
			props?: HTMLInputAttributes;
			changeType?: (type: SocketType) => void;
		}
	): Input<Inputs[K]> {
		if (key in this.inputs) {
			throw new Error(`Input ${String(key)} already exists`);
		}
		const input = new Input({
			socket: new Socket({
				node: this,
				displayLabel: params?.isLabelDisplayed,
				datastructure: params?.datastructure,
				type: params?.type ?? 'any'
			}),
			alwaysShowLabel: params?.isLabelDisplayed,
			index: params?.index,
			multipleConnections: params?.isArray,
			isRequired: params?.isRequired,
			label: params?.label ?? (key as string)
		}) as Input<Exclude<Inputs[K], undefined>>;
		this.addInput(key, input);
		const controlType = assignControl(params?.type ?? 'any');
		if (controlType) {
			const inputControl = this.makeInputControl({
				type: controlType,
				...params?.control,
				props: params?.props,
				socketType: params?.type ?? 'any',
				datastructure: params?.datastructure ?? 'scalar',
				initial: this.initialValues?.inputs[key] ?? params?.initial,
				changeType: params?.changeType
			});
			input.addControl(inputControl);
		}
		return input;
	}

	oldAddInData<N>({
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
			input.addControl(
				new InputControl({
					type: control.type,
					initial: control.options.initial,
					readonly: control.options.readonly,
					onChange: control.options.change
				})
			);
		}
		this.addInput(name, input as unknown as Input<Exclude<Inputs[keyof Inputs], undefined>>);
		return input;
	}

	makeInputControl<T extends InputControlType, D extends SocketDatastructure = SocketDatastructure>(
		params: InputControlParams<T, D>
	): InputControl<T> {
		return new InputControl<T>({
			...params,
			onChange: (v) => {
				this.processDataflow();
				if (params.onChange) {
					params.onChange(v);
				}
			}
		});
	}

	addInputControl<T extends InputControlType>(
		key: keyof Controls,
		params: InputControlParams<T>
	): InputControl<T> {
		const inputControl = this.makeInputControl({
			...params,
			datastructure: params.datastructure ?? 'scalar',
			initial: this.initialValues?.controls[key as string] ?? params.initial
		});
		this.addControl(key, inputControl as unknown as Controls[string]);
		return inputControl;
	}

	addOutExec(
		name: ExecSocketsKeys<Outputs> = 'exec' as ExecSocketsKeys<Outputs>,
		displayName = '',
		isNaturalFlow = false
	) {
		if (isNaturalFlow) this.naturalFlowExec = name;
		const output = new Output(new ExecSocket({ name: displayName, node: this }), displayName);
		output.index = -1;
		this.addOutput(name, output as unknown as Output<Exclude<Outputs[keyof Outputs], undefined>>);
	}

	processDataflow = () => {
		if (!this.editor) return;
		// this.needsProcessing = true;
		try {
			for (const n of structures(this.editor).successors(this.id).nodes()) {
				n.needsProcessing = true;
			}
			this.factory?.resetDataflow(this);
		} catch (e) {
			console.warn("Dataflow processing cancelled");
		}
	};

	getWaitPromises(nodes: Node[]): Promise<void>[] {
		return nodes.map((node) => node.waitForEndExecutePromise());
	}

	async getDataWithInputs<K extends DataSocketsKeys<Inputs>>(
		key: K
	): Promise<
		SocketValueWithDatastructure<SocketValueType<Inputs[K]['type']>, Inputs[K]['datastructure']>
	> {
		const inputs = await this.fetchInputs();
		return this.getData(key, inputs);
	}

	getData<K extends DataSocketsKeys<Inputs>>(
		key: K,
		inputs?: Record<keyof Inputs, unknown>
	): SocketValueWithDatastructure<SocketValueType<Inputs[K]['type']>, Inputs[K]['datastructure']> {
		// const checkedInputs2 = inputs as Record<string, N>;
		// if (checkedInputs2 && key in checkedInputs2) {
		// 	console.log("get", checkedInputs2[key]);

		// 	return checkedInputs2[key];
		// }
		// if ()
		const checkedInputs = inputs as Record<string, unknown[]>;
		// const isArray = this.inputs[key]?.socket.isArray;

		if (checkedInputs && key in checkedInputs) {
			// console.log(checkedInputs);
			// console.log("get0", checkedInputs[key][0]);
			if (checkedInputs[key].length > 1) {
				return checkedInputs[key] as SocketValueType<Inputs[K]['type']>;
			}
			return checkedInputs[key][0] as SocketValueType<Inputs[K]['type']>;
		}

		const inputControl = this.inputs[key]?.control as InputControl<T, N>;

		if (inputControl) {
			return inputControl.value;
		}
		return undefined as SocketValueType<Inputs[K]['type']>;
	}

	// @ts-expect-error
	data(
		inputs?: SocketsValues<Inputs> | undefined
	): SocketsValues<DataSockets<Outputs>> | Promise<SocketsValues<DataSockets<Outputs>>> {
		const res: Record<string, unknown> = {};
		for (const key in this.outputs) {
			if (!(this.outputs[key]?.socket instanceof ExecSocket)) res[key] = undefined;
		}

		return { ...res, ...this.getOutData() } as {
			[K in keyof Outputs]: SocketValueType<Outputs[K]['type']>;
		};
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
	get selected(): boolean {
		return this.factory ? this.factory.selector.isSelected(this as SelectorEntity) : false
	}

	get picked(): boolean {
		return this.factory ? this.factory.selector.isPicked(this as SelectorEntity) : false;
	}
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
