import type { NodeFactory } from '../$graph-editor/editor';
import { SolverAPINode } from './SolverAPINode';

export class InitializeSolverNode extends SolverAPINode {
	constructor({ factory }: { factory: NodeFactory }) {
		super({ label: 'Initialize Solver', url: '/initialize', factory, height: 250 });

		this.pythonComponent.addCode('$(solver).initialize(rank, $(xml))');

		this.oldAddInData({
			name: 'xml',
			displayName: 'XML',
			socketLabel: 'XML',
			type: 'pythonObject'
		});
	}
}
