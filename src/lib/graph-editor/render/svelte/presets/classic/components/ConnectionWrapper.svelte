<script lang="ts">
	import type { Position } from '$graph-editor/common';
	import type { Schemes } from '$graph-editor/schemes';
	import { type Component, onMount } from 'svelte';
	type PositionWatcher = (cb: (value: Position) => void) => () => void;

	type Props = {
		component: Component;
		data: Schemes['Connection'] & { isLoop?: boolean };
		start: Position | PositionWatcher;
		end: Position | PositionWatcher;
		path: (start: Position, end: Position) => Promise<string>;
	};
	let { component, data, start, end, path }: Props = $props();
	const conn = $derived(data);
	const factory = $derived(conn.factory);

	const source = $derived(factory?.getNode(conn.source)?.outputs[conn.sourceOutput]);
	// const targetType = $derived(factory?.getNode(conn.target)?.inputs[conn.targetInput]?.socket.type)

	// const connType = $derived(sourceType)

	let observedStart = $state({ x: 0, y: 0 });
	let observedEnd = $state({ x: 0, y: 0 });
	let observedPath = $state('');

	const startPosition = $derived(start && 'x' in start ? start : observedStart);
	const endPosition = $derived(end && 'x' in end ? end : observedEnd);

	$effect(() => {
		startPosition;
		endPosition;
		fetchPath(startPosition, endPosition);
	});

	async function fetchPath(start: Position, end: Position) {
		observedPath = await path(start, end);
	}

	onMount(() => {
		const unwatch1 = typeof start === 'function' && start((pos) => (observedStart = pos));

		const unwatch2 = typeof end === 'function' && end((pos) => (observedEnd = pos));

		return () => {
			unwatch1 && unwatch1();
			unwatch2 && unwatch2();
		};
	});
</script>

<!-- svelte-ignore svelte_component_deprecated -->
<svelte:component
	this={component}
	{...data}
	{source}
	start={observedStart}
	end={observedEnd}
	path={observedPath}
/>
