import type { SocketType } from '$rete/plugin/typed-sockets';

export type Variable = {
	name: string;
	value: unknown;
	type: SocketType;
	isArray: boolean;
	exposed: boolean;
	id: string;
	highlighted: boolean;
};

export const possibleTypes: SocketType[] = [
	'string',
	'number',
	'boolean',
	'vector',
	'path',
	'integer',
	'groupNameRef'
];
