<script lang="ts">
	import type { Node, NodeConstructor } from '$graph-editor/nodes';
	import Ref from '$graph-editor/render/svelte/Ref.svelte';
	import type { SvelteArea2D } from 'rete-svelte-plugin';
	import type { Schemes } from '$graph-editor/schemes';
	import {
		capitalize,
		clickIfNoDrag,
		distance,
		posFromClient,
		shortcut,
		stopPropagation
	} from '@selenite/commons';
	import { XmlNode } from '$graph-editor/nodes/XML';
	import type { Position } from '$graph-editor/common';
	import { Control } from '$graph-editor/socket';
	import { variant } from '$utils';
	import {
		flip,
		offset,
		useFloating,
		useInteractions,
		useRole
	} from '@skeletonlabs/floating-ui-svelte';
	import { fade } from 'svelte/transition';
	import {
		faAlignCenter,
		faAlignLeft,
		faAlignRight,
		faArrowsLeftRight,
		faArrowsUpToLine
	} from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';

	let { data: node, emit }: { data: Node; emit: (props: SvelteArea2D<Schemes>) => void } = $props();
	const constructor = $derived(node.constructor as NodeConstructor);
	let transitionEnabled = $state(false);

	const xmlNode = $derived(node instanceof XmlNode ? node : undefined);
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

	let hovered = $state(false);
	// Display picked and selected nodes on top
	$effect(() => {
		const parent = (floating.elements.reference as HTMLElement | undefined | null)?.parentElement;
		if (!parent) return;
		parent.style.zIndex = String(hovered ? 20 : node.picked ? 15 : node.selected ? 10 : 5);
	});
	const zoomThreshold = 0.5;
	// Add hide names pipe
	$effect(() => {
		if (!node.factory || !node.area) return;
		const hideLabelPipeSetup = node.factory.useState('node', 'area-hide-labels-pipe', false);
		if (hideLabelPipeSetup.value) return;
		untrack(() => {
			hideLabelPipeSetup.value = true;
		});
		console.log('Adding hide label pipe');
		node.area.addPipe((ctx) => {
			if (ctx.type === 'zoomed') {
				if (ctx.data.zoom > zoomThreshold) {
					node.area?.container.classList.add('hideFloatingLabel');
				} else {
					node.area?.container.classList.remove('hideFloatingLabel');
				}
			}
			return ctx;
		});
	});

	let editingName = $state(false);
	let nameInput = $state<HTMLInputElement>();
	$effect(() => {
		nameInput?.select();
	});
	let lastPointerDownPos = $state<Position>();

	const floating = useFloating({
		open: node.picked,
		middleware: [flip(), offset({ mainAxis: 10 })],
		placement: 'top'
	});
	const role = useRole(floating.context);
	const interactions = useInteractions([role]);
	node.area?.addPipe((ctx) => {
		if (
			ctx.type === 'translated' ||
			ctx.type === 'zoomed' ||
			(ctx.type === 'nodetranslated' && ctx.data.id === node.id)
		) {
			if (node.picked) floating.update();
			// if (node.factory && node.factory.transform.zoom < zoomThreshold)
			// 	update();
		}
		return ctx;
	});
	const showNamePopup = $derived(node.name || xmlNode);
	import { createFloatingActions } from 'svelte-floating-ui';
	import * as dom from 'svelte-floating-ui/dom';
	import Portal from 'svelte-portal';
	import { untrack } from 'svelte';
	const [floatingRef, floatingContent] = createFloatingActions({
		middleware: [dom.offset(7.5)],
		placement: 'top',
		autoUpdate: {
			animationFrame: true
		}
	});
	const nodeElmnt = $derived(floating.elements.reference instanceof HTMLElement ? floating.elements.reference : undefined);
</script>

{#snippet controlSnippet(control: Control, { class: classes }: { class?: string })}
	<Ref
		class={classes}
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
{/snippet}

<!-- Small zoom name popup-->
{#if showNamePopup && node.visible}
	<Portal target={node.area?.container}>
		<!-- svelte-ignore event_directive_deprecated -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<button
			use:floatingContent
			class="floatingLabel bg-neutral text-neutral-content hover:z-20 select-none p-[0.4rem] rounded-[0.5rem]"
			on:dblclick={(e) => {
				stopPropagation(e);
			}}
			use:clickIfNoDrag={{
				onclick: (e) => {
					node.factory?.centerView([node]);
					nodeElmnt?.focus();
				}
			}}
		>
			{node.name ?? node.label}
		</button>
	</Portal>
{/if}

<!-- Node Toolbar popup -->
{#if node.picked}
	<!-- svelte-ignore event_directive_deprecated -->
	<div
		class="grid w-max absolute top-0 left-0 z-10 bg-base-200 bg-opacity-100 p-2 rounded-sm select-none pointer-events-none"
		on:pointerdown={stopPropagation}
		style={floating.floatingStyles}
		{...interactions.getFloatingProps()}
		transition:fade={{ duration: 175 }}
		bind:this={floating.elements.floating}
	>
		<button
			title="Align top"
			type="button"
			class="btn btn-ghost btn-sm pointer-events-auto"
			on:click={() => node.factory?.layout.alignTop()}
		>
			<Fa icon={faArrowsUpToLine} rotate="0" />
		</button>
		<button
			title="Align middle"
			type="button"
			class="btn btn-ghost btn-sm pointer-events-auto"
			on:click={() => node.factory?.layout.alignMiddle()}
		>
			<Fa icon={faAlignCenter} rotate={90} />
		</button>
		<button
			title="Align bottom"
			type="button"
			class="btn btn-ghost btn-sm pointer-events-auto"
			on:click={() => node.factory?.layout.alignBottom()}
		>
			<Fa icon={faArrowsUpToLine} rotate={180} />
		</button>
		<button
			title="Space even vertical"
			type="button"
			class=" btn btn-ghost btn-sm pointer-events-auto"
			on:click={() => node.factory?.layout.spaceVertical()}
		>
			<Fa icon={faArrowsLeftRight} rotate={90} />
		</button>
		<!-- svelte-ignore event_directive_deprecated -->
		<button
			title="Align left"
			type="button"
			class="row-start-2 btn btn-ghost btn-sm pointer-events-auto"
			on:click={() => node.factory?.layout.justifyLeft()}
		>
			<Fa icon={faAlignLeft} />
		</button>
		<button
			title="Center"
			type="button"
			class="row-start-2 btn btn-ghost btn-sm pointer-events-auto"
			on:click={() => node.factory?.layout.justifyCenter()}
		>
			<Fa icon={faAlignCenter} />
		</button>
		<button
			title="Align right"
			type="button"
			class="row-start-2 btn btn-ghost btn-sm pointer-events-auto"
			on:click={() => node.factory?.layout.justifyRight()}
		>
			<Fa icon={faAlignRight} />
		</button>
		<button
			title="Space even horizontal"
			type="button"
			class="row-start-2 btn btn-ghost btn-sm pointer-events-auto"
			on:click={() => node.factory?.layout.justifyBetween()}
		>
			<Fa icon={faArrowsLeftRight} />
		</button>
	</div>
{/if}

<!-- svelte-ignore event_directive_deprecated -->
<section
	role="cell"
	tabindex="0"
	title={node.description ?? constructor.description}
	{...interactions.getReferenceProps()}
	bind:this={floating.elements.reference}
	use:floatingRef
	class:text-primary={node.needsProcessing}
	class:transition-all={transitionEnabled}
	class:opacity-0={!node.visible}
	class={`relative border-base-200 group border border-opacity-0 overflow-hidden bg-opacity-85 rounded-box focus-visible:outline-none
	${node.picked ? variant('primary') : node.selected ? variant('secondary') : variant('base-300') + ' focus-within:bg-base-200 focus-within:border-base-300 hover:border-base-300 hover:bg-base-200 dhover:bg-opacity-85'}
	${node.previewed ? 'previewed' : ''}
	`}
	style={`max-width: ${node.width}px; max-height: ${node.height}px;  ${
		transitionEnabled
			? `transition-property: max-width, color, background-color, border-color, text-decoration-color, fill, stroke`
			: ''
	}`}
	on:pointerenter={() => (hovered = true)}
	on:pointerleave={() => (hovered = false)}
	on:dblclick={(e) => {
		stopPropagation(e);
		node.factory?.centerView([node]);
		node.factory?.selector.unselect(node);
		if (node.factory?.selector.accumulating) {
			stopPropagation(e);
		}
	}}
	use:clickIfNoDrag={{
		onclick(e) {
			if (e.button !== 0) return;
			node.factory?.select(node);
		}
	}}
	on:keydown={(e) => {
		if (!nameInput && e.key === 'Enter') {
			node.factory?.select(node);
		}
	}}
>
	<div
		class:disappear={disappearProcessing}
		class:animated-diagonal={displayProcessing}
		class="grid select-none p-4 cursor-pointer gap-2 grid-flow-row-dense w-fit"
		class:min-w-[13.65rem]={xmlNode}
		bind:clientWidth={node.width}
		bind:clientHeight={node.height}
	>
		{#if node.label && node.label !== ''}
			<header class="grid">
				{#if node.name || editingName}
					<h2 class="text-sm mb-1 col-start-1">
						{node.label}
					</h2>
				{/if}
				<h1 class="relative card-title mb-3 col-span-fuaall text-nowrap col-start-1">
					<!-- svelte-ignore event_directive_deprecated -->
					<button
						type="button"
						class="cursor-text pe-2"
						use:shortcut={{
							ctrl: true,
							repeats: false,
							action(btn) {
								btn.classList.remove('cursor-text');
							},
							endAction(btn) {
								btn.classList.add('cursor-text');
							}
						}}
						on:click={(e) => {
							if (e.ctrlKey || e.altKey || e.shiftKey) return;
							if (lastPointerDownPos) {
								const pos = posFromClient(e);
								const dist = distance(lastPointerDownPos, pos);
								console.debug('Dragged distance', dist);
								if (dist > 2) return;
							}
							editingName = true;
							node.factory?.unselectAll();
						}}
						on:pointerdown={(e) => {
							lastPointerDownPos = posFromClient(e);
						}}
					>
						{node.name ?? node.label}
					</button>
					{#if editingName}
						<!-- svelte-ignore event_directive_deprecated -->
						<input
							bind:this={nameInput}
							class="absolute input inset-0 text-base-content"
							on:blur={() => {
								if (!nameInput || !editingName) return;
								node.name = nameInput.value;
								editingName = false;
								lastPointerDownPos = undefined;
							}}
							on:dblclick={stopPropagation}
							on:pointerdown={stopPropagation}
							value={node.name}
							use:shortcut={{
								key: 'enter',
								ignoreElements: [],
								action() {
									node.name = nameInput!.value;
									editingName = false;
									editingName = false;
								}
							}}
							use:shortcut={{
								key: 'escape',
								ignoreElements: [],
								action() {
									editingName = false;
								}
							}}
						/>
					{/if}
				</h1>
				<aside class="col-start-2 row-span-full ms-4 max-h-0">
					{#each node.sortedControls as [k, control]}
						{#if control.placeInHeader}
							{@render controlSnippet(control, {})}
						{/if}
					{/each}
				</aside>
			</header>
		{/if}

		{#each node.sortedControls as [key, control] (key)}
			{#if !control.placeInHeader}
				{@render controlSnippet(control, {
					class: 'h-full !flex items-center justify-center control col-span-full'
				})}
			{/if}
		{/each}
		<form class="grid grid-flow-dense gap-2">
			{#each node.sortedInputs as [key, input], i (key)}
				<div
					class="text-md justify-items-start items-center flex gap-2 grid-rows-subgrid col-start-1"
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
					<div title={input.description}>
						{#if !input.control || !input.showControl || input.alwaysShowLabel === true}
							<div
								class="input-title {input.control && input.showControl ? 'ms-0 mb-1' : ''}"
								data-testid="input-title"
							>
								{capitalize(input.label || '')}{#if input.socket.isRequired}<span
										class="ps-0.5 text-lg"
										title="required">*</span
									>{/if}
							</div>
						{/if}

						{#if input.control && input.showControl}
							<Ref
								class="h-full !flex items-center input-control mr-2"
								data-testid="input-control"
								init={(element) =>
									emit({
										type: 'render',
										data: {
											type: 'control',
											element,
											payload: input.control!
										}
									})}
								unmount={(ref) => emit({ type: 'unmount', data: { element: ref } })}
							/>
						{/if}
					</div>
				</div>
			{/each}
			{#each node.sortedOutputs as [key, output] (key)}
				<div
					class="text-md justify-items-end items-center grid grid-rows-subgrid col-start-2 gap-2 justify-end"
					data-testid={key}
				>
					<div class="output-title" data-testid="output-title" title={output.description}>
						{capitalize(output.label || '')}{#if output.socket.isRequired}<span
								class="ps-0.5 text-lg"
								title="required">*</span
							>{/if}
					</div>
					<!-- <Ref
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
					/> -->
					<Ref
						data-testid="output-socket"
						class="text-end col-start-2"
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
	:global(.hideFloatingLabel .floatingLabel) {
		opacity: 0;
		pointer-events: none;
	}
	@keyframes rotate {
		100% {
			transform: rotate(1turn);
		}
	}
	@keyframes blink {
		0%,
		100% {
			opacity: 0.5;
		}
		50% {
			opacity: 1;
		}
	}
	@keyframes outlineBlink {
		0%,
		100% {
			outline-color: var(--fallback-a, oklch(var(--a) / 0.5));
		}
		50% {
			outline-color: var(--fallback-a, oklch(var(--a) / 1));
		}
	}
	.previewed {
		overflow: visible;
		position: relative;
		animation: outlineBlink 1s ease-out infinite;
		outline-style: solid;
		&::before {
			position: absolute;
			top: 0;
			bottom: 0;
			left: -0.25rem;
			text-align: center;
			content: 'PREVIEWING';
			color: oklch(var(--a));
			font-size: x-large;
			writing-mode: vertical-rl;
			overflow: hidden;
			text-overflow: ellipsis;
			transform: rotate(-180deg) translateX(100%);
			animation: blink 1s ease-out infinite;
		}
	}
	// .previewed {
	// 	outline: 29px solid var(--a) !important;
	// }
	// 	position: relative;
	// 	&::before {
	// 		content: '';
	// 		position: absolute;
	// 		z-index: -2;
	// 		left: -50%;
	// 		top: -50%;
	// 		width: 200%;
	// 		height: 200%;
	// 		background-color: #399953;
	// 		background-repeat: no-repeat;
	// 		background-size:
	// 			50% 50%,
	// 			50% 50%;
	// 		background-position:
	// 			0 0,
	// 			100% 0,
	// 			100% 100%,
	// 			0 100%;
	// 		background-image: linear-gradient(#399953, #399953), linear-gradient(#fbb300, #fbb300),
	// 			linear-gradient(#d53e33, #d53e33), linear-gradient(#377af5, #377af5);
	// 		animation: rotate 4s linear infinite;
	// 	}
	// 	&::after {
	// 		content: '';
	// 		position: absolute;
	// 		z-index: -1;
	// 		left: 6px;
	// 		top: 6px;
	// 		width: calc(100% - 12px);
	// 		height: calc(100% - 12px);
	// 		background: transparent;
	// 		border-radius: 5px;
	// 	}
	// }

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
