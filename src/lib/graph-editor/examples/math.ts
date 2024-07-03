import { NumberNode } from '../node/data/NumberNode';
import { AddNode } from '../node/math/AddNode';
import { Connection } from '../node/Node';
import { DisplayNode } from '../node/io/DisplayNode';
import type { EditorExample } from './types';
import type { NodeFactory } from '$graph-editor/editor';

export const sumExample: EditorExample = async (factory: NodeFactory) => {
	const editor = factory.getEditor();
	const numberNode = new NumberNode({ factory, initial: 2 });
	editor.addNode(numberNode);

	const numberNode2 = new NumberNode({ factory, initial: 3 });
	editor.addNode(numberNode2);

	const addNode = new AddNode({ factory, b: 3 });
	await editor.addNode(addNode);

	await editor.addConnection(new Connection(numberNode, 'value', addNode, 'left'));
	await editor.addConnection(new Connection(numberNode2, 'value', addNode, 'right'));

	const displayNode = new DisplayNode({ factory, initial: 3 });
	await editor.addNode(displayNode);
	await editor.addConnection(new Connection(addNode, 'value', displayNode, 'input'));

	return editor.getNodes();
};
