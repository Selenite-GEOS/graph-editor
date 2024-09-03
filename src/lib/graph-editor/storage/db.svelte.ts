
import Dexie, { liveQuery, type EntityTable } from 'dexie';
import type { Database, Graph } from './types';



/** Database instance to work with IndexedDB. */
export const db = new Dexie('selenite') as Dexie & {
	graphs: EntityTable<Graph, 'id'>;
};

db.version(1).stores({
	graphs:
		'id,&[name+author.id],name,description,author.id,author.name,public,version,updatedAt,createdAt,favoriteOf,schemaVersion,tags'
});

export class IndexedDBSource implements Database {
	clearGraphs(): Promise<void> {
		return db.graphs.clear();
	}
	getGraphs(): Promise<Graph[]> {
		return db.graphs.toArray();
	}
	getGraph(id: string): Promise<Graph | undefined> {
		return db.graphs.get(id);
	}
	saveGraph(graph: Graph): Promise<string> {
		return db.graphs.put(graph);
	}
	saveGraphs(graphs: Graph[]): Promise<string> {
		return db.graphs.bulkPut(graphs);
	}

	numGraphs = liveQuery(() => db.graphs.count());

	graphs = liveQuery(() => db.graphs.toArray());
}