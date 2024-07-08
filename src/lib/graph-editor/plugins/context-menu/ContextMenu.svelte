<script lang="ts">
	import { flip, offset, shift, useFloating } from '@skeletonlabs/floating-ui-svelte';
	import { ContextMenu } from './context-menu.svelte';

	const menu = $derived(ContextMenu.instance);
	const x = $derived(menu.pos.x);
	const y = $derived(menu.pos.y);
	const floating = useFloating({
		get open() {
			return menu.visible;
		},
		placement: 'bottom-start',
		get middleware() {
			return [offset({ mainAxis: -15, alignmentAxis: -10 }), shift(), flip()];
		}
	});

	// Update position when menu is visible
	$effect(() => {
		if (!menu.visible) return;
		menu.pos.x;
		menu.pos.y;
		floating.update();
	});
	import Portal from 'svelte-portal';
	import ExampleMenu from './ExampleMenu.svelte';
	import { fade } from 'svelte/transition';
</script>

{#if menu.visible}
	<Portal>
		<div
			class="floating"
			bind:this={floating.elements.reference}
			style="left: {x}px; top: {y}px"
		></div>
		<!-- svelte-ignore event_directive_deprecated -->
		<div
			bind:this={floating.elements.floating}
			style={floating.floatingStyles}
			role="menu"
			tabindex="0"
			transition:fade={{ duration: 200 }}
			on:mouseover={() => (menu.hovered = true)}
			on:mouseout={() => (menu.hovered = false)}
			on:focus={() => (menu.hovered = true)}
			on:blur={() => (menu.hovered = false)}
			class="floating context-menu flex flex-col gap-1 overflow-y-auto"
		>
			{#if menu.searchbar}
				<input type="text" class="p-2" placeholder="Search..." bind:value={menu.query} />
			{/if}
			<ExampleMenu
				items={menu.filteredItems}
				onclick={() => {
					menu.visible = false;
				}}
			/>
		</div>
	</Portal>
{/if}

<style>
	.floating {
		width: max-content;
		position: absolute;
		top: 0;
		left: 0;
	}

	.context-menu {
		background-color: hsl(0, 0%, 50%, 0.5);
		min-width: 10rem;
		max-width: 20rem;
		min-height: 5rem;
		max-height: 30rem;
	}
</style>
