<script lang="ts">
	import { browser } from '$app/environment';
	import { moonMenuVisibleStore } from '$lib/menu/context-menu/moonContextMenu';
	export let target: HTMLElement;
	import BoxMarquee from '$lib/primitives/BoxMarquee.svelte';
	import type { Point } from '$lib/types/Point';
	import { createEventDispatcher, onDestroy } from 'svelte';

	const dispatch = createEventDispatcher<{
		selection: {
			upperLeft: Point;
			lowerRight: Point;
			pointerEvent: PointerEvent;
		};
		startselection: void;
	}>();

	let a: Point = { x: 50, y: 0 };
	let b: Point = { x: 0, y: 0 };
	let isSelecting = false;

	let clientX = 0;
	let clientY = 0;

	const onMove = (event: MouseEvent) => {
		clientX = event.clientX;
		clientY = event.clientY;
		const rect = target.getBoundingClientRect();

		if (isSelecting) {
			b = {
				x: clientX - rect.left,
				y: clientY - rect.top
			};
		}
	};

	export const onPointerDown = (event: PointerEvent) => {
		if (!isSelecting) return;

		if (event.button === 0) {
			isSelecting = false;
			const rect = target.getBoundingClientRect();
			dispatch('selection', {
				upperLeft: {
					x: upperLeft.x + rect.left,
					y: upperLeft.y + rect.top
				},
				lowerRight: {
					x: lowerRight.x + rect.left,
					y: lowerRight.y + rect.top
				},
				pointerEvent: event
			});
		}
	};

	const onKeyDown = (e: KeyboardEvent) => {
		if ($moonMenuVisibleStore) return;
		const ignoreElements = ['INPUT', 'TEXTAREA'];
		if (ignoreElements.includes(e.target?.tagName) || e.target.contentEditable === 'true') {
			return;
		}
		if (e.key.toLowerCase() !== 'b') return;
		dispatch('startselection');
		const rect = target.getBoundingClientRect();
		a = {
			x: clientX - rect.left,
			y: clientY - rect.top
		};
		b = a;
		isSelecting = true;
	};

	$: if (browser && target) {
		target.addEventListener('mousemove', onMove);
		target.addEventListener('pointerdown', onPointerDown);
		document.addEventListener('keydown', onKeyDown);
	}

	$: box?.addEventListener('pointerdown', onPointerDown);

	onDestroy(() => {
		if (browser && target) {
			target.removeEventListener('mousemove', onMove);
			target.removeEventListener('pointerdown', onPointerDown);
			document.removeEventListener('keydown', onKeyDown);
		}
	});
	let box: HTMLElement | undefined;
	let upperLeft: Point = { x: 0, y: 0 };
	let lowerRight: Point = { x: 0, y: 0 };
</script>

{#if isSelecting}
	<BoxMarquee {a} {b} bind:box bind:upperLeft bind:lowerRight />
{/if}
