import { APINode } from '../../APINode';
import type { NodeFactory } from '../../../editor/NodeFactory';

export class SEGYAcquisitionNode extends APINode {
	constructor({ factory }: { factory: NodeFactory }) {
		super({ label: 'SEGY Acquisition', factory, url: '/makutu/acquisition/segy' });

		this.addInData({
			name: 'segdir',
			displayName: 'Seg Directory',
			type: 'string',
			control: {
				type: 'text',
				options: {
					initial: 'acquisition/'
				}
			}
		});
		this.addOutData({
			name: 'shots',
			displayName: 'Shots',
			type: 'pythonObject',
			isArray: true
		});

		this.pythonComponent.addParseArgument({
			name: 'segdir',
			type: 'str',
			required: true,
			help: 'Directory containing the .segy files for the acquisition'
		});
		this.pythonComponent.addImportStatement('from utilities.acquisition import SEGYAcquisition');
		// this.pythonComponent.addVariable('shots');
		this.pythonComponent.setDataCodeGetter('shots', () => '$(acquisition).shots');
		this.pythonComponent.addDynamicOutput('shots');
		this.pythonComponent.setEmptyNewlinesBefore(1);

		this.pythonComponent.setCodeTemplateGetter(
			() =>
				`
# Read acquisition from SEGY files
if rank == 0:
    $(acquisition) = SEGYAcquisition(xml=xml, segdir=segdir)
else:
    $(acquisition) = None
$(acquisition) = comm.bcast($(acquisition), root=0)

{{exec}}
`
		);

		this.pythonComponent.addVariable('acquisition');

		// setInterval(() => {
		// 	console.log(this.get);

		// });
	}
}
