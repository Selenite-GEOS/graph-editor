<script lang="ts">
	import { TreeView } from '@skeletonlabs/skeleton';
	import { filterMenuItems, type IHierachicalMenu, collectMenuView } from './utils';
	import TreeViewMenuItems from './TreeViewMenuItems.svelte';
	import { onMount } from 'svelte';
	import { _, keyboardShortcut } from '$lib/global';
	import type { IMenuItem, MenuType } from './types';
	import throttle from 'lodash.throttle';
	import PopoverMenuItems from './PopoverMenuItems.svelte';
	import { writable, type Writable } from 'svelte/store';
	import type { Action } from 'svelte/action';

	export let searchBar = true;
	export let menuItems: IMenuItem[];
	export let type: MenuType = 'tree';

	let filteredMenuItems = menuItems;
	let treeView: TreeView;
	let query = '';
	let menu: IHierachicalMenu;

	$: updateFilteredItems(menuItems);
	onMount(() => {
		if (type === 'tree') treeView.expandAll();
	});

	function updateFilteredItems(items: typeof menuItems) {
		filteredMenuItems =
			query === ''
				? items
				: filterMenuItems({
						menuItems: items,
						filter: {
							label: query.trim(),
							// description: ' ' + query,
							menuPath: [query],
							tags: [query]
						},
						verifyAll: false,
						allowMissingKey: false
					})
						.map((item) => {
							return {
								item,
								score: item.getLabel().toLowerCase().search(query.trim().toLowerCase())
							};
						})
						.toSorted((x1, x2) =>
							x1.score != x2.score
								? x1.score - x2.score
								: x1.item.getLabel().localeCompare(x2.item.getLabel())
						)
						.map((item) => item.item);
	}

	$: {
		menu = collectMenuView(filteredMenuItems);
		if (treeView) treeView.expandAll();
	}

	let focusedItem: Writable<IMenuItem | undefined> = writable(undefined);
	let focusedIndex: number | null = null;
	$: {
		if (filteredMenuItems.length === 0) focusedIndex = null;
		else focusedIndex = 0;
	}
	$: console.log('menu: focused index', focusedIndex);
</script>

<div
	class="flex flex-col h-full"
	use:keyboardShortcut={{
		key: 'arrowDown',
		isMenuShortcut: true,
		action: () => {
			if (focusedIndex !== null) {
				focusedIndex = (focusedIndex + 1) % filteredMenuItems.length;
			}
		}
	}}
	use:keyboardShortcut={{
		key: 'arrowUp',
		isMenuShortcut: true,
		action: () => {
			if (focusedIndex !== null) {
				focusedIndex = (focusedIndex - 1 + filteredMenuItems.length) % filteredMenuItems.length;
			}
		}
	}}
>
	{#if searchBar}
		<div class="flex justify-center items-center">
			<input
				type="text"
				class="w-full p-2 input text-sm"
				placeholder={$_('menu.context-menu.searchbar.placeholder')}
				style="border-radius: 5px;"
				bind:value={query}
				use:keyboardShortcut={{
					targetDocument: false,
					key: 'arrowDown',
					isMenuShortcut: true,
					action: () => {
						if (focusedIndex !== null) {
							focusedIndex = (focusedIndex + 1) % filteredMenuItems.length;
						}
					}
				}}
				use:keyboardShortcut={{
					targetDocument: false,
					key: 'arrowUp',
					isMenuShortcut: true,
					action: () => {
						if (focusedIndex !== null) {
							focusedIndex =
								(focusedIndex - 1 + filteredMenuItems.length) % filteredMenuItems.length;
						}
					}
				}}
				on:input={throttle(() => updateFilteredItems(menuItems), 100)}
			/>
		</div>
	{/if}
	<!-- <div class="pe-0.5 h-full"> -->
	<div class="overflow-y-auto h-full text-ellipsis overflow-x-hidden p-1">
		{#if type === 'tree'}
			<TreeView bind:this={treeView} width="" padding="p-1">
				<TreeViewMenuItems {menu} />
			</TreeView>
		{:else if type === 'popover'}
			<PopoverMenuItems {menu} width="w-full" />
		{:else}
			Menu type '{type}' not implemented
		{/if}
	</div>
	<!-- </div> -->
</div>
