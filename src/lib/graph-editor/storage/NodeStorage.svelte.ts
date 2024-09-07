import { persisted } from '@selenite/commons';
import { GitHubDataSource } from './datasources';
import { IndexedDBSource } from './db.svelte';
import { FavoritesManager } from './FavoritesManager.svelte';
import type { Database, MacroBlock, Datasource as DataSource, Graph } from './types';
import { get, type Writable } from 'svelte/store';

export const userStore: Writable<string> = persisted('user', '');

export class NodeStorage {
	static pullDataSourcesInterval = 5000;
	static mainStorage: Database = new IndexedDBSource();
	static sources: DataSource[] = [
		new GitHubDataSource('https://github.com/Selenite-GEOS/macro-blocks/tree/main/macro-blocks')
	];

	static #instance: NodeStorage;
	static get instance(): NodeStorage {
		if (!NodeStorage.#instance) {
			NodeStorage.#instance = new NodeStorage();
		}
		return NodeStorage.#instance;
	}

	numGraphs = $state(0);
	graphs = $state<MacroBlock[]>([]);

	static get macroblocks() {
		return NodeStorage.instance.graphs;
	}

	data: { tags: string[]; favorites: MacroBlock[]; paths: string[][]; userBlocks: MacroBlock[] } =
		$derived.by(() => {
			const paths: string[][] = [];
			const tags = new Set<string>();
			const favorites: MacroBlock[] = [];
			const user = get(userStore);
			const userBlocks: MacroBlock[] = [];
			for (const graph of this.graphs) {
				for (const tag of graph.tags ?? []) tags.add(tag);
				if (FavoritesManager.isFavorite(graph.id)) favorites.push(graph);
				if (graph.path) paths.push(graph.path);
				if (user && graph.author === user) userBlocks.push(graph);
			}
			return { paths, favorites, tags: Array.from(tags), userBlocks };
		});

	static get favorites() {
		return NodeStorage.instance.data.favorites;
	}
	static get tags() {
		return NodeStorage.instance.data.tags;
	}
	static get userBlocks() {
		return NodeStorage.instance.data.userBlocks;
	}
	static get paths() {
		return NodeStorage.instance.data.paths;
	}

	static get data() {
		return NodeStorage.instance.data;
	}

	private constructor() {
		const { unsubscribe } = NodeStorage.mainStorage.numGraphs.subscribe((num) => {
			this.numGraphs = num;
		});
		NodeStorage.mainStorage.graphs.subscribe((graphs) => {
			this.graphs = graphs;
		});
		NodeStorage.updateLoop();

		if (import.meta.hot) {
			import.meta.hot.on('vite:beforeUpdate', () => {
				// unsubscribe();
				clearTimeout(NodeStorage.updateTimeout);
			});
		}
		console.debug('Setting up NodeStorage.');
	}

	static updateTimeout: NodeJS.Timeout | undefined;
	static async updateLoop() {
		await NodeStorage.pullSources();
		NodeStorage.updateTimeout = setTimeout(
			NodeStorage.updateLoop,
			NodeStorage.pullDataSourcesInterval
		);
	}

	static get numGraphs() {
		return NodeStorage.instance.numGraphs;
	}

	static get graphs() {
		return NodeStorage.instance.graphs;
	}

	static getGraphs(): Promise<Graph[]> {
		return NodeStorage.mainStorage.getGraphs();
	}
	static getGraph(id: string): Promise<Graph | undefined> {
		return NodeStorage.mainStorage.getGraph(id);
	}

	static saveGraph(graph: Graph): Promise<string> {
		return NodeStorage.mainStorage.saveGraph(graph);
	}

	static clearGraphs(): Promise<void> {
		return NodeStorage.mainStorage.clearGraphs();
	}

	static async pullSources() {
		// console.debug('Pulling sources');
		const res = (await Promise.all(NodeStorage.sources.map((source) => source.getGraphs()))).flat();

		NodeStorage.mainStorage.saveGraphs(res);
		// console.debug('Pulled sources', res);
	}
}
