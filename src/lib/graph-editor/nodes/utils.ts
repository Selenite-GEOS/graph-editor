import { structures } from 'rete-structures';
import { Connection, Node } from './Node.svelte';
import type { Socket } from '$graph-editor/socket';

// TODO : make the leave every or every leave based on every node current
type NodeTypes = { inputs: Record<string, Socket>, outputs: Record<string, Socket> };
export function getLeavesFromOutput<T extends NodeTypes>(node: Node<T['inputs'], T['outputs']>, key: string): Node[] {
	const connections = node.getEditor().getConnections();

	const loopNode = connections
		.filter(
			(connection) =>
				connection.source === node.id && (connection as Connection).sourceOutput === key
		)
		.map((connection) => node.getEditor().getNode(connection.target))[0];

	if (!loopNode) return [];

	return getNodesToWaitFor(loopNode, structures(node.getEditor()));
}

function getNodesToWaitFor(node: Node, struct): Node[] {
	const outExec = node.getNaturalFlow();
	// console.log("outExec", outExec);

	if (outExec === undefined || !(outExec in node.outputs)) return [node];
	const editor = node.getEditor();
	const nextNodes = editor
		.getConnections()
		.filter((connection) => connection.source === node.id && connection.sourceOutput === outExec)
		.map((connection) => editor.getNode(connection.target));

	if (nextNodes.length === 0) return [node];
	const nextNode = nextNodes[0];

	return getNodesToWaitFor(nextNode, struct);
}
