import type { NodeFactory } from '../../../editor/NodeFactory';
import { SolverAPINode } from './SolverAPINode';

export class ReinitSolverNode extends SolverAPINode {
	constructor({ factory }: { factory: NodeFactory }) {
		super({ label: 'Reinit Solver', url: '/reinit-solver', factory });
		this.pythonComponent.addCode('$(solver).reinitSolver()');
	}
}
