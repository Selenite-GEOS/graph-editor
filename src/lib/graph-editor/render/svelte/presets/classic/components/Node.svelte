<script lang="ts">
	import type { Node } from '$graph-editor/nodes';
	import { stopPropagation } from '@selenite/commons';
	import OldNode from './OldNode.svelte';
	import Ref from '$graph-editor/render/svelte/Ref.svelte';
	import type { SvelteArea2D } from 'rete-svelte-plugin';
	import type { Schemes } from '$graph-editor/schemes';

	let { data: node, emit }: { data: Node; emit: (props: SvelteArea2D<Schemes>) => void } = $props();
</script>

<section
	class="bg-base-300 grid grid-cols-2 select-none p-4 rounded-md cursor-pointer gap-2 "
	bind:clientWidth={node.width}
	bind:clientHeight={node.height}
>
	<h1 class="card-title mb-3 col-span-full">{node.label}</h1>

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

	{#each node.sortedInputs as [key, input] (key)}
		<div class="text-md items-center flex col-start-1" data-testid={key}>
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
			{/if}
			{#if input.control && input.showControl}
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
		<div class="text-md items-center flex col-start-2" data-testid={key}>
			<Ref
				data-testid="output-socket"
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
			{#if !output.control || !output.showControl}
				<div class="output-title" data-testid="output-title">
					{output.label || ''}{#if output.socket.isRequired}<span
							class="ps-0.5 text-lg"
							title="required">*</span
						>{/if}
				</div>
			{/if}
			{#if output.control && output.showControl}
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
		</div>
	{/each}
</section>

<!-- <div class="mt-[10rem]" onpointerdown={stopPropagation}>
	<OldNode data={node} {emit}/>
</div> -->
