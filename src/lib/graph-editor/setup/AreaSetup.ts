import type { NodeEditor, NodeFactory } from '$graph-editor/editor';
import type { AreaExtra } from '$graph-editor/area';
import type { Schemes } from '$graph-editor/schemes';
import type { Area2D, AreaPlugin } from 'rete-area-plugin';
import { Setup } from './Setup';
import type { Root } from 'rete';

export class AreaSetup extends Setup {
	private lastClicked: HTMLElement | null = null;
	setup(editor: NodeEditor, area: AreaPlugin<Schemes, AreaExtra>, factory: NodeFactory): void {
		area.addPipe((ctx) => {
			const ignored: (AreaExtra | Area2D<Schemes> | Root<Schemes>)['type'][] = [
				'unmount',
				'pointermove',
				'render',
				'rendered',
				'zoom',
				'zoomed',
				'translate',
				'translated'
			];
			if (ignored.includes(ctx.type)) {
				return ctx;
			}

			return ctx;
		});
	}
}
