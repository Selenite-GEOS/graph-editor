<script lang="ts">
	import type { IHierachicalMenu } from './utils';
	import type { UUID } from 'crypto';
	import { createFloatingActions } from 'svelte-floating-ui';
	import { onMount } from 'svelte';
	import { focusTrap } from '@skeletonlabs/skeleton';
	import debounce from 'lodash.debounce';
	import throttle from 'lodash.throttle';

	export let width = '';
	export let menu: IHierachicalMenu;
	// export let parents: UUID[] = [];
	export let isHovered = true;
	let timer: NodeJS.Timeout;

	const debouncedUpdateIsHovered = debounce(
		() => (isHovered = isSelfHovered || isChildHovered),
		400
	);

	$: if (isSelfHovered || isChildHovered) {
		isHovered = true;
	} else {
		debouncedUpdateIsHovered();
	}

	let isSelfHovered = false;
	let isChildHovered = false;
	let hoveredItem: number | undefined;
	// export let autoFocus = false;
	let activeChild: number | undefined;
	$: submenus = menu.getSubmenus();
	$: menuItems = menu.getMenuItems();
	$: if (!isChildHovered) {
		activeChild = undefined;
	}
</script>

{isHovered}
<ul
	class="list {width}"
	on:mouseenter={() => {
		isSelfHovered = true;
	}}
	on:mouseleave={() => (isSelfHovered = false)}
>
	{#each submenus as submenu, i (i)}
		{@const [floatingRef, floatingContent] = createFloatingActions({ placement: 'right-start' })}
		<li
			on:mouseenter={() => (hoveredItem = i)}
			on:mouseleave={() => {
				if (hoveredItem === i) hoveredItem = undefined;
			}}
		>
			<btn
				role="menuitem"
				tabindex={i}
				class=" [&>*]:pointer-events-none flex-auto"
				use:floatingRef
				on:mouseenter={() => (activeChild = i)}
				on:keydown={(e) => {
					if (e.key === 'ArrowRight') {
						activeChild = i;
					}
				}}
			>
				{submenu.getLabel()}
			</btn>
			<div use:floatingContent>
				{#if activeChild === i}
					<svelte:self menu={submenu} autoFocus={true} bind:isHovered={isChildHovered} />
				{/if}
			</div>
		</li>
	{/each}
	{#each menuItems as item, j (j)}
		<li>
			<btn role="menuitem" tabindex={submenus.length + j}> {item.getLabel()}</btn>
		</li>
	{/each}
</ul>
