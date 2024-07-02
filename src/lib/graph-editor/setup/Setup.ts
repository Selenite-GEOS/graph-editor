import type { AreaPlugin } from 'rete-area-plugin';
import type { Schemes } from '$graph-editor/schemes';
import type { AreaExtra } from '$graph-editor/area';
import type { NodeEditor, NodeFactory } from '$graph-editor/editor';
import type { GeosDataContext } from '$lib/geos';
import type { NewGeosContext } from '$lib/global';

export abstract class Setup {
	abstract setup(
		editor: NodeEditor,
		area: AreaPlugin<Schemes, AreaExtra>,
		factory: NodeFactory,
		geos: GeosDataContext,
		geosContextV2: NewGeosContext
	): void;
}
