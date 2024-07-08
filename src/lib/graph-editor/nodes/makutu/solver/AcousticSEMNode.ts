import { APINode } from '../../APINode';
import type { NodeFactory } from '../$graph-editor/editor';

/**
 * This node displays the value of the input.
 */
export class AcousticSEMNode extends APINode {
	// height = 150;
	width = 180;

	constructor({ factory }: { factory: NodeFactory }) {
		super({
			label: 'Create AcousticSEM',
			factory,
			url: '/makutu/solver/create-acoustic-sem',
			height: 180
		});

		this.oldAddOutData({
			name: 'solver',
			displayName: 'Solver',
			socketLabel: 'Solver',
			type: 'pythonObject'
		});

		this.pythonComponent.addImportStatement('from utilities.solvers import AcousticSolver');
		this.pythonComponent.addCode('$(solver) = AcousticSolver()');
		this.pythonComponent.addVariable('solver');

		// Display value
	}

	// data(inputs: Record<string, object>): Record<string, object> | Promise<Record<string, object>> {
	// 	return { solver: new PythonObject(10) };
	// }
}
