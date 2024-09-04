<script lang="ts">
	class Rect {
		x = 0;
		y = 0;
		width = 0;
		height = 0;

		constructor(x = 0, y = 0, width = 0, height = 0) {
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;
		}

		get right() {
			return this.x + this.width;
		}

		get bottom() {
			return this.y + this.height;
		}
	}
	type Position = {
		x: number;
		y: number;
	};

	class Node {
			pos = $state({ x: 0, y: 0 });
	#width = $state(100);
	#height = $state(50);
	rect = $derived(new Rect(this.pos.x, this.pos.y, this.#width, this.#height))

		set width(w) {
			this.#width = w;
		}
		get width() {
			return this.#width;
		}
		set height(h) {
			this.#height = h;
		}
		get height() {
			return this.#height;
		}

		constructor({x = 0, y = 0, h = 100 ,w = 100} = {}) {
			this.pos.x = x
			this.pos.y = y
			this.#height = h
			this.#width = w
		}
	}

	/**
	 * Return the union of multiple bounding rectangles.
	 */
	export function union(rect: Rect, ...rects: Rect[]): Rect {
		const res: Rect = new Rect();
		res.x = rect.x;
		res.y = rect.y;
		res.width = rect.width;
		res.height = rect.height;

		for (const r of rects) {
			const a: Position = { x: Math.min(res.x, r.x), y: Math.min(res.y, r.y) };
			const b: Position = { x: Math.max(res.right, r.right), y: Math.max(res.bottom, r.bottom) };

			res.x = a.x;
			res.y = a.y;
			res.width = b.x - a.x;
			res.height = b.y - a.y;
		}
		return res;
	}

	interface Props {
		/** Minimap height in rem. */
		height?: number;
	}

	let { height: mapH = 20 }: Props = $props();

	const nodes = $state([new Node({x: -100, y: -100}), new Node({x: 200, h : 25, y: 20})])
	// $inspect(nodes[0]?.rect.x);
	const rects = $derived(nodes.map((n) => n.rect));
	$inspect("rects", rects);
	const totalRect = $derived(rects.length === 0 ? undefined : union(rects[0], ...rects.slice(1)));
	// $inspect('totalRect', totalRect);

	const ratioRects = $derived.by(() => {
		if (totalRect === undefined) return [];

		let { x: baseX, y: baseY, width, height } = totalRect;
		const res: Rect[] = [];
		for (const { x, y, width: w, height: h } of rects) {
			res.push(new Rect((x - baseX) / width, (y - baseY) / height, w / width, h / height));
		}
		return res;
	});

	$inspect("ratio", ratioRects);
	let container = $state<HTMLElement>();
	const containerRect = $derived(container?.getBoundingClientRect() ?? new Rect());
	const finalRects = $derived.by(() => {
		const res: Rect[] = [];
		const { width, height } = containerRect;

		for (const { x, y, width: w, height: h } of ratioRects) {
			res.push(new Rect(x * width, y * height, w * width, h * height));
		}
		return res;
	});
	const mapW = $derived(mapH);

	$inspect("final", finalRects);
</script>

<button onclick={() => nodes.push(new Node())}> Add node </button>
<h3>Rects</h3>

{#each rects as _, i (i)}
	<h4>Rect {i}</h4>
	x
	<input type="number" bind:value={nodes[i].pos.x} step="10"/>
	y
	<input type="number" bind:value={nodes[i].pos.y} step="10"/>
	w
	<input type="number" bind:value={nodes[i].width} step="10"/>
	h
	<input type="number" bind:value={nodes[i].height} step="10"/>
{/each}

<h3>Result</h3>
<aside
	style="width: {mapW}rem; height: {mapH}rem;"
>
	<div bind:this={container}>
		{#each finalRects as { x, y, width, height }, i (i)}
			<div
				class="node"
				style="width: {width}px; height:{height}px; left:{x}px; top: {y}px;"
			></div>
		{/each}
	</div>
</aside>

<style>
	/* input {
			display: block;
		} */
	button {
		background-color: black;
		border-color: black;
		padding: 0.5rem;
		margin: 0.5rem 0rem;
	}
	aside {
		background-color: grey;
		position: relative;
	}
	aside div {
		inset: 1rem;
		position: absolute;
		background-color: hsl(0 0% 25%);
	}
	.node {
		background-color: hsl(0 20% 30%);
		position: absolute;
	}
</style>
