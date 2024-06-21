import { EditorType } from '$lib/editor/types';
import type { NodeFactory } from '$rete';
import type { Node } from '$rete/node/Node';

export interface IBaseMenuItem {
	getLabel: () => string;
	getDescription: () => string;
	type: MenuItemType;
	[key: string]: unknown;
	getTags: () => string[];
	getMenuPath: () => string[];
}

export enum MenuItemType {
	Base,
	Node,
	Action
}

export type MenuType = 'tree' | 'flat' | 'popover';

export interface INodeMenuItem extends IBaseMenuItem {
	type: MenuItemType.Node;
	getInTypes: () => string[];
	getOutTypes: () => string[];
	getAddNode: () => ({ factory }: { factory: NodeFactory }) => Node;
	getEditorType: () => EditorType;
}

export interface IActionMenuItem extends IBaseMenuItem {
	type: MenuItemType.Action;
	executeAction: () => void;
}
type OptionalProperties<T> = {
	[P in keyof T]?: T[P];
};
export type QueriableMenuItem = Omit<IBaseMenuItem, 'type'> &
	Partial<Omit<INodeMenuItem, 'type'>> &
	Partial<Omit<IActionMenuItem, 'type'>> & { type: MenuItemType };

export function createQueriableMenuItem(properties: StaticMenuItem): QueriableMenuItem {
	const res = { ...createMenuItem(properties) };
	switch (properties.type) {
		case MenuItemType.Node:
			Object.assign(res, { ...createMenuItem({ ...properties }) });
			break;
		case MenuItemType.Action:
			Object.assign(res, { ...createActionMenuItem({ ...properties }) });
			break;
	}

	return res;
}

type StaticBaseMenuItem = {
	label?: string;
	description?: string;
	tags?: string[];
	menuPath?: string[];
};

type StaticNodeMenuItem = StaticBaseMenuItem & {
	inTypes?: string[];
	outTypes?: string[];
	addNode?: ({ factory }: { factory: NodeFactory }) => Node;
	editorType?: EditorType;
};

type StaticActionMenuItem = StaticBaseMenuItem & {
	executeAction?: () => void;
};
export type StaticMenuItem = StaticBaseMenuItem &
	Partial<StaticNodeMenuItem & StaticActionMenuItem> & { type: MenuItemType };
export type MenuItemQuery = Partial<StaticMenuItem>;

export function createMenuItem({
	label = 'Item',
	description = '',
	tags = [],
	menuPath = []
}: StaticBaseMenuItem): IBaseMenuItem {
	return {
		getLabel: () => label,
		getDescription: () => description,
		type: MenuItemType.Base,
		getTags: () => tags, // Implement getter for tags
		debug: label,
		...(menuPath && { getMenuPath: () => menuPath as string[] })
	};
}

export function isBaseMenuItem(menuItem: IMenuItem): menuItem is IBaseMenuItem {
	return menuItem.type === MenuItemType.Base;
}

export function isNodeMenuItem(menuItem: IMenuItem): menuItem is INodeMenuItem {
	return menuItem.type === MenuItemType.Node;
}

export function isActionMenuItem(menuItem: IMenuItem): menuItem is IActionMenuItem {
	return menuItem.type === MenuItemType.Action;
}

export type IMenuItem<T extends MenuItemType = MenuItemType.Base> = T extends MenuItemType.Base
	? IBaseMenuItem
	: T extends MenuItemType.Node
		? INodeMenuItem
		: T extends MenuItemType.Action
			? IActionMenuItem
			: never;

/**
 * Returns a new INodeMenuItem
 * @param properties
 * @returns
 */
export function createNodeMenuItem(properties: StaticNodeMenuItem): INodeMenuItem {
	const {
		addNode = properties.addNode,
		editorType = EditorType.All,
		description = 'create node',
		inTypes = [],
		outTypes = [],
		label = 'Node'
	} = properties;
	return {
		...createMenuItem({ ...properties, label, description }),
		type: MenuItemType.Node,
		getInTypes: () => inTypes,
		getOutTypes: () => outTypes,
		getAddNode: () => addNode,
		getEditorType: () => editorType
	};
}

export function createActionMenuItem(properties: StaticActionMenuItem): IActionMenuItem {
	const {
		description = 'Execute action',
		label = 'Action',
		executeAction = () => undefined
	} = properties;
	return {
		...createMenuItem({ ...properties, label, description }),
		type: MenuItemType.Action,
		executeAction: () => executeAction()
	};
}
