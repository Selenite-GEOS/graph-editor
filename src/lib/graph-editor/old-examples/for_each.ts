import { NodeEditor } from 'rete';
import { type Schemes } from '../node/Schemes';
import { Connection } from '../node/Node';
import { StartNode } from '../node/control/StartNode';
import { LogNode } from '../node/io/LogNode';
import { MakeArrayNode } from '../node/data/MakeArrayNode';
import { NumberNode } from '../node/data/NumberNode';
import { ForEachNode } from '../node/control/ForEachNode';
import type { EditorExample } from './types';
import type { NodeFactory } from '$graph-editor/editor';

export const forEachExample: EditorExample = async (factory: NodeFactory) => {
	const editor = factory.getEditor();
	factory.enable();
	const start = new StartNode({ factory });
	await editor.addNode(start);

	const log = new LogNode({ factory, message: "Hello I'll show you some numbers" });
	await editor.addNode(log);

	await editor.addNewConnection(start, 'exec', log, 'exec');
	const makeArray = new MakeArrayNode({ factory });
	await editor.addNode(makeArray);
	makeArray.addPin();
	makeArray.addPin();
	const number1 = new NumberNode({ factory, initial: 1 });
	await editor.addNode(number1);
	const number2 = new NumberNode({ factory, initial: 2 });
	await editor.addNode(number2);
	const number3 = new NumberNode({ factory, initial: 3 });
	await editor.addNode(number3);
	await editor.addNewConnection(number1, 'value', makeArray, 'data-0');
	await editor.addNewConnection(number2, 'value', makeArray, 'data-1');
	await editor.addNewConnection(number3, 'value', makeArray, 'data-2');

	const forEach = new ForEachNode({ factory });
	await editor.addNode(forEach);
	await editor.addNewConnection(makeArray, 'array', forEach, 'array');
	await editor.addNewConnection(log, 'exec', forEach, 'exec');
	const logItem = new LogNode({ factory });
	await editor.addNode(logItem);
	await editor.addNewConnection(forEach, 'item', logItem, 'message');
	await editor.addNewConnection(forEach, 'loop', logItem, 'exec');
	const logEnd = new LogNode({ factory, message: "I'm done!" });
	await editor.addNode(logEnd);
	await editor.addNewConnection(forEach, 'exec', logEnd, 'exec');

	return editor.getNodes();
};
