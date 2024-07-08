import type { IMenuItem, MenuItemQuery, QueriableMenuItem } from './types';

export function isArrayOfStrings(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

export function filterMenuItems<T extends QueriableMenuItem>({
	menuItems,
	filter,
	allowMissingKey = true,
	verifyAll = true
}: {
	menuItems: T[];
	filter: MenuItemQuery;
	allowMissingKey?: boolean;
	verifyAll?: boolean;
}): T[] {
	return menuItems.filter((menuItem) => {
		const queries = Object.entries(filter);

		return (verifyAll ? Array.prototype.every : Array.prototype.some).call(
			queries,
			([key, filter_value]) => {
				let isGetter = false;
				if (!(key in menuItem)) {
					isGetter = true;
					key = 'get' + key[0].toUpperCase() + key.slice(1);
				}

				if (!(key in menuItem)) return allowMissingKey;

				let item_value: unknown;
				if (isGetter) {
					const tmp = menuItem[key as keyof Omit<QueriableMenuItem, 'type'>];
					if (typeof tmp !== 'function') throw new Error(`Property ${key} is not a getter`);
					item_value = tmp();
				} else {
					item_value = menuItem[key as keyof QueriableMenuItem];
				}

				if (typeof filter_value !== typeof item_value) return false;

				if (typeof filter_value === 'string') {
					const test_string = (item_value as string).toLowerCase();
					return test_string.includes(filter_value.toLowerCase());
				} else if (isArrayOfStrings(filter_value) && isArrayOfStrings(item_value)) {
					const test_array = item_value.map((value) => value.toLowerCase());
					console.log('Array of strings', test_array, filter_value);
					return filter_value.some((value) =>
						test_array.some((v) => v.includes(value.toLowerCase()))
					);
				} else if (Array.isArray(filter_value) && Array.isArray(item_value)) {
					const test_array = (item_value as unknown[]).map((value) =>
						typeof value === 'string' ? value.toLowerCase() : value
					);
					return filter_value.some((value) =>
						test_array.includes(typeof value === 'string' ? value.toLowerCase() : value)
					);
				} else {
					return filter_value === item_value;
				}
			}
		);
	});
}

type MenuLayer = Map<string, MenuLayer | IMenuItem[]>;

export type MenuArrayView = [string, MenuArrayView | IMenuItem][];

export interface IHierachicalMenu {
	getMenuItems: () => IMenuItem[];
	getSubmenus: () => IHierachicalMenu[];
	getAllItems: () => Array<IMenuItem | IHierachicalMenu>;
	getArrayView: () => MenuArrayView;
	getLabel: () => string | undefined;
}

export function isHierachicalMenu(obj: object): obj is IHierachicalMenu {
	return 'getMenuItems' in obj;
}

function addToMenuLayer(menuItem: IMenuItem, path: string[], menuLayer: MenuLayer) {
	if (path.length === 0) {
		if (!menuLayer.has('_items')) menuLayer.set('_items', []);

		(menuLayer.get('_items') as IMenuItem[]).push(menuItem);
	} else {
		const hd = path[0];
		const tl = path.slice(1);
		if (!menuLayer.has(hd)) menuLayer.set(hd, new Map());

		addToMenuLayer(menuItem, tl, menuLayer.get(hd) as MenuLayer);
	}
}

class HierachicalMenu implements IHierachicalMenu {
	constructor(
		private readonly menuLayer: MenuLayer,
		private readonly label?: string
	) {}

	getLabel(): string | undefined {
		return this.label;
	}

	getArrayView(): MenuArrayView {
		const res: MenuArrayView = [];
		for (const [key, value] of this.menuLayer.entries()) {
			if (key === '_items') continue;
			res.push([key, new HierachicalMenu(value as MenuLayer, key).getArrayView()]);
		}
		for (const item of this.getMenuItems()) {
			res.push([item.getLabel(), item]);
		}
		return res;
	}

	getMenuItems(): IMenuItem[] {
		return this.menuLayer.has('_items') ? (this.menuLayer.get('_items') as IMenuItem[]) : [];
	}

	getSubmenus(): HierachicalMenu[] {
		return Array.from(this.menuLayer.entries())
			.filter(([key, value]) => key !== '_items')
			.map(([key, value]) => new HierachicalMenu(value as MenuLayer, key));
	}

	getAllItems(): Array<IMenuItem | IHierachicalMenu> {
		const res: Array<IMenuItem | IHierachicalMenu> = [];
		for (const item of this.getMenuItems()) {
			res.push(item);
		}
		for (const submenu of this.getSubmenus()) {
			res.push(submenu);
		}
		return res;
	}
}

export function collectMenuView(menuItems: IMenuItem[]): IHierachicalMenu {
	const res: MenuLayer = new Map();

	for (const item of menuItems) {
		const path = item.getMenuPath();
		addToMenuLayer(item, path, res);
	}

	return new HierachicalMenu(res);
}
