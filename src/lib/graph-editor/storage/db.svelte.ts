import Dexie, { liveQuery, type EntityTable } from 'dexie';
import type { Database, Graph, MacroBlock } from './types';

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
	clearMacroBlocks(): Promise<void> {
		return db.graphs.clear();
	}
	getGraphs(): Promise<Graph[]> {
		return db.graphs.toArray();
	}
	getMacroBlocks(): Promise<MacroBlock[]> {
		return db.graphs.toArray();
	}

	getMacroBlock(id: string): Promise<MacroBlock | undefined> {
		return db.graphs.get(id);
	}

	getGraph(id: string): Promise<Graph | undefined> {
		return db.graphs.get(id);
	}
	saveMacroBlock(graph: MacroBlock): Promise<string> {
		return db.graphs.put(graph);
	}
	saveGraph(graph: Graph): Promise<string> {
		return db.graphs.put(graph);
	}
	saveMacroBlocks(graphs: MacroBlock[]): Promise<string> {
		return db.graphs.bulkPut(graphs);
	}
	saveGraphs(graphs: Graph[]): Promise<string> {
		return db.graphs.bulkPut(graphs);
	}

	numGraphs = liveQuery(() => db.graphs.count());
	get numMacroBlocks(){
		return this.numGraphs;
	}

	graphs = liveQuery(() => db.graphs.toArray());

	get macroblocks() {
		return this.graphs;
	}
}
