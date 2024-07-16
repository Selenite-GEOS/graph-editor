import { StartNode } from '../node/control/StartNode';
import { NodeEditor } from '../NodeEditor';
import { TimeLoopNode } from '../node/control/TimeLoopNode';
import { LogNode } from '../node/io/LogNode';
import { OutputVtkNode } from '../node/makutu/solver/OutputVtk';
import { EveryNode } from '../node/control/EveryNode';
import type { NodeFactory } from '$graph-editor/editor';
import type { EditorExample } from './types';

export const timeloopExample: EditorExample = async (factory: NodeFactory) => {
	const editor = factory.getEditor();
	const start = new StartNode({ factory });
	await editor.addNode(start);

	const timeLoop = new TimeLoopNode({ factory });
	await editor.addNode(timeLoop);

	await editor.addExecConnection(start, timeLoop);

	const outputVtk = new LogNode({ factory, message: 'Hello!' });
	await editor.addNode(outputVtk);

	const every = new EveryNode({ factory });
	await editor.addNode(every);

	await editor.addNewConnection(timeLoop, 'loop', every, 'exec');
	await editor.addExecConnection(every, outputVtk);

	return editor.getNodes();
};
