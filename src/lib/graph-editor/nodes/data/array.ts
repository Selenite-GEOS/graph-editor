import { description, Node, registerNode, type NodeParams, type SocketsValues } from '../Node.svelte';
import type { Scalar, Socket } from '$graph-editor/socket';
import { InputControlNode } from './common-data-nodes.svelte';
import type { DataType, SocketType } from '$graph-editor/plugins/typed-sockets';
import { DynamicTypeComponent } from '../components/DynamicTypeComponent.svelte';
import { ConnectionTrackerComponent } from '../components';

@registerNode('array.Array')
export class ArrayNode extends InputControlNode<SocketType, 'array'> {
	constructor(params: NodeParams = {}) {
		super({
			label: 'Array',
			...params,
			controlType: 'text',
			datastructure: 'array',
			socketType: 'any'
		});
		this.addComponentByClass(DynamicTypeComponent, {
			inputs: [],
			outputs: ['value']
		});
	}
}

@registerNode('array.MergeArrays')
export class MergeArraysNode extends Node<
	{ a: Socket<'any', 'array'>; b: Socket<'any', 'array'> },
	{ value: Socket<'any', 'array'> }
> {
	constructor(params: NodeParams = {}) {
		super({
			label: 'Merge Arrays',
			...params
		});
		this.addInData('a', {
			datastructure: 'array',
			type: 'any'
		});
		this.addInData('b', {
			datastructure: 'array',
			type: 'any'
		});
		this.addOutData('value', {
			datastructure: 'array',
			type: 'any'
		});
		this.addComponentByClass(DynamicTypeComponent, {
			inputs: ['a', 'b'],
			outputs: ['value']
		});
	}

	data(
		inputs?: { a: unknown[]; b: unknown[] } | undefined
	): SocketsValues<{ value: Socket<'any', 'array'> }> {
		const a = this.getData('a', inputs);
		const b = this.getData('b', inputs);
		return {
			value: [...a, ...b]
		};
	}
}


@registerNode('array.GetArrayElement')
@description('Get an element from an array')
export class GetArrayElementNode extends Node<
	{ array: Socket<'any', 'array'>; index: Scalar<'integer'> },
	{ value: Scalar<'any'> }
> {
	constructor(params: NodeParams = {}) {
		super({
			label: 'Get Element',
			...params
		});
		this.addInData('array', {
			datastructure: 'array',
			type: 'any'
		});
		this.addInData('index', {
			datastructure: 'scalar',
			type: 'integer'
		});
		this.addOutData('value', {
			datastructure: 'scalar',
			type: 'any'
		});
		this.addComponentByClass(DynamicTypeComponent, {
			inputs: ['array'],
			outputs: ['value']
		});
	}

	data(
		inputs?: { array: unknown[]; index: number } | undefined
	): SocketsValues<{ value: Socket<'any', 'scalar'> }> {
		const array = this.getData('array', inputs);
		const index = this.getData('index', inputs);
		return {
			value: array[index]
		};
	}
}

@registerNode('array.makeArray')

export class MakeArrayNode extends Node<Record<`data-${number}`, Scalar<'any'>>, { array: Socket<'any', 'array'> }> {
	constructor(params: NodeParams & {numPins?: number} = {}) {
		super({
			label: 'Make Array',
			...params
		});
		const numPins = params.numPins ?? 1;
		this.addOutData('array', {
			datastructure: 'array',
			type: 'any',
			showLabel: false
		});

		for (let i = 0; i < numPins; i++) {
			this.addInData(`data-${i}`, {
				datastructure: 'scalar',
				type: 'any',
				label: `${i}`
			});
		}
		this.addComponentByClass(DynamicTypeComponent, {
			inputs: Array.from({ length: numPins }, (_, i) => `data-${i}`),
			outputs: ['array']
		});
		
	}
}


@registerNode('array.join')
@description('Join an array of items into a single string')
export class JoinNode extends Node<
	{ array: Socket<'any', 'array'>; separator: Scalar<'string'> },
	{ value: Scalar<'string'> }> {
	constructor(params: NodeParams = {}) {
		super({
			label: 'Join',
			...params
		});
		this.addInData('array', {
			datastructure: 'array',
			type: 'any',
		});
		this.addInData('separator', {
			datastructure: 'scalar',
			type: 'string',
			initial: ', ',
		});
		this.addOutData('value', {
			datastructure: 'scalar',
			type: 'string',
			showLabel: false
		});
		this.addComponentByClass(DynamicTypeComponent, {
			inputs: ['array'],
			outputs: []
		});
	}

	data(inputs?: SocketsValues<{ array: Socket<'any', 'array'>; separator: Scalar<'string'>; }> | undefined): SocketsValues<{ value: Scalar<'string'>; }> | Promise<SocketsValues<{ value: Scalar<'string'>; }>> {
		const array = this.getData('array', inputs);
		const separator = this.getData('separator', inputs);
		return {
			value: array.join(separator).replaceAll("\\n", "\n")
		};
	}
}


@registerNode('array.Break')
@description('Break an array into its elements.')
export class BreakArrayNode extends Node<{array: Socket<DataType, "array">}, Record<string, Scalar<DataType>>> {
	currentOutputs = new Set<string>();
	constructor(params: NodeParams & {type?: DataType} = {}) {
		super({label: 'Break', ...params})
		this.addInData("array", {
			datastructure: 'array',
			hideLabel: true,
			type: params.type ?? 'any'
		})

		this.addComponentByClass(DynamicTypeComponent, {
			inputs: ['array'],
			outputs: '*'
		});
		this.updateOutputs();
	}
	previousData: Record<string, unknown> = {};
	data(inputs?: SocketsValues<{ array: Socket<DataType, 'array'>; }> | undefined): SocketsValues<{}> | Promise<SocketsValues<{}>> {
		const array = this.getData('array', inputs);
		this.updateOutputs(inputs);
		const newData = Object.fromEntries(array.map((value) => [typeof value === 'object' ? JSON.stringify(value) : `${value}`, value]));
		const res = {...this.previousData, ...newData};
		this.previousData = newData;
		return res;
	}

	updateOutputs(inputs?: {array: unknown[]}) {
		const array = this.getData('array', inputs);
		const keep = new Set<string>();
		const type = this.inputs.array?.socket.type;
		if (!type) return;
		for (const t of array) {
			const str = typeof t === 'object' ?  JSON.stringify(t) : `${t}`;
			if (str === '') continue;
			keep.add(str);
			if (this.currentOutputs.has(str)) continue;
			this.addOutData(`${str}`, {
				label: str,
				datastructure: 'scalar',
				type,
				description: 'A value extracted from the array.'
			});
			this.currentOutputs.add(str);
		}
		for (const t of this.currentOutputs.difference(keep)) {
			this.removeOutput(t);
			this.currentOutputs.delete(t);
		}

		setTimeout(() => {
			const type = this.inputs.array?.socket.type;
			if (!type) return;
			for (const output of Object.values(this.outputs)) {
				if (!output) continue;
				output.socket.type = type;
			}
		})
	}

}