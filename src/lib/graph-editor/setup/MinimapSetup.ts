import type { AreaPlugin } from 'rete-area-plugin';
import type { NodeEditor } from '$graph-editor/editor';
import type { AreaExtra } from '$graph-editor/area';
import type { Schemes } from '$graph-editor/schemes';
import { SetupClass, type SetupFunction } from './Setup';
import { MinimapPlugin } from 'rete-minimap-plugin';
import type { NodeFactory } from '$graph-editor/editor';

export class MinimapSetup extends SetupClass {
	private minimap = new MinimapPlugin<Schemes>();
	setup(editor: NodeEditor, area: AreaPlugin<Schemes, AreaExtra>, factory: NodeFactory): void {
		area.use(this.minimap);
	}
}

export const setupMinimap: SetupFunction = (params) => {
	console.log('Setting up minimap plugin');
	const area = params.area;
	if (!area) {
		console.warn("AreaPlugin is not defined, can't setup minimap plugin.");
		return params;
	}
	const minimap = new MinimapPlugin<Schemes>();
	area.use(minimap);
	return {
		...params,
		minimap
	}
}
