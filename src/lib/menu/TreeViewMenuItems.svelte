<script lang="ts">
	import { TreeViewItem } from '@skeletonlabs/skeleton';
	import type { IHierachicalMenu } from './utils';
	import {
		isNodeMenuItem,
		type INodeMenuItem,
		type IBaseMenuItem,
		isActionMenuItem
	} from '$lib/menu';
	import {
		moonMenuFactoryStore,
		moonMenuVisibleStore
	} from '$lib/menu/context-menu/moonContextMenu';
	import { ErrorWNotif, getContext } from '$lib/global';
	export let menu: IHierachicalMenu;

	$: submenus = menu.getSubmenus();
	$: menuItems = menu.getMenuItems();
	const onItemClick = getContext('moonMenuOnItemClick');

	async function handleItem(item: IBaseMenuItem) {
		if (isNodeMenuItem(item)) {
			console.log(item);
			const factory = $moonMenuFactoryStore;
			if (!factory) throw new ErrorWNotif('No factory found');
			// item.getAddNode()({factory});
			await onItemClick({ action: item.getAddNode({}) });
		} else if (isActionMenuItem(item)) {
			item.executeAction();
			$moonMenuVisibleStore = false;
		}
	}
</script>

{#each menuItems as item, index (index)}
	<div title={item.getDescription()}>
		<TreeViewItem
			on:click={(event) => {
				if (event.isTrusted) handleItem(item);
			}}
			regionSummary="select-none"
		>
			{item.getLabel()}
		</TreeViewItem>
	</div>
{/each}
{#each submenus as submenu, index (index)}
	<TreeViewItem regionSummary="select-none">
		{submenu.getLabel()}
		<svelte:fragment slot="children">
			<svelte:self menu={submenu} />
		</svelte:fragment>
	</TreeViewItem>
{/each}
