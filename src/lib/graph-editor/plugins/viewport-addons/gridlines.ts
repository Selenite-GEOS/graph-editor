import type { Setup } from '$graph-editor/setup/Setup';
import { themeControl } from '$lib/global/index.svelte';
import {gridLines} from '@selenite/commons'

export type GridlineExtra = {type: 'gridline-toggle-visibility'} | {type: 'gridline-update'}

export const gridLinesSetup: Setup = {
	name: 'Gridlines',
	setup: ({ area }) => {
		const { container } = area;
		let visibility = true;
		const canvas = document.createElement('canvas');
		container.insertBefore(canvas, container.firstChild);
		canvas.style.position = 'absolute';
		canvas.width = container.clientWidth;
		canvas.height = container.clientHeight;
		const gridlines = gridLines(canvas, {transform: area.area.transform, visibility });

		area.addPipe((ctx) => {
			if (!(['translated', 'zoomed', 'resized', 'gridline-toggle-visibility', 'gridline-update'] as (typeof ctx)['type'][]).includes(ctx.type)) {
				return ctx;
			}
			if (ctx.type === 'gridline-toggle-visibility')
				visibility = !visibility
			themeControl.isLight
			if (ctx.type === 'resized') {
				canvas.width = area.container.clientWidth;
				canvas.height = area.container.clientHeight;
			}


			if (gridlines && gridlines.update)
				gridlines.update({
					transform: area.area.transform,
					visibility,
					color: themeControl.isLight ? '#000' : '#ddd',
					// width: themeControl.isLight ? '' :
				});

			return ctx;
		});
	},
	type: 'area'
};
