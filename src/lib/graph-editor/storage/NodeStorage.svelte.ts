import { GitHubDataSource } from './datasources';
import { IndexedDBSource } from './db.svelte';
import {
	type StoredGraph,
	type Database,
	type Datasource as DataSource,
	type Graph
} from './types';

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
	graphs = $state<StoredGraph[]>([]);

	data: {tags: string[], paths: string[][]}   = $derived.by(() => {
		const paths: string[][] = []
		const tags = new Set<string>();
		for (const graph of this.graphs) {
			for (const tag of graph.tags ?? []) {
				tags.add(tag);
			}
			if (graph.path)
				paths.push(graph.path);
		}
		return {paths, tags: Array.from(tags)};
	})

	static get tags() {
		return NodeStorage.instance.data.tags;
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
