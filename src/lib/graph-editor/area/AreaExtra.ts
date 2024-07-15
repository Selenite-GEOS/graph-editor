import type { MinimapExtra } from 'rete-minimap-plugin';
import type { Schemes } from '../schemes';
import type { SvelteArea2D } from 'rete-svelte-plugin';
import type { GridlineExtra } from '$graph-editor/plugins/viewport-addons';

export type AreaExtra = SvelteArea2D<Schemes> | MinimapExtra | GridlineExtra;
