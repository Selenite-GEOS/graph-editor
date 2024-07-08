import type { Position } from '$graph-editor/common';
import type { ShowContextMenu } from '$graph-editor/plugins/context-menu';
import type { MenuItem } from '$graph-editor/plugins/context-menu/types';

/**
 * This class is a singleton that represents the state of the context menu.
 *
 * It autohides based on the hovered state and filters items based on a query.
 */
export class ContextMenu {
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
	visible = $state(false);

	/** Delay before hiding menu in miliseconds. */
	hidingDelay = $state(100);

	/** Visibility of the searchbar. */
	searchbar = $state(false);

	/** Items of the menu. */
	items = $state<MenuItem[]>([]);

	/** Query string to filter items. */
	query = $state('');

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

	/** Is the context menu hovered. */
	#hovered = $state(false);

	/** Timeout to hide the menu. */
	#hideTimeout: NodeJS.Timeout | null = null;

	/** Sets hovered state and manages autohide. */
	set hovered(v: boolean) {
		this.#hovered = v;
		if (v && this.#hideTimeout) {
			clearTimeout(this.#hideTimeout);
			this.#hideTimeout = null;
		} else {
			this.#hideTimeout = setTimeout(() => {
				if (!this.#hovered) {
					this.visible = false;
				}
			}, this.hidingDelay);
		}
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
export const showContextMenu: ShowContextMenu = ({ items, pos, searchbar }) => {
	const menu = ContextMenu.instance;
	menu.visible = true;
	menu.pos = pos;
	menu.searchbar = searchbar;
	menu.items = items;
};
