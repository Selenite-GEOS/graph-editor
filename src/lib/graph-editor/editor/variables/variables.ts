import type { DataType } from "$graph-editor/plugins/typed-sockets";

export type Variable = {
	name: string;
	value: unknown;
	type: DataType;
	isArray: boolean;
	exposed: boolean;
	id: string;
	highlighted: boolean;
};

export const possibleVarTypes: DataType[] = [
	'string',
	'number',
	'boolean',
	'vector',
	'path',
	'integer',
	'groupNameRef'
];
