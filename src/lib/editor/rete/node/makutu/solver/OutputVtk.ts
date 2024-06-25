import type { NodeFactory } from '../../NodeFactory';
import { SolverAPINode } from './SolverAPINode';

export class OutputVtkNode extends SolverAPINode {
	constructor({ factory }: { factory: NodeFactory }) {
		// super('Output VTK', '/output_vtk', { factory });
		super({ label: 'Output VTK', url: '/output_vtk', factory });

		this.addInData({
			name: 'time',
			displayName: 'Time',
			socketLabel: 'Time',
			type: 'number',
			control: {
				type: 'number',
				options: {
					initial: 0,
					label: 'Time'
				}
			}
		});

		this.pythonComponent.addCode('$(solver).outputVtk($(time))');
	}
}
