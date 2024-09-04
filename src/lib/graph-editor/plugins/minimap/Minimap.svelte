<script lang="ts">
	import { clickIfNoDrag, posFromClient, preventDefault, Rect, Vector2D, WindowState } from '@selenite/commons';
	import { getEditorFromContext } from '../utils';
	import { ElementRect } from 'runed';
	import { fade } from 'svelte/transition';
	import { clientToSurfacePos } from '$utils/html';

	interface Props {
		/** Minimap height in rem. */
		height?: number;
	}

	let { height: mapH = 20 }: Props = $props();

	const editorContext = getEditorFromContext();
	const editor = $derived(editorContext.editor);
	const factory = $derived(editorContext.factory);
	const areaRect = new ElementRect(() => factory?.area?.container);
	const nodes = $derived(editor?.nodes ?? []);
	const rects = $derived(nodes.map((n) => n.rect));
	const totalRect = $derived(
		nodes.length === 0 ? undefined : Rect.union(nodes[0].rect, ...nodes.map((n) => n.rect).slice(1))
	);
	$effect(() => {
		if (totalRect === undefined) return;

		let { x: baseX, y: baseY, width, height } = totalRect;
		const res: Rect[] = [];
		for (const { x, y, width: w, height: h } of rects) {
			res.push(new Rect((x - baseX) / width, (y - baseY) / height, w / width, h / height));
		}
		console.log("update")
	})

	const ratioRects = $derived.by(() => {
		if (totalRect === undefined) return [];

		let { x: baseX, y: baseY, width, height } = totalRect;
		const res: Rect[] = [];
		for (const { x, y, width: w, height: h } of rects) {
			res.push(new Rect((x - baseX) / width, (y - baseY) / height, w / width, h / height));
		}
		return res;
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
	const mapW = $derived((mapH * areaRect.width) / areaRect.height);

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
		if (!viewRect || !totalRect) return;
		
		const {x, y, width: w, height: h} = viewRect
		const {x: baseX, y: baseY, width, height} = totalRect;
		return new Rect((x - baseX) / width, (y - baseY) / height,  w / width,  h / height);
	});
	const finalViewRect = $derived.by(() => {
		if (!ratioViewRect) return;
		const {x, y, width: w, height: h} = ratioViewRect
		const { width, height } = containerRect;
		return new Rect(x * width, y * height, w * width, h * height)
	})

	const viewArea = $derived(Rect.area(finalViewRect ?? new Rect()))
	const containerArea = $derived(Rect.area(containerRect ?? new Rect()))
	const displayView = $derived(viewArea / containerArea < 1)
	// const ratioedSurfaceRect = $derived.by(() => {
	// 	const { x, y, width, height } = surfaceRect;
	// 	const { width: w, height: h } = containerRect;
	// 	return new Rect(x / w, y / h, width / w, height / h);
	// });
	// const finalSurfaceRect = $derived.by(() => {
	// 	const { width, height } = containerRect;
	// 	const { x, y, width: w, height: h } = ratioedSurfaceRect;
	// 	return new Rect(x * width, y * height, w * width, h * height);
	// });
</script>

{#if editor?.factory?.minimapEnabled}
	<aside
		class="bg-neutral pointer-events-auto bg-opacity-25 relative overflow-clip cursor-pointer"
		oncontextmenu={preventDefault}
		style="width: {mapW}rem; height: {mapH}rem;"
		transition:fade={{ duration: 200 }}
		use:clickIfNoDrag={{onclick: (e) => {
			if (!factory || !totalRect) return;
			console.log("move map")
			
			let pos = posFromClient(e)
			pos = Vector2D.subtract(pos, Rect.pos(containerRect))
			pos = {
				x: pos.x * factory.surfaceRect.width / containerRect.width,
				y: pos.y * factory.surfaceRect.height / containerRect.height
			}
			console.log(factory.surfaceRect.height)
			console.log("current", factory.area?.area.transform)
			// const newSurfacePos = clientToSurfacePos({pos: newPos, factory})
			// console.log(newPos, newSurfacePos)
			// factory.area?.area.translate(pos.x, pos.y)
		}}}
	>
		<div bind:this={container} class="absolute inset-4 ">
			{#each finalRects as { x, y, width, height }, i (i)}
				<div
					transition:fade={{ duration: 200 }}
					class="absolute bg-base-300 bg-opacity-75"
					style="width: {width}px; height:{height}px; left:{x}px; top: {y}px;"
				></div>
			{/each}
			{#if finalViewRect && displayView}
				{@const { width, height, x, y } = finalViewRect}
				<div
					transition:fade
					class="absolute border-accent border bg-accent bg-opacity-15"
					style="width: {width}px; height:{height}px; left:{x}px; top: {y}px;"
				></div>
			{/if}
		</div>
	</aside>
{/if}
