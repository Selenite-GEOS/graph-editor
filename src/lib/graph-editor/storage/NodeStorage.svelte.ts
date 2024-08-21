import { GitHubDataSource } from './datasources';
import { IndexedDBSource } from './db.svelte';
import type { Database, Datasource as DataSource, Graph } from './types';

export class NodeStorage {
    static pullDataSourcesInterval = 5000
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
	private constructor() {
		const { unsubscribe } = NodeStorage.mainStorage.numGraphs.subscribe((num) => {
			this.numGraphs = num;
		});
		NodeStorage.updateLoop();

		if (import.meta.hot) {
			import.meta.hot.on('vite:beforeUpdate', () => {
				unsubscribe();
				clearTimeout(NodeStorage.updateTimeout);
			});
		}
		console.debug('Setting up NodeStorage.');
	}

	static updateTimeout: NodeJS.Timeout | undefined;
	static async updateLoop() {
		await NodeStorage.pullSources();
		NodeStorage.updateTimeout = setTimeout(NodeStorage.updateLoop, NodeStorage.pullDataSourcesInterval);
	}

	static get numGraphs() {
		return NodeStorage.instance.numGraphs;
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
		console.debug('Pulling sources');
		const res = (await Promise.all(NodeStorage.sources.map((source) => source.getGraphs()))).flat();

		NodeStorage.mainStorage.saveGraphs(res);
		console.debug('Pulled sources', res);
	}
}
