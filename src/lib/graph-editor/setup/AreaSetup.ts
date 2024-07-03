import type { NodeEditor, NodeFactory } from '$graph-editor/editor';
import type { AreaExtra } from '$graph-editor/area';
import type { Schemes } from '$graph-editor/schemes';
import { AreaPlugin, type Area2D } from 'rete-area-plugin';
import { SetupClass, type SetupFunction } from './Setup';
import type { Root } from 'rete';

export class AreaSetup extends SetupClass {
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

export const setupArea: SetupFunction = (params) => {
	console.log("Setting up area plugin");
	const {factory} = params;
	const container = params.container;
	if (!container) {
		console.warn("Container is not defined, can't setup area plugin.");
		return params;
	}
	const area = new AreaPlugin<Schemes, AreaExtra>(container);
	factory.area = area;
	params.editor.use(area);
	return {
		...params,
		area
	}

}