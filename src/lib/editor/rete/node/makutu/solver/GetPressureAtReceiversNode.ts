import { Node } from '../../Node';
import type { NodeFactory } from '../../NodeFactory';
import { SolverAPINode } from './SolverAPINode';

export class GetPressuresAtReceiversNode extends SolverAPINode {
	constructor({ factory }: { factory: NodeFactory }) {
		super({
			label: 'Get Pressures At Receivers',
			url: '/get_pressures_at_receivers',
			factory,
			height: 250
		});
		this.addOutData({
			name: 'seismos',
			type: 'pythonObject',
			displayName: 'Seismos'
		});

		this.pythonComponent.addVariable('seismos');
		this.pythonComponent.addCode('seismos = $(solver).getPressureAtReceivers()');
	}
}
