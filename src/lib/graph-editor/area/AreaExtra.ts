import type { MinimapExtra } from 'rete-minimap-plugin';
import type { Schemes } from '../schemes';
import type { SvelteArea2D } from 'rete-svelte-plugin';

export type AreaExtra = SvelteArea2D<Schemes> | MinimapExtra;
