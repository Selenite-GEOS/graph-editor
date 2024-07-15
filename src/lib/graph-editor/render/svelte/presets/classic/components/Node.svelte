<script lang="ts">
	import type { Node, NodeConstructor } from '$graph-editor/nodes';
	import Ref from '$graph-editor/render/svelte/Ref.svelte';
	import type { SvelteArea2D } from 'rete-svelte-plugin';
	import type { Schemes } from '$graph-editor/schemes';
	import { themeControl } from '$lib/global/index.svelte';

	let { data: node, emit }: { data: Node; emit: (props: SvelteArea2D<Schemes>) => void } = $props();
	const constructor = $derived(node.constructor as NodeConstructor);
	let transitionEnabled = $state(false);

	// Avoid transitions on mount
	$effect(() => {
		setTimeout(() => {
			transitionEnabled = true;
		}, 50);
	});
	let displayProcessing = $state(false);
	let disappearProcessing = $state(false);
	let timeout: NodeJS.Timeout | null = null;
	let disappearTimeout: NodeJS.Timeout | null = null;
	$effect(() => {
		if (node.needsProcessing) {
			displayProcessing = true;
			disappearProcessing = false;
			if (timeout) clearTimeout(timeout);
			if (disappearTimeout) clearTimeout(disappearTimeout);
			disappearTimeout = setTimeout(() => {
				disappearProcessing = true;
			}, 200);
			timeout = setTimeout(() => {
				disappearProcessing = false;
				displayProcessing = false;
			}, 600);
		}
	});
</script>

<section
	role="cell"
	tabindex="0"
	class:transition-all={transitionEnabled}
	class:text-primary={node.needsProcessing}
	class="border-base-content border border-opacity-0 overflow-hidden bg-base-300 bg-opacity-85 rounded-box {themeControl.isLight
		? 'hover:brightness-105'
		: 'hover:brightness-[1.15]'}"
	style={transitionEnabled ? `max-width: ${node.width}px; max-height: ${node.height}px` : ''}
>
	<div
		class:disappear={disappearProcessing}
		class:animated-diagonal={displayProcessing}
		class="grid select-none p-4 cursor-pointer gap-2 grid-flow-row-dense w-fit"
		bind:clientWidth={node.width}
		bind:clientHeight={node.height}
	>
		<h1 class="card-title mb-3 col-span-fuaall text-nowrap" title={constructor.description}>
			{node.label}
		</h1>

		{#each node.sortedControls as [key, control] (key)}
			<Ref
				class="h-full !flex items-center justify-center control col-span-full"
				data-testid="control"
				init={(element) =>
					emit({
						type: 'render',
						data: {
							type: 'control',
							element,
							payload: control
						}
					})}
				unmount={(ref) => emit({ type: 'unmount', data: { element: ref } })}
			/>
		{/each}
		<form class="grid grid-flow-dense gap-2">
			{#each node.sortedInputs as [key, input], i (key)}
				<div
					class="text-md justify-items-start items-center grid grid-cols-subgrid col-start-1 col-span-2"
					data-testid={key}
				>
					<Ref
						data-testid="input-socket"
						init={(element) =>
							emit({
								type: 'render',
								data: {
									type: 'socket',
									side: 'input',
									key,
									nodeId: node.id,
									element,
									payload: input.socket
								}
							})}
						unmount={(ref) => emit({ type: 'unmount', data: { element: ref } })}
					/>
					{#if !input.control || !input.showControl}
						<div class="input-title" data-testid="input-title">
							{input.label || ''}{#if input.socket.isRequired}<span
									class="ps-0.5 text-lg"
									title="required">*</span
								>{/if}
						</div>
					{:else}
						<Ref
							class="h-full !flex items-center input-control"
							data-testid="input-control"
							init={(element) =>
								emit({
									type: 'render',
									data: {
										type: 'control',
										element,
										payload: input.control
									}
								})}
							unmount={(ref) => emit({ type: 'unmount', data: { element: ref } })}
						/>
					{/if}
				</div>
			{/each}
			{#each node.sortedOutputs as [key, output] (key)}
				<div
					class="text-md justify-items-end items-center grid grid-cols-subgrid col-start-3 col-span-2"
					data-testid={key}
				>
					{#if !output.control || !output.showControl}
						<div class="output-title" data-testid="output-title">
							{output.label || ''}{#if output.socket.isRequired}<span
									class="ps-0.5 text-lg"
									title="required">*</span
								>{/if}
						</div>
					{:else}
						<Ref
							class="h-full !flex items-center output-control"
							data-testid="output-control"
							init={(element) =>
								emit({
									type: 'render',
									data: {
										type: 'control',
										element,
										payload: output.control
									}
								})}
							unmount={(ref) => emit({ type: 'unmount', data: { element: ref } })}
						/>
					{/if}
					<Ref
						data-testid="output-socket"
						class="text-end"
						init={(element) =>
							emit({
								type: 'render',
								data: {
									type: 'socket',
									side: 'output',
									key,
									nodeId: node.id,
									element,
									payload: output.socket
								}
							})}
						unmount={(ref) => emit({ type: 'unmount', data: { element: ref } })}
					/>
				</div>
			{/each}
		</form>
	</div>
</section>

<!-- <div class="mt-[10rem]" onpointerdown={stopPropagation}>
	<OldNode data={node} {emit}/>
</div> -->

<style lang="scss">
	@property --o {
		syntax: '<number>'; /* <- defined as type number for the transition to work */
		initial-value: 0;
		inherits: false;
	}
	@keyframes slideDiagonal {
		from {
			background-position: 0% 0%;
			--o: 1;
		}
		to {
			background-position: 20rem 0%;
			--o: 1;
		}
	}
	@keyframes slideDiagonalDisappear {
		from {
			background-position: 6.67rem 0%;
			--o: 1;
		}
		to {
			background-position: 20rem 0%;
			--o: 0;
		}
	}

	.animated-diagonal {
		background-image: linear-gradient(
			-80deg,
			transparent 0%,
			transparent 25%,
			oklch(var(--b2) / var(--o)) 25%,
			oklch(var(--b2) / var(--o)) 66%,
			transparent 66%,
			transparent 100%
		);
		background-size: 5rem 100%;
		animation: slideDiagonal 0.6s linear infinite;
	}
	.animated-diagonal.disappear {
		animation-name: slideDiagonalDisappear;
		animation-duration: 0.4s;
	}
</style>
