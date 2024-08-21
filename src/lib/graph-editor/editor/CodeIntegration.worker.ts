// // Worker
// import { Connection, Node, XmlNode } from '$graph-editor/nodes';
// // import { ErrorWNotif } from '$lib/global';
import type { Connection, GraphNode } from '$graph-editor/nodes';
import {
	ComplexType,
	parseXml,
	XmlSchema,
	type SaveData,
	type SimpleType} from '@selenite/commons';
import { xmlToGraph } from './code-integration/utils.svelte';
// import { xmlToGraph } from './CodeIntegration.svelte';
export type WorkerMessage = {
	type: 'xmlToGraph';
	xml: string;
	schema: SaveData<XmlSchema>;
};

export type WorkerResult = {
	type: 'xmlToGraph';
	nodes: SaveData<GraphNode>[];
	connections: SaveData<Connection>[];
}

onmessage = (e: MessageEvent<WorkerMessage>) => {
	const { data } = e;
	switch (data.type) {
		case 'xmlToGraph': {
			const { xml } = data;
			const schema = XmlSchema.fromJSON(data.schema);
			const { nodes, connections } = xmlToGraph({xml, schema});
			console.log("wow schema", schema)
			console.log("wow res", nodes, connections)

			const msg: WorkerResult = { type: 'xmlToGraph', nodes: nodes.map(n => n.toJSON()), connections: connections.map(c => c.toJSON()) };
			console.log("wow msg", msg)
			postMessage(msg);
			break;
		}
	}
};

