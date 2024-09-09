import type { NodeEditorSaveData } from '$graph-editor';
import type { SocketType } from '$graph-editor/plugins/typed-sockets';
import type { SocketDatastructure } from '$graph-editor/socket';
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
export interface MacroBlock {
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
export interface Graph extends MacroBlock {}
export interface StoredGraph extends Graph {}

export interface Datasource {
	getGraphs(): Promise<Graph[]>;
}

export interface Database extends Datasource {
	deleteMacro(id: string): Promise<void>;
	clearGraphs(): Promise<void>;
	clearMacroBlocks(): Promise<void>;
	getGraph(id: string): Promise<MacroBlock | undefined>;
	getMacroBlock(id: string): Promise<MacroBlock | undefined>;
	saveGraph(graph: Graph): Promise<string>;
	saveMacroBlock(graph: MacroBlock): Promise<string>;
	saveGraphs(graphs: Graph[]): Promise<string>;
	saveMacroBlocks(graphs: MacroBlock[]): Promise<string>;
	numGraphs: Observable<number>;
	numMacroBlocks: Observable<number>;
	graphs: Observable<MacroBlock[]>;
	macroblocks: Observable<MacroBlock[]>;
}
