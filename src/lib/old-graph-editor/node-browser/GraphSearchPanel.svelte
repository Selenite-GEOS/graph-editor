<script lang="ts">
	import { faSearch } from '@fortawesome/free-solid-svg-icons';
	import { _, getContext, keyboardShortcut } from '$lib/global/index.svelte';
	import Fa from 'svelte-fa';
	import GraphItem from './GraphItem.svelte';
	import { graphql, query } from '$houdini';
	import type { GraphSearchPanelVariables } from './$houdini';
	import { focusTrap, localStorageStore } from '@skeletonlabs/skeleton';
	import { tick } from 'svelte';
	import { flip } from 'svelte/animate';

	export let publicGraphs: boolean | null = null;
	export let authorId: string | null = null;
	export let favorite: boolean | null = null;
	export let userId: string | null = authorId;
	const q = localStorageStore('node-browser-query', '', { storage: 'session' });

	export const _GraphSearchPanelVariables: GraphSearchPanelVariables = ({ props }) => {
		return {
			params: {
				userId,
				favorite,
				authorId,
				public: publicGraphs,
				query: $q.trim() ? $q.trim() : null,
				searchAsYouType: !!$q
			}
		};
	};

	const graphsAndAuthorName = graphql(`
		query GraphSearchPanel($params: GetGraphsInput) @load @cache(policy: CacheAndNetwork) {
			graph {
				graphs(getGraphsInput: $params) {
					id
					title
					name
					authorName
					updatedAt
					favorite
				}
			}
		}
	`);
	async function reload() {
		console.log(await graphsAndAuthorName.fetch({ variables: _GraphSearchPanelVariables({}) }));
	}
	async function onQueryChange() {
		console.log('q :', $q);
		await reload();
	}
	let hasFocus = false;
</script>

<div
	use:keyboardShortcut={{
		key: 'tab',
		preventDefault: false,
		action({ e }) {
			if (!hasFocus) {
				hasFocus = true;
				e.preventDefault();
			}
		}
	}}
	use:keyboardShortcut={{
		key: 'escape',
		action({ node }) {
			hasFocus = false;
			node.querySelectorAll(':focus').forEach((el) => {
				if (el instanceof HTMLElement) {
					el.blur();
				}
			});
		}
	}}
	use:focusTrap={hasFocus}
	role="list"
	class="px-4 pb-32 bg-surface-200-700-token h-full flex flex-col items-center graph-search-pannel"
>
	<!-- Searchbar -->
	<div class="flex flex-row items-center justify-between p-2 mb-2">
		<div class="flex flex-row items-center">
			<input
				type="search"
				class="input flex-grow w-full h-8 px-2 rounded-full"
				placeholder="Search"
				bind:value={$q}
				on:keydown={(e) => {
					if (e.key === 'Escape') {
						e.target.blur();
					}
				}}
				on:input={() => onQueryChange()}
			/>
			<div
				class="flex flex-row items-center justify-center w-8 h-8 ms-2 rounded-full variant-ringed-surface px-2.5 text-surface-600-300-token"
			>
				<Fa icon={faSearch} />
			</div>
		</div>
	</div>
	{#if $graphsAndAuthorName.data}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-2">
			{#each $graphsAndAuthorName.data.graph.graphs as graph (graph.id)}
				<div role="listitem" animate:flip={{ duration: 200 }}>
					<GraphItem {graph} on:graphUpdate={() => reload()} />
				</div>
			{/each}
		</div>
	{/if}
	<!-- <div class="mb-4">
		<h2 class="h2 mb-4">{$_('title.favorite')}</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 md-grid-cols-3 gap-4 flex-wrap">
			<GraphItem />
			<GraphItem />
			<GraphItem />
			<GraphItem />
		</div>
	</div>

	<div class="mb-4">
		<h2 class="h2 mb-4">{$_('title.recents')}</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 md-grid-cols-3 gap-4 flex-wrap">
			<GraphItem />
			<GraphItem />
			<GraphItem />
			<GraphItem />
		</div>
	</div> -->
</div>

<style>
	.graph-search-pannel {
		width: 29rem;
	}

	@media (max-width: 1024px) {
		.graph-search-pannel {
			width: 15rem;
		}
	}
</style>
