import type { Position } from '$graph-editor/common';
// import type { ShowContextMenu } from '$graph-editor/plugins/context-menu';
import type { MenuItem } from '$graph-editor/plugins/context-menu/types';
import type { ShowContextMenu } from './context-menu-plugin';

/**
 * This class is a singleton that represents the state of the context menu.
 *
 * It autohides based on the hovered state and filters items based on a query.
 */
export class ContextMenu {
	triggerFirstItem() {
		this.triggerItem(0);
	}
	triggerItem(i: number) {
		const item = this.filteredItems.at(i);
		if (!item) {
			console.warn(`Tried to trigger a non existing item at ${i}.`);
			return;
		}
		item.action();
		this.visible = false;
	}
	/** Singleton instance */
	static #instance: ContextMenu;

	/** Returns the singleton instance. */
	static get instance() {
		if (!this.#instance) {
			this.#instance = new ContextMenu();
		}
		return this.#instance;
	}

	/** Position of the menu, in client coordinates. */
	pos = $state<Position>({ x: 0, y: 0 });

	/** Visibility of the menu. */
	#visible = $state(false);

	get visible() {
		return this.#visible;
	}
	set visible(v: boolean) {
		this.#visible = v;
		if (!v) {
			if (this.onHide) {
				this.onHide();
				this.onHide = undefined;
			}
			this.query = '';
			this.expanded = false;
		}
	}

	/** Delay before hiding menu in miliseconds. */
	hidingDelay = $state(100);

	/** Visibility of the searchbar. */
	searchbar = $state(false);

	onHide = $state<() => void>();

	/** Items of the menu. */
	items = $state<MenuItem[]>([]);

	/** Is menu fully expanded */
	expanded = $state(false);

	/** Query string to filter items. */
	#query = $state('');
	get query() {
		return this.#query;
	}
	set query(q: string) {
		this.#query = q.trim();
		this.expanded = q.trim() !== '';
	}

	/** Filtered items. */
	filteredItems = $derived.by(() => {
		const query = this.query.toLowerCase().trim();
		if (query === '') {
			return this.items;
		}
		// Filter and sort items based on the query
		return (
			this.items
				.map((item) => {
					// Compute a score based on the position of the query in the item
					const repr = [item.label, ...item.tags, ...item.path].map((s) => s.toLowerCase());
					const score = repr.reduce((acc, s) => {
						const pos = s.indexOf(query);
						return acc + (pos === -1 ? 0 : 1 / (pos + 1));
					}, 0);
					return { item, score };
				})
				// Keep only items with a positive score
				.filter(({ score }) => score > 0)
				.sort((a, b) => b.score - a.score)
				.map(({ item }) => item)
		);
	});

	#focused = $state(false);
	get focused() {
		return this.#focused;
	}
	set focused(f: boolean) {
		this.#focused = f;
		// this.updateAutohide();
	}
	/** Is the context menu hovered. */
	#hovered = $state(false);

	/** Timeout to hide the menu. */
	#hideTimeout: NodeJS.Timeout | null = null;

	private updateAutohide() {
		if (this.#hovered) {
			if (this.#hideTimeout) {
				clearTimeout(this.#hideTimeout);
				this.#hideTimeout = null;
			}
		} else {
			this.#hideTimeout = setTimeout(() => {
				if (!this.#hovered) {
					this.visible = false;
				}
			}, this.hidingDelay);
		}
	}

	/** Sets hovered state and manages autohide. */
	set hovered(v: boolean) {
		this.#hovered = v;
		this.updateAutohide();
	}

	/** Returns hovered state. */
	get hovered() {
		return this.#hovered;
	}

	private constructor() {}
}

/**
 * Shows the context menu with the given items at the given position.
 *
 * Helper function to use the context menu singleton.
 */
export const showContextMenu: ShowContextMenu = ({
	items,
	pos,
	searchbar,
	onHide,
	expand = false
}) => {
	const menu = ContextMenu.instance;
	menu.expanded = expand;
	menu.visible = true;
	menu.pos = pos;
	menu.searchbar = searchbar;
	menu.items = items.map((item, i) => {
		return {
			label: String(i),
			id: String(i),
			description: '',
			action: () => {
				console.warn('Missing action for menu item', item.label ?? String(i));
			},
			path: [],
			tags: [],
			...item
		};
	});
	menu.onHide = onHide;
};
