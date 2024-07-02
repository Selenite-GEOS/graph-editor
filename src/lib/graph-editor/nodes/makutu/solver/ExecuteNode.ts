import type { NodeFactory } from '../../../editor/NodeFactory';
import { SolverAPINode } from './SolverAPINode';

export class ExecuteNode extends SolverAPINode {
	constructor({ factory }: { factory: NodeFactory }) {
		super({ label: 'Execute Solver', url: '/execute', factory, height: 280 });
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
		this.pythonComponent.addCode('$(solver).execute($(time))');
	}
}
