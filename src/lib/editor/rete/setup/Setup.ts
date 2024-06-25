import type { AreaPlugin } from 'rete-area-plugin';
import type { NodeEditor } from '../NodeEditor';
import type { Schemes } from '../node/Schemes';
import type { AreaExtra } from '../node/AreaExtra';
import type { NodeFactory } from '../node/NodeFactory';
import type { GeosDataContext } from '$lib/geos';
import type { NewGeosContext } from '$lib/global';

export abstract class Setup {
	abstract setup(
		editor: NodeEditor,
		area: AreaPlugin<Schemes, AreaExtra> | undefined,
		factory: NodeFactory,
		geos: GeosDataContext,
		geosContextV2: NewGeosContext
	): void;
}
