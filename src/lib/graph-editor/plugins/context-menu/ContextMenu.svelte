<script lang="ts">
	import { flip, offset, shift, useFloating } from '@skeletonlabs/floating-ui-svelte';
	import { ContextMenu } from './context-menu.svelte';
	import { preventDefault, shortcut } from '@selenite/commons';
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
	import Menu from './Menu.svelte';
	import { fade } from 'svelte/transition';
	import { untrack } from 'svelte';
	let searchInput = $state<HTMLInputElement>();
	let menuCmpnt = $state<Menu>();
	$effect(() => {
		menu.filteredItems
		if (menu.expanded) {
			untrack(() => {
				menuCmpnt?.expandAll();
			});
		} else {
			untrack(() => {
				menuCmpnt?.collapseAll();
			});
		}
	});
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
			on:contextmenu={preventDefault}
			use:shortcut={{
				shortcuts(e) {
					const key = e.key.toLowerCase();
					return key.length === 1 && key.match(/^[-\w+?!+*/=%~&]$/) !== null;
				},
				action(node, e) {
					if (!searchInput) return;
					menu.query += e.key;
					searchInput.focus();
				}
			}}
			use:shortcut={{
				key: 'Enter',
				ignoreElements: [],
				action: () => {
					if (menuCmpnt?.getFocusedItem()) {
						menuCmpnt?.getFocusedItem()?.action();
						menu.visible = false;
						return;
					}
					menu.triggerFirstItem()
				}
			}}
			use:shortcut={{
				ignoreElements: [],
				key: 'Escape',
				action(e) {
					menu.visible = false;
				}
			}}
			use:shortcut={{
				key: 'ArrowDown',
				action() {
					menuCmpnt?.focusNext();
				},
				ignoreElements: []
			}}
			use:shortcut={{
				key: 'ArrowUp' ,
				action() {
					menuCmpnt?.focusPrevious();
				},
				ignoreElements: []
			}}
			bind:this={floating.elements.floating}
			style={floating.floatingStyles}
			role="menu"
			tabindex="0"
			transition:fade={{ duration: 200 }}
			on:mouseover={() => {
				menu.hovered = true;
			}}
			on:mouseout={() => {
				menu.hovered = false;
			}}
			on:focus={() => {
				menu.focused = true;
			}}
			on:blur={() => {
				menu.focused = false;
			}}
			class="floating context-menu flex flex-col overflow-x-clip scrollbar-corner-rounded-full scrollbar-thin scrollbar-track-rounded-full scrollbar-thumb-rounded-full scrollbar-thumb-slate-300 scrollbar-track-slate-900 overflow-y-auto rounded-box border shadow-lg border-base-300"
		>

			{#if menu.searchbar}
				<input
					bind:this={searchInput}
					type="text"
					class="p-3 rounded-t-box"
					placeholder="Search..."
					bind:value={menu.query}
				/>
			{/if}
			<Menu
				bind:this={menuCmpnt}
				items={menu.filteredItems}
				sort={menu.query.trim().length === 0}
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
		min-width: 10rem;
		max-width: 35rem;
		min-height: 1rem;
		max-height: 30rem;
	}
</style>
