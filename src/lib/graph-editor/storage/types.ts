import type {
	CommentSaveData,
	ConnectionSaveData,
	NodeEditorSaveData,
	NodeSaveData
} from '$graph-editor';
import type { SocketType } from '$graph-editor/plugins/typed-sockets';
import type { SocketDatastructure } from '$graph-editor/socket';
import type { Variable } from '$graph-editor/variables';
import type { Observable } from 'dexie';

export type GraphPorts = {
	key: string;
	label: string;
	type: SocketType;
	datastructure: SocketDatastructure;
	nodeId: string;
	description?: string;
	priority?: number;
	default?: unknown;
}[];

/** Visual programming graph save data structure . */
export interface Graph {
	/** ID of the graph. */
	id: string;
	/** Name of the graph. */
	name?: string;
	/** Description of the graph. */
	description?: string;

	/** Data of the graph. */
	graph: NodeEditorSaveData;

	/** Author of the graph. */
	author?: string;
	/** Public visibility of the graph. */
	public?: boolean;
	/** Version of the graph. */
	version?: number;
	/** Date of the last modification. */
	updatedAt?: Date;
	/** Date of creation. */
	createdAt?: Date;
	/** Version of the GEOS schema. */
	schemaVersion?: string;
	/** Search tags of the graph. */
	tags?: string[];

	/** Menu path. */
	path?: string[];

	inputs?: GraphPorts;
	outputs?: GraphPorts;
	variables?: {
		keep?: boolean;
		label?: string;
		id: string;
		description?: string;
		priority?: number;
	}[];
	// TODO: input props, output props
}

export interface StoredGraph extends Graph {}

export interface Datasource {
	getGraphs(): Promise<Graph[]>;
}

export interface Database extends Datasource {
	clearGraphs(): Promise<void>;
	getGraph(id: string): Promise<Graph | undefined>;
	saveGraph(graph: Graph): Promise<string>;
	saveGraphs(graphs: Graph[]): Promise<string>;
	numGraphs: Observable<number>;
	graphs: Observable<StoredGraph[]>;
}
