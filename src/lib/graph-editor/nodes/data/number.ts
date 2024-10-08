/**
 * Nodes for creating and manipulating numbers.
 * @module
 */

import {
	description,
	Node,
	registerConverter,
	registerNode,
	tags,
	type NodeParams,
	type SocketsValues
} from '$graph-editor/nodes/Node.svelte';
import type { Scalar } from '$graph-editor/socket';
import { ConverterNode, InputControlNode } from './common-data-nodes.svelte';

/**
 * A node that outputs a number.
 */
@registerNode('number.NumberNode')
@description('Produces a number.')
@tags('float', 'real', 'x', 'y', 'z', 't')
export class NumberNode extends InputControlNode<'number'> {
	constructor(params?: NodeParams) {
		super({ label: 'Number', ...params, controlType: 'number', props: { class: 'w-3' } });
	}
}

@registerNode('number.ToString')
@description('Converts a number to a string.')
@registerConverter('number', 'string')
@tags('string', 'text', 'convert')
export class ToStringNode extends ConverterNode<'number', 'string'> {
	constructor(params: NodeParams = {}) {
		super({
			label: 'To string',
			...params,
			source: 'number',
			target: 'string',
			convert: (e) => String(e)
		});
	}
}

@registerNode('number.Floor')
@description('Gets the largest integer less than or equal to a number.')
@registerConverter('number', 'integer')
@tags('int', 'convert', 'partie entière')
export class FloorNode extends ConverterNode<'number', 'integer'> {
	constructor(params: NodeParams = {}) {
		super({
			label: 'Floor',
			...params,
			source: 'number',
			target: 'integer',
			convert: (e) => Math.floor(e)
		});
	}
}

@registerNode('number.Ceil')
@description('Gets the smallest integer greater than or equal to a number.')
@registerConverter('number', 'integer')
@tags('int', 'convert')
export class CeilNode extends ConverterNode<'number', 'integer'> {
	constructor(params: NodeParams = {}) {
		super({
			label: 'Ceil',
			...params,
			source: 'number',
			target: 'integer',
			convert: (e) => Math.ceil(e)
		});
	}
}

@registerNode('number.Round')
@description('Gets the closest integer to a number.')
@registerConverter('number', 'integer')
@tags('int', 'convert', 'arrondir')
export class RoundNode extends ConverterNode<'number', 'integer'> {
	constructor(params: NodeParams = {}) {
		super({
			label: 'Round',
			...params,
			source: 'number',
			target: 'integer',
			convert: (e) => Math.round(e)
		});
	}
}

@registerNode('number.Parse')
@description('Parses a string to a number.')
@registerConverter('string', 'number')
@tags('float', 'convert')
export class ParseNode extends ConverterNode<'string', 'number'> {
	constructor(params: NodeParams = {}) {
		super({
			label: 'Parse Number',
			...params,
			source: 'string',
			target: 'number',
			convert: (e) => parseFloat(e)
		});
	}
}

@registerNode('number.ToBool')
@description('Converts a number to a boolean.')
@registerConverter('number', 'boolean')
@tags('bool', 'convert')
export class ToBoolNode extends ConverterNode<'number', 'boolean'> {
	constructor(params: NodeParams = {}) {
		super({
			label: 'To boolean',
			...params,
			source: 'number',
			target: 'boolean',
			convert: (e) => Boolean(e)
		});
	}
}

@registerNode('number.Multiply')
@description('Multiplies two numbers.')
@tags('multiply', 'x', '*')
export class MultiplyNode extends Node<
	{ a: Scalar<'number'>; b: Scalar<'number'> },
	{ value: Scalar<'number'> }
> {
	constructor(params: NodeParams = {}) {
		super({ label: 'Multiply', ...params });
		this.addInData('a', {
			type: 'number'
		});
		this.addInData('b', {
			type: 'number'
		});
		this.addOutData('value', {
			type: 'number'
		});
	}
	data(
		inputs?: SocketsValues<{ a: Scalar<'number'>; b: Scalar<'number'> }> | undefined
	): SocketsValues<{ value: Scalar<'number'> }> {
		return { value: this.getData('a', inputs) * this.getData('b', inputs) };
	}
}
