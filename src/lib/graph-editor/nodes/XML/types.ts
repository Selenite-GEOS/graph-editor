import type { DataType } from '$graph-editor/plugins/typed-sockets';
import type { InputControlType } from '$graph-editor/socket';

export type XmlData = {
	name: string;
	xmlTag: string;
};

type PropertyNames<T> = {
	[K in keyof T]: K;
}[keyof T];

export type XmlAttributeDefinition = {
	options?: string[] | null;
	name: string;
	type: DataType;
	required?: boolean;
	pattern?: string | null;
	controlType?: InputControlType;
	isArray?: boolean;
};

export type XmlAttribute = {
	name: string;
	value: unknown;
};
