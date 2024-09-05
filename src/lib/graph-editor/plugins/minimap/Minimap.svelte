<script lang="ts">
	import {
		distance,
		PointerDownWatcher,
		posFromClient,
		preventDefault,
		Rect,
		Vector2D	} from '@selenite/commons';
	import { getEditorFromContext } from '../utils';
	import { ElementRect } from 'runed';
	import { fade } from 'svelte/transition';
	import { clientToSurfacePos } from '$utils/html';
	import { themeControl } from '$lib/global';
	import { Zoom } from 'rete-area-plugin';
	import { tweened } from 'svelte/motion';

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
	const nodes = $derived(editor?.nodes.filter((n) => n.visible) ?? []);
	const rects = $derived(nodes.map((n) => n.rect));
	const nodesTotalRect = $derived(
		nodes.length === 0 ? undefined : Rect.union(nodes[0].rect, ...nodes.map((n) => n.rect).slice(1))
	);
	const totalSize = $derived(
		!nodesTotalRect ? undefined : Math.max(nodesTotalRect.width, nodesTotalRect.height)
	);
	const totalRect = $derived(
		!nodesTotalRect ? undefined : new Rect(nodesTotalRect.x, nodesTotalRect.y, totalSize, totalSize)
	);

	const ratioRects = $derived.by(() => {
		if (totalRect === undefined || !nodesTotalRect) return [];

		let { x: baseX, y: baseY, width, height } = totalRect;
		const res: Rect[] = [];
		for (const { x, y, width: w, height: h } of rects) {
			res.push(
				new Rect(
					(x - baseX - (nodesTotalRect.width - width) / 2) / width,
					(y - baseY - (nodesTotalRect.height - height) / 2) / height,
					w / width,
					h / height
				)
			);
		}
		return res;
	});
	// Workaround with effect
	$effect(() => {
		ratioRects;
	});
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
	const mapW = $derived(mapH);

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

		const { x, y, width: w, height: h } = viewRect;
		const { x: baseX, y: baseY, width, height } = totalRect;
		return new Rect(
			(x - baseX - (nodesTotalRect.width - width) / 2) / width,
			(y - baseY - (nodesTotalRect.height - height) / 2) / height,
			w / width,
			h / height
		);
	});
	const finalViewRect = $derived.by(() => {
		if (!ratioViewRect) return;
		const { x, y, width: w, height: h } = ratioViewRect;
		const { width, height } = containerRect;
		return new Rect(x * width, y * height, w * width, h * height);
	});

	const viewArea = $derived(Rect.area(finalViewRect ?? new Rect()));
	const containerArea = $derived(Rect.area(containerRect ?? new Rect()));
	const displayView = $derived(nodes.length > 0 && viewArea / containerArea < displayViewThreshold);

	function moveArea(e: { clientX: number; clientY: number }) {
		const area = factory?.area;
		if (!factory || !totalRect || !ratioViewRect || !area) return;

		let pos = posFromClient(e);
		pos = Vector2D.subtract(pos, Rect.pos(containerRect));

		pos = {
			x: pos.x / containerRect.width,
			y: pos.y / containerRect.height
		};
		const { x: vX, y: vY, width: vW, height: vH } = ratioViewRect;
		const vCenter = {
			x: vX + vW / 2,
			y: vY + vH / 2
		};
		let offset = Vector2D.subtract(pos, vCenter);
		const current = area.area.transform;
		offset = {
			x: -offset.x * totalRect.width * current.k,
			y: -offset.y * totalRect.height * current.k
		};

		const newPos = Vector2D.add(current, offset);

		if (!useViewTarget) area.area.translate(newPos.x, newPos.y);
		$viewTarget = newPos;
	}
	// View movement smoothing
	const viewSmoothingDuration = 100;
	let viewTarget = $state(tweened({ x: 0, y: 0 }, { duration: viewSmoothingDuration }));
	let useViewTarget = $state(false);
	$effect(() => {
		if (useViewTarget) factory?.area?.area.translate($viewTarget.x, $viewTarget.y);
	});
</script>

{#if editor?.factory?.minimapEnabled}
	<aside
		class:opacity-0={!displayView}
		class:pointer-events-none={!displayView}
		class:pointer-events-auto={displayView}
		onwheel={(e) => {
			const area = factory?.area;
			if (!area) return;
			// @ts-expect-error Access protected field
			const zoomHandler: Zoom = area.area.zoomHandler;
			// @ts-expect-error Access protected field
			zoomHandler.wheel(e);
		}}
		onpointermove={(e) => {
			if (!PointerDownWatcher.instance.isPointerDown) return;
			const pDownE = PointerDownWatcher.instance.lastEvent!;
			if (!(pDownE.target instanceof HTMLElement) || !pDownE.target?.closest('.minimap')) {
				return;
			}
			const pDownPos = PointerDownWatcher.instance.pos!;
			const pos = posFromClient(e);
			if (!useViewTarget && distance(pos, pDownPos) > 5) {
				const current = factory?.area?.area.transform;
				viewTarget = tweened({x: current?.x ?? 0, y: current?.y ?? 0}, {duration: viewSmoothingDuration});
				useViewTarget = true;
			}
			moveArea(e);
		}}
		class="minimap transition-all duration-[800] {themeControl.isLight
			? 'bg-base-200 bg-opacity-75'
			: 'bg-neutral bg-opacity-50'} relative overflow-clip cursor-pointer rounded-box border-base-content border border-opacity-25"
		oncontextmenu={preventDefault}
		style="width: {mapW}rem; height: {mapH}rem;"
		transition:fade={{ duration: 200 }}
		onpointerdown={(e) => {
			useViewTarget = false;
			moveArea(e);
		}}
	>
		<div bind:this={container} class="absolute inset-4">
			{#each finalRects as { x, y, width, height }, i (i)}
				<div
					transition:fade={{ duration: 200 }}
					class="absolute {themeControl.isLight
						? 'bg-base-content bg-opacity-30'
						: 'bg-neutral-content bg-opacity-50'} "
					style="width: {width}px; height:{height}px; left:{x}px; top: {y}px; border-radius: calc(var(--rounded-box) * {0.006 *
						height});"
				></div>
			{/each}
			{#if finalViewRect && displayView}
				{@const { width, height, x, y } = finalViewRect}
				<div
					transition:fade
					class="absolute border bg-accent {themeControl.isLight
						? 'bg-opacity-25 border-opacity-10 border-base-content'
						: ' border-accent bg-opacity-15 border-opacity-50'}"
					style="width: {width}px; height:{height}px; left:{x}px; top: {y}px;"
				></div>
			{/if}
		</div>
	</aside>
{/if}
