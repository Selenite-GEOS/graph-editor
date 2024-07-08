import type { Node, NodeFactory } from '$graph-editor';
import type { ConnectionDropEvent } from '$graph-editor/setup/ConnectionSetup';
import { writable } from 'svelte/store';
import type { IBaseMenuItem } from '../types';
import type { Point } from '$lib/types/Point';

export interface MoonMenuItem {
	label: string;
	inChildrenTypes: string[];
	outType: string;
	action: (factory: NodeFactory) => Node;
}

export const moonMenuPositionStore = writable<{ x: number; y: number }>({
	x: 500,
	y: 500
});
export const moonMenuVisibleStore = writable<boolean>(false);
export const moonMenuDropConnectionStore = writable<() => void>(() => {}); // eslint-disable-line @typescript-eslint/no-empty-function
export const moonMenuHideDelayStore = writable<number>(100);
export const moonMenuConnDropEvent = writable<ConnectionDropEvent | null>(null);
export const moonMenuItemsStore = writable<MoonMenuItem[]>([]);
export const newMoonItemsStore = writable<IBaseMenuItem[]>([]);
export const moonMenuFactoryStore = writable<NodeFactory | null>(null);
export const moonMenuSearchBarStore = writable<boolean>(false);
export const moonMenuOnCloseStore = writable<() => void>(() => {}); // eslint-disable-line @typescript-eslint/no-empty-function

export function spawnMoonMenu(params: {
	connDropEvent?: ConnectionDropEvent;
	searchbar?: boolean;
	pos?: Point;
	items?: IBaseMenuItem[];
	onClose?: () => void;
}) {
	const { connDropEvent, searchbar = false, pos, items = [] } = params;
	moonMenuOnCloseStore.set(params.onClose ?? (() => {})); // eslint-disable-line @typescript-eslint/no-empty-function
	moonMenuConnDropEvent.set(connDropEvent ?? null);
	if (connDropEvent) {
		moonMenuDropConnectionStore.set(connDropEvent?.drop);
		moonMenuPositionStore.set(connDropEvent.pos);
	}
	if (pos) {
		moonMenuPositionStore.set(pos);
	}
	moonMenuVisibleStore.set(true);
	moonMenuSearchBarStore.set(searchbar);
	newMoonItemsStore.set(items);
}
