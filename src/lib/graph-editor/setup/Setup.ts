import type { AreaPlugin } from 'rete-area-plugin';
import type { Schemes } from '$graph-editor/schemes';
import type { AreaExtra } from '$graph-editor/area';
import type { NodeEditor, NodeFactory } from '$graph-editor/editor';
import type { GeosDataContext } from '$lib/geos';
import type { NewGeosContext } from '$lib/global';

export abstract class SetupClass {
	abstract setup(
		editor: NodeEditor,
		area: AreaPlugin<Schemes, AreaExtra>,
		factory: NodeFactory,
		geos: GeosDataContext,
		geosContextV2: NewGeosContext
	): void;
}

export type Setup = {
	name: string;
} & ({ setup: SetupFunction; type?: 'editor' } | { setup: SetupAreaFunction; type: 'area' });

export type SetupParams = {
	editor: NodeEditor;
	factory: NodeFactory;
	container?: HTMLElement;
	area?: AreaPlugin<Schemes, AreaExtra>;
};

export type SetupParamsWithArea = SetupParams & {
	area: AreaPlugin<Schemes, AreaExtra>;
};

export type SetupResult = {};

export type SetupFunction = (
	params: SetupParams
) => SetupParams | Promise<SetupParams> | void | Promise<void>;

export type SetupAreaFunction = (
	params: SetupParamsWithArea
) => SetupParamsWithArea | Promise<SetupParamsWithArea> | void | Promise<void>;

export function isSetup(o: unknown): o is Setup {
	return typeof o === 'object' && o !== null && 'name' in o && 'setup' in o;
}
