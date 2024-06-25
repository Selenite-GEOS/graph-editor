import type { NodeFactory } from '$rete/node/NodeFactory';
import { SolverAPINode } from './SolverAPINode';

export class SolverLoopNode extends SolverAPINode {
	constructor({ factory }: { factory: NodeFactory }) {
		super({
			label: 'Solver Loop',
			factory,
			url: 'notImplemented',
			defaultOutExec: false,
			height: 290
		});
		this.addInData({
			name: 'outputVTK',
			displayName: 'Output VTK',
			socketLabel: 'Output VTK',
			type: 'boolean',
			control: {
				type: 'checkbox',
				options: {
					label: 'Output VTK',
					initial: true
				}
			}
		});
		this.addOutExec('loop', 'Loop');
		this.addOutExec('done', 'Done');
		this.setNaturalFlow('done');
		this.pythonComponent.addVariables('t', 'cycle');
		this.pythonComponent.setCodeTemplateGetter(({ inputs }) => {
			const outputVtk = this.getData<boolean>('outputVTK', inputs);

			return `
$(t) = 0
$(cycle) = 0
while $(t) < $(solver).maxTime:
    if $(cycle) % 100 == 0:
        if rank == 0:
            print(f"time = {t:.3f}s, dt = {$(solver).dt:.4f}, iter = {$(cycle)+1}")
        ${outputVtk ? '$(solver).outputVtk(t)' : ''}
    $(solver).execute(t)
    t += $(solver).dt
    $(cycle) += 1
    {{loop}}
{{done}}
`;
		});
	}
}
