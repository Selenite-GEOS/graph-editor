import { description, path, tags, type NodeParams } from '$Node';
import { registerNode } from '$graph-editor/editor';
import { InputControlNode } from './common';

@registerNode('number.NumberNode')
export class NumberNode extends InputControlNode<'number'> {
	constructor(params?: NodeParams) {
		super({ label: 'Number', ...params, type: 'number' });
	}
}

@registerNode('string.StringNode')
@description('Creates a string')
@tags('string', 'data', 'scalar', 'basic')
export class StringNode extends InputControlNode<'text'> {
	constructor(params?: NodeParams) {
		super({ label: 'String', ...params, type: 'text' });
	}
}

@registerNode('boolean.BooleanNode')
export class BooleanNode extends InputControlNode<'checkbox'> {
	constructor(params?: NodeParams) {
		super({ label: 'Boolean', ...params, type: 'checkbox' });
	}
}
