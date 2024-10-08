import type { AreaPlugin } from 'rete-area-plugin';
// import { RenderSetup } from '$graph-editor../customization/render';
import type { AreaExtra } from '$graph-editor/area';
import type { Schemes } from '$graph-editor/schemes';
import { SetupClass } from './Setup';
import { MinimapSetup } from './MinimapSetup';
import type { NodeEditor, NodeFactory } from '$graph-editor/editor';
// import { ContextMenuSetup } from '$graph-editor/plugins/context-menu';
import { AreaSetup } from './AreaSetup';
import { ConnectionSetup } from './ConnectionSetup';
import type { GeosDataContext } from '$lib/geos';
import type { NewGeosContext } from '$lib/global/todo.svelte';

export class MegaSetup extends SetupClass {
	toSetup: SetupClass[] = [
		new ConnectionSetup(),
		new AreaSetup(),
		// new RenderSetup(),
		new MinimapSetup()
		// new ContextMenuSetup()
	];

	setup(
		editor: NodeEditor,
		area: AreaPlugin<Schemes, AreaExtra>,
		factory: NodeFactory,
		geos: GeosDataContext,
		geosContextV2: NewGeosContext
	) {
		for (const setup of this.toSetup) {
			setup.setup(editor, area, factory, geos, geosContextV2);
		}
	}
}
