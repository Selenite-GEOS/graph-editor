export type Tree<T = unknown> = (T | { label: string; forest: Tree<T> })[];
export function isForest<T>(
	candidate: Tree<T>[number]
): candidate is { label: string; forest: Tree<T> } {
	return (candidate as { label: string; forest: Tree<T> }).forest !== undefined;
}
export { default as TreeComponent } from './Tree.svelte';

type TreeCollector<T> = { leaves: T[]; forest: Map<string, TreeCollector<T>> };
export function makeTree<T, K extends string>({
	items,
	pathKey,
	sort
}: {
	items: (T & { [k in K]: string[] })[];
	pathKey: K;
	sort?: (a: T, b: T) => number;
}): Tree<T> {
	const collector: TreeCollector<T> = { leaves: [], forest: new Map() };
	for (const item of items) {
		let current = collector;
		for (const parent of item[pathKey]) {
			if (!collector.forest.has(parent)) {
				collector.forest.set(parent, { leaves: [], forest: new Map() });
			}
			current = collector.forest.get(parent)!;
		}
		current.leaves.push(item);
	}

	const res: Tree<T> = [];
	function rec(current: Tree<T>, currentCollector: TreeCollector<T>) {
		current.push(...currentCollector.leaves.toSorted(sort));
		for (const [k, v] of [...currentCollector.forest.entries()].toSorted(([a], [b]) => a.localeCompare(b))) {
			const forest: Tree<T> = [];
			current.push({ label: k, forest });
			rec(forest, v);
		}
	}
	rec(res, collector);
	return res;
}

export function flattenTree<T>(tree: Tree<T>): T[] {
	const res: T[] = [];
	function rec(current: Tree<T>) {
		for (const item of current) {
			if (isForest(item)) {
				rec(item.forest);
			} else {
				res.push(item);
			}
		}
	}
	rec(tree);
	return res;
}
