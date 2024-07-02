import type { AreaPlugin } from 'rete-area-plugin';
import type { NodeEditor } from '../NodeEditor';
import { RenderSetup } from '../customization/render';
import type { AreaExtra } from '../node/AreaExtra';
import type { Schemes } from '../node/Schemes';
import { Setup } from './Setup';
import { MinimapSetup } from './MinimapSetup';
import type { NodeFactory } from '../node/NodeFactory';
import { ContextMenuSetup } from '../plugin/context-menu/context-menu';
import { AreaSetup } from './AreaSetup';
import { ConnectionSetup } from './ConnectionSetup';
import type { GeosDataContext } from '$lib/geos';
import type { NewGeosContext } from '$lib/global';

export class MegaSetup extends Setup {
	toSetup: Setup[] = [
		new ConnectionSetup(),
		new AreaSetup(),
		new RenderSetup(),
		new MinimapSetup(),
		new ContextMenuSetup()
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
