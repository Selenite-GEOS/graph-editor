import type { SocketType } from '$graph-editor/plugins';
import type { InputControlTypes } from './Control';

export * from './Control';
export * from './button/button';
export function assignControl(
	socketType: SocketType,
	default_?: InputControlTypes
): InputControlTypes | undefined {
	const controlMap: { [key in SocketType]?: InputControlTypes } = {
		path: 'remote-file',
		string: 'text',
		integer: 'integer',
		number: 'number',
		boolean: 'checkbox',
		vector: 'vector',
		any: 'text',
		groupNameRef: 'group-name-ref'
	};

	return socketType in controlMap ? controlMap[socketType] : default_;
}
