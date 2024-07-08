import { Connection } from '$Node';
import type { Socket, Input, InputControl, assignControl } from '$graph-editor/socket';
import type { SocketType } from '$graph-editor/plugins/typed-sockets';
import type { ClassicPreset } from 'rete';
import type { NodeFactory } from '$graph-editor/editor';
import { AddPinNode, type AddPinNodeState } from '../AddPinNode';

export type MakeArrayNodeState = {
	// Add any additional properties that you need
	type: SocketType;
} & AddPinNodeState;

export class MakeArrayNode extends AddPinNode {
	// type: SocketType = 'any';
	state: MakeArrayNodeState = { ...this.state, type: 'any' };
	initialValues: Record<string, unknown>;
	numConnections = 0;

	constructor(params: {
		factory: NodeFactory;
		initialValues: Record<string, unknown>;
		numPins?: number;
	}) {
		// super('Make Array', { factory, height: 160, width: 150 });

		super({
			label: 'Make Array',
			factory: params.factory,
			height: 135,
			width: 150,
			params,
			numPins: params.numPins ?? 1
		});
		this.initialValues = params.initialValues;

		this.oldAddOutData({ name: 'array', isArray: true, type: this.state.type });
		this.changeType(this.state.type);
		this.loadInitialValues();

		this.getEditor().addPipe((context) => {
			if (!['connectionremoved', 'connectioncreated'].includes(context.type)) return context;

			if (!('data' in context)) return context;

			if (!(context.data instanceof Connection)) return context;

			const conn = context.data;
			if (conn.target !== this.id && conn.source !== this.id) return context;
			if (context.type === 'connectionremoved') {
				this.numConnections--;
				// if (this.numConnections === 0) this.changeType('any');
			} else if (context.type === 'connectioncreated') {
				this.numConnections++;
				if (this.numConnections !== 1) return context;
				// if (this.state.type !== 'any') return context;

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

	loadInitialValues() {
		console.log('inputs', this.inputs);
		console.log('initialValues', this.initialValues);
		for (const key in this.inputs) {
			const input = this.inputs[key];
			if (input) {
				const control = input.control as InputControl<unknown>;
				if (control && this.initialValues && key in this.initialValues)
					control.setValue(this.initialValues[key]);
			}
		}
	}
	changeType(to: SocketType) {
		// if (this.state.type === to) return;
		console.log('Changing type to ' + to);
		this.state.type = to;
		this.width =
			this.state.type === 'vector' ? 320 : this.state.type === 'groupNameRef' ? 230 : 150;

		for (const input of Object.values(this.inputs)) {
			if (input) {
				this.changeInputType(input, to);
			}
		}
		// this.loadInitialValues();
		const outArray = this.outputs['array'];
		if (outArray) outArray.socket.type = to;
		// console.log('Changing type to ' + to);
		this.updateElement('node', this.id);
	}

	changeInputType(input: ClassicPreset.Input<Socket>, to: SocketType) {
		input.socket.type = to || 'any';
		const controlType = assignControl(to);
		const currentValue = (input.control as InputControl | null)?.value;
		input.removeControl();
		if (controlType)
			input.addControl(
				new InputControl(controlType, {
					debouncedOnChange: (value) => {
						this.getDataflowEngine().reset(this.id);
					},
					initial: currentValue
				})
			);
	}

	override data(
		inputs?: Record<string, Input<Socket>> | undefined
	): Record<string, unknown> | Promise<Record<string, unknown>> {
		const data: undefined | unknown[] = [];
		for (const key in this.inputs) {
			data.push(this.getData(key, inputs));
		}

		return { array: data };
	}

	onAddPin(index: number) {
		// console.log('Adding input pin with key data-' + index);
		const type = this.state.type !== undefined ? this.state.type : 'any';

		// console.log('Adding input pin with key data-' + Object.keys(this.inputs).length);

		this.oldAddInData({
			name: `data-${index}`,
			displayName: '',
			isArray: false,
			type: this.state.type || 'any',
			socketLabel: `data-${index}`
		});
		this.height += 57;
		this.changeInputType(this.inputs[`data-${index}`] as Input<Socket>, this.state.type);
		// this.loadInitialValues();

		// this.getDataflowEngine().reset(this.id);
		// this.factory.dataflowEngine?.reset(this.id);
		this.updateElement('node', this.id);
	}

	addPin(): void {
		super.addPin();
		this.factory.dataflowEngine?.reset(this.id);
	}
	override applyState(): void {
		super.applyState();
		this.width = this.state.type === 'vector' ? 280 : 150;
		this.changeType(this.state.type);
	}
}
