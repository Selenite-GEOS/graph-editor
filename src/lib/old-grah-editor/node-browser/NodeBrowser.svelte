<script lang="ts">
	import { faStar, faUser, faGlobe } from '@fortawesome/free-solid-svg-icons';
	import { AppRail, AppRailTile } from '@skeletonlabs/skeleton';
	import Fa from 'svelte-fa';
	import { _ } from 'svelte-i18n';
	import GraphSearchPanel from './GraphSearchPanel.svelte';
	import { fade, slide } from 'svelte/transition';
	import { getContext, keyboardShortcut } from '$lib/global';

	const session = getContext('session');

	let currentTile: string | undefined = undefined;
	let drawerMode = false;

	function onTileClick(tile: string) {
		if (currentTile && currentTile === tile) {
			currentTile = undefined;
			return;
		}
	}

	function getTileShortcutAction(tile: string): () => void {
		return () => {
			if (currentTile === tile) {
				currentTile = undefined;
				return;
			}
			currentTile = tile;
		};
	}
</script>

<div
	class="flex h-full"
	in:fade
	out:fade={{ duration: 200 }}
	use:keyboardShortcut={{ key: 'f', action: getTileShortcutAction('favorites') }}
	use:keyboardShortcut={{ key: 'u', action: getTileShortcutAction('user') }}
	use:keyboardShortcut={{ key: 's', action: getTileShortcutAction('shared') }}
	use:keyboardShortcut={{ key: 'p', action: getTileShortcutAction('shared') }}
>
	<AppRail regionDefault="select-none">
		<AppRailTile
			bind:group={currentTile}
			name="favorites"
			value={'favorites'}
			tile="favorites"
			on:click={() => onTileClick('favorites')}
		>
			<svelte:fragment slot="lead">
				<Fa class="text-2xl mx-auto" icon={faStar} />
			</svelte:fragment>
			<span>{$_('browser.tab.favorite')}</span>
		</AppRailTile>
		<AppRailTile
			bind:group={currentTile}
			name="user"
			value={'user'}
			tile="user"
			on:click={() => onTileClick('user')}
		>
			<svelte:fragment slot="lead">
				<Fa class="text-2xl mx-auto" icon={faUser} />
			</svelte:fragment>
			<span>{$_('browser.tab.user')}</span>
		</AppRailTile>
		<AppRailTile
			bind:group={currentTile}
			name="shared"
			value={'shared'}
			tile="shared"
			on:click={() => onTileClick('shared')}
		>
			<svelte:fragment slot="lead">
				<Fa class="text-2xl mx-auto" icon={faGlobe} />
			</svelte:fragment>
			<span>{$_('browser.tab.shared')}</span>
		</AppRailTile>
	</AppRail>

	{#if currentTile}
		<div
			class="max-h-full overflow-y-auto overflow-x-clip"
			transition:slide={{ axis: 'x', duration: 200 }}
		>
			{#if currentTile === 'favorites'}
				<GraphSearchPanel userId={session?.user.id} favorite={true} />
			{:else if currentTile === 'user'}
				<GraphSearchPanel authorId={session?.user.id} />
			{:else if currentTile === 'shared'}
				<GraphSearchPanel userId={session?.user.id} publicGraphs={true} />
			{/if}
		</div>
	{/if}
</div>
