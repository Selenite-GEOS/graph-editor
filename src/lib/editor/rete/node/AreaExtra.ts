import type { ContextMenuExtra } from 'rete-context-menu-plugin';
import type { MinimapExtra } from 'rete-minimap-plugin';
import type { Schemes } from './Schemes';
import type { SvelteArea2D } from 'rete-svelte-plugin';

export type AreaExtra = SvelteArea2D<Schemes> | ContextMenuExtra | MinimapExtra;
