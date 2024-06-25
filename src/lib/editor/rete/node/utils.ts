import { structures } from 'rete-structures';
import { Connection, Node } from './Node';

// TODO : make the leave every or every leave based on every node current
export function getLeavesFromOutput(node: Node, key: string): Node[] {
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
