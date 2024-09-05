<script lang="ts">
	import { clickIfNoDrag, posFromClient, preventDefault, Rect, Vector2D, WindowState } from '@selenite/commons';
	import { getEditorFromContext } from '../utils';
	import { ElementRect } from 'runed';
	import { fade } from 'svelte/transition';
	import { clientToSurfacePos } from '$utils/html';
	import { themeControl } from '$lib/global';

	interface Props {
		/** Minimap size in rem. */
		size?: number;
		/** View proprortion under which the view should be displayed. Defaults to 1. */
		displayViewThreshold?: number;
	}

	let { size: mapH = 12, displayViewThreshold = 1 }: Props = $props();

	const editorContext = getEditorFromContext();
	const editor = $derived(editorContext.editor);
	const factory = $derived(editorContext.factory);
	const areaRect = new ElementRect(() => factory?.area?.container);
	const nodes = $derived(editor?.nodes.filter(n => n.visible) ?? []);
	const rects = $derived(nodes.map((n) => n.rect));
	const nodesTotalRect = $derived(
		nodes.length === 0 ? undefined : Rect.union(nodes[0].rect, ...nodes.map((n) => n.rect).slice(1))
	);
	const totalSize = $derived(
		!nodesTotalRect ? undefined : Math.max(nodesTotalRect.width, nodesTotalRect.height)
	);
	const totalRect = $derived(!nodesTotalRect ? undefined : new Rect(nodesTotalRect.x, nodesTotalRect.y, totalSize, totalSize));
	

	const ratioRects = $derived.by(() => {
		if (totalRect === undefined || !nodesTotalRect) return [];

		let { x: baseX, y: baseY, width, height } = totalRect;
		const res: Rect[] = [];
		for (const { x, y, width: w, height: h } of rects) {
			res.push(new Rect((x - baseX - (nodesTotalRect.width - width) / 2) / width, (y - baseY - (nodesTotalRect.height - height) / 2) / height, w / width, h / height));
		}
		return res;
	});
	// Workaround with effect
	$effect(() => {
		ratioRects
	})
	let container = $state<HTMLElement>();
	const containerRect = new ElementRect(() => container);
	const finalRects = $derived.by(() => {
		const res: Rect[] = [];
		const { width, height } = containerRect;
		
		for (const { x, y, width: w, height: h } of ratioRects) {
			res.push(new Rect(x * width, y * height, w * width, h * height));
		}
		return res;
	});
	// const mapW = $derived((mapH * areaRect.width) / areaRect.height);
	const mapW = $derived(mapH)

	const a = $derived(
		!factory ? undefined : clientToSurfacePos({ pos: { x: areaRect.x, y: areaRect.y }, factory })
	);
	const b = $derived(
		!factory
			? undefined
			: clientToSurfacePos({ pos: { x: areaRect.right, y: areaRect.bottom }, factory })
	);
	const viewRect = $derived(!a || !b ? undefined : new Rect(a.x, a.y, b.x - a.x, b.y - a.y));
	const ratioViewRect = $derived.by(() => {
		if (!viewRect || !totalRect || !nodesTotalRect) return;
		
		const {x, y, width: w, height: h} = viewRect
		const {x: baseX, y: baseY, width, height} = totalRect;
		return new Rect((x - baseX - (nodesTotalRect.width - width) / 2) / width, (y - baseY - (nodesTotalRect.height - height) / 2) / height,  w / width,  h / height);
	});
	const finalViewRect = $derived.by(() => {
		if (!ratioViewRect) return;
		const {x, y, width: w, height: h} = ratioViewRect
		const { width, height } = containerRect;
		return new Rect(x * width, y * height, w * width, h * height)
	})

	const viewArea = $derived(Rect.area(finalViewRect ?? new Rect()))
	const containerArea = $derived(Rect.area(containerRect ?? new Rect()))
	const displayView = $derived(nodes.length > 0 && viewArea / containerArea < displayViewThreshold)
</script>

{#if editor?.factory?.minimapEnabled}
	<aside
		class:opacity-0={!displayView}
		class="transition-all duration-[800] { themeControl.isLight ?  'bg-base-200 bg-opacity-75' : 'bg-neutral bg-opacity-50'} pointer-events-auto  relative overflow-clip cursor-pointer rounded-box border-base-content border border-opacity-25"
		oncontextmenu={preventDefault}
		style="width: {mapW}rem; height: {mapH}rem;"
		transition:fade={{ duration: 200 }}
		use:clickIfNoDrag={{
			onclick: (e) => {
				if (!factory || !totalRect) return;
				console.log('move map');

				let pos = posFromClient(e);
				pos = Vector2D.subtract(pos, Rect.pos(containerRect));
				pos = {
					x: (pos.x * factory.surfaceRect.width) / containerRect.width,
					y: (pos.y * factory.surfaceRect.height) / containerRect.height
				};
				console.log(factory.surfaceRect.height);
				console.log('current', factory.area?.area.transform);
				// const newSurfacePos = clientToSurfacePos({pos: newPos, factory})
				// console.log(newPos, newSurfacePos)
				// factory.area?.area.translate(pos.x, pos.y)
			}
		}}
	>
		<div bind:this={container} class="absolute inset-4">
			{#each finalRects as { x, y, width, height }, i (i)}
				<div
					transition:fade={{ duration: 200 }}
					class="absolute {themeControl.isLight ? 'bg-base-content bg-opacity-30' : 'bg-neutral-content bg-opacity-50'} "
					style="width: {width}px; height:{height}px; left:{x}px; top: {y}px; border-radius: calc(var(--rounded-box) * {0.006 * height});"
				></div>
			{/each}
			{#if finalViewRect && displayView}
				{@const { width, height, x, y } = finalViewRect}
				<div
					transition:fade
					class="absolute border-accent border bg-accent {themeControl.isLight ? 'bg-opacity-25 border-opacity-50': 'bg-opacity-15 border-opacity-50'}"
					style="width: {width}px; height:{height}px; left:{x}px; top: {y}px;"
				></div>
			{/if}
		</div>
	</aside>
{/if}
