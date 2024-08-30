import type { Scalar } from "$graph-editor/socket";
import { description, Node, registerNode, tags, type NodeParams, type SocketsValues } from "../Node.svelte";
import { ConverterNode, InputControlNode } from "./common-data-nodes.svelte";

/**
 * A node that outputs a number.
 */
@registerNode('integer.IntegerNode')
@description('Produces an integer.')
@tags('int', 'integer', 'i', 'c', 'n', 'entier')
export class NumberNode extends InputControlNode<'integer'> {
	constructor(params?: NodeParams) {
		super({ label: 'Integer', ...params, controlType: 'integer', props: { class: 'w-3' } });
	}
}


@registerNode('integer.ToString')
@description('Converts an integer to a string.')
@tags('string', 'text', 'convert')
export class ToStringNode extends ConverterNode<'integer', 'string'> {
	constructor(params: NodeParams = {}) {
		super({
			label: 'To string',
			...params,
			source: 'integer',
			target: 'string',
			convert: (e) => String(e),
		})
	}
}

@registerNode('integer.ToNumber')
@description('Converts an integer to a number.')
@tags('float', 'real', 'convert')
export class ToNumberNode extends ConverterNode<'integer', 'number'> {
	constructor(params: NodeParams = {}) {
		super({
			label: 'To number',
			...params,
			source: 'integer',
			target: 'number',
			convert: (e) => Number(e),
		})
	}
}

@registerNode('integer.Parse')
@description('Parses a string to an integer.')
@tags('int', 'convert')
export class ParseNode extends ConverterNode<'string', 'integer'> {
	constructor(params: NodeParams = {}) {
		super({
			label: 'Parse Integer',
			...params,
			source: 'string',
			target: 'integer',
			convert: (e) => parseInt(e),
		})
	}
}

@registerNode('integer.Add')
@description('Adds two integers.')
@tags('int', 'add', 'sum', 'plus', '+')
export class AddNode extends Node<{a: Scalar<'integer'>, b: Scalar<'integer'>}, {value: Scalar<'integer'>}> {
	constructor(params: NodeParams = {}) {
		super({label: 'Add', ...params});
		this.addInData('a', {type: 'integer', hideLabel: true});
		this.addInData('b', {type: 'integer', hideLabel: true});
		this.addOutData('value', {type: 'integer'});
	}

	data(inputs?: SocketsValues<{ a: Scalar<"integer">; b: Scalar<"integer">; }> | undefined): SocketsValues<{ value: Scalar<"integer">; }> | Promise<SocketsValues<{ value: Scalar<"integer">; }>> {
		const a = this.getData('a', inputs);
		const b = this.getData('b', inputs);
		return {value: a + b};
	}
}

@registerNode('integer.Subtract')
@description('Subtracts two integers.')
@tags('int', 'subtract', 'minus', 'difference', '-')
export class SubtractNode extends Node<{a: Scalar<'integer'>, b: Scalar<'integer'>}, {value: Scalar<'integer'>}> {
	constructor(params: NodeParams = {}) {
		super({label: 'Subtract', ...params});
		this.addInData('a', {type: 'integer', hideLabel: true});
		this.addInData('b', {type: 'integer', hideLabel: true});
		this.addOutData('value', {type: 'integer'});
	}

	data(inputs?: SocketsValues<{ a: Scalar<"integer">; b: Scalar<"integer">; }> | undefined): SocketsValues<{ value: Scalar<"integer">; }> | Promise<SocketsValues<{ value: Scalar<"integer">; }>> {
		const a = this.getData('a', inputs);
		const b = this.getData('b', inputs);
		return {value: a - b};
	}
}

@registerNode('integer.Multiply')
@description('Multiplies two integers.')
@tags('int', 'multiply', 'times', '*')
export class MultiplyNode extends Node<{a: Scalar<'integer'>, b: Scalar<'integer'>}, {value: Scalar<'integer'>}> {
	constructor(params: NodeParams = {}) {
		super({label: 'Multiply', ...params});
		this.addInData('a', {type: 'integer', hideLabel: true});
		this.addInData('b', {type: 'integer', hideLabel: true});
		this.addOutData('value', {type: 'integer'});
	}

	data(inputs?: SocketsValues<{ a: Scalar<"integer">; b: Scalar<"integer">; }> | undefined): SocketsValues<{ value: Scalar<"integer">; }> | Promise<SocketsValues<{ value: Scalar<"integer">; }>> {
		const a = this.getData('a', inputs);
		const b = this.getData('b', inputs);
		return {value: a * b};
	}
}

@registerNode('integer.ToBool')
@description('Converts an integer to a boolean.')
@tags('bool', 'convert')
export class ToBoolNode extends ConverterNode<'integer', 'boolean'> {
	constructor(params: NodeParams = {}) {
		super({
			label: 'To bool',
			...params,
			source: 'integer',
			target: 'boolean',
			convert: (e) => Boolean(e),
		})
	}
}