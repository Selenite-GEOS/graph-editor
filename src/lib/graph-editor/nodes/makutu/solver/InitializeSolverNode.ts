import type { NodeFactory } from '../../../editor/NodeFactory';
import { SolverAPINode } from './SolverAPINode';

export class InitializeSolverNode extends SolverAPINode {
	constructor({ factory }: { factory: NodeFactory }) {
		super({ label: 'Initialize Solver', url: '/initialize', factory, height: 250 });

		this.pythonComponent.addCode('$(solver).initialize(rank, $(xml))');

		this.addInData({
			name: 'xml',
			displayName: 'XML',
			socketLabel: 'XML',
			type: 'pythonObject'
		});
	}
}
