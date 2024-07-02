<script lang="ts">
	import { EditMacroNodeChannel } from '$lib/broadcast-channels';
	import type { NodeEditorSaveData } from '$rete/NodeEditor';
	import { faStar as faStarSolid, faUser } from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';
	import { ErrorWNotif, _, getContext } from '$lib/global';
	import { draggable } from '@neodrag/svelte';
	import type { DragData } from '../types';
	import { locale } from 'svelte-i18n';
	import type { GraphSearchPanel$result } from '$houdini';
	import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	export let graph: GraphSearchPanel$result['graph']['graphs'][0];
	const editMacroNodeChannel = new EditMacroNodeChannel();

	const session = getContext('session');

	async function ondblclick(event: MouseEvent) {
		if (!graph.id) {
			throw new ErrorWNotif('Graph id not found');
		}
		event.stopPropagation();
		console.log('dblclick', graph.name);
		const { GetGraphStore } = await import('$houdini');
		const graphStore = new GetGraphStore();
		const responseData = (await graphStore.fetch({ variables: { id: graph.id } })).data?.graph.graph
			.editorData;
		if (responseData === undefined) {
			throw new Error('Graph not found');
		}
		const graphData = responseData as NodeEditorSaveData;
		console.log('fetched: graph: ', graphData);

		console.log('broadcast: edit:', graphData.editorName);
		await editMacroNodeChannel.postMessage({ graph: graphData });
	}

	function onDragStart(event: DragEvent) {
		if (!graph.id) {
			throw new ErrorWNotif('Graph id not found');
		}
		console.log('dragstart', graph.name);
		event.dataTransfer?.setData('rete/macronode', graph.id);
		return event;
	}

	let toggleFavBtn: HTMLButtonElement;

	async function toggleFav() {
		const userId = session?.user?.id;
		if (!userId) {
			throw new ErrorWNotif("You're not logged in");
		}
		if (!graph.id) {
			throw new ErrorWNotif('Graph id not found');
		}
		const { GraphSetFavoriteStore } = await import('$houdini');
		const graphSetFavoriteStore = new GraphSetFavoriteStore();

		const response = await graphSetFavoriteStore.mutate({
			params: { graphId: graph.id, userId, favorite: !graph.favorite }
		});
		if (response.errors) {
			throw new ErrorWNotif(response.errors[0].message);
		}
		graph.favorite = !graph.favorite;
		graph = graph;
		// dispatch('graphUpdate', {});
	}
	// const dispatch = createEventDispatcher<{graphUpdate: {}}>();
</script>

<div
	role="button"
	tabindex="0"
	draggable="true"
	on:dblclick={ondblclick}
	on:dragstart={onDragStart}
	transition:fade
	class="group relative card card-hover overflow-hidden variant-filled-surface w-52 text-xs select-none"
>
	<!-- <header>
		<img
			draggable="false"
			src="https://source.unsplash.com/vjUokUWbFOs/400x175"
			class="bg-black/50 w-full aspect-[21/9]"
			alt="Post"
		/>
	</header> -->
	<button
		type="button"
		class="absolute top-2 right-2 z-20 group"
		bind:this={toggleFavBtn}
		on:dblclick|stopPropagation
		on:click|stopPropagation={() => toggleFav()}
	>
		<Fa
			icon={graph.favorite ? faStarSolid : faStarRegular}
			class={`group-focus:visible group-hover:visible ${graph.favorite ? '' : 'invisible'}`}
		/>
	</button>
	<div class="p-4 space-y-4 flex">
		<!-- <h6 class="h6"><div class="placeholder w-24 h-2" /></h6> -->
		<!-- <h3 class="h3"><div class="placeholder w-32" /></h3> -->
		<h3 class="h5 truncate" title={graph.name}>{graph.name}</h3>
	</div>

	<hr class="opacity-50" />
	<footer class="p-4 flex justify-start items-center space-x-2">
		<Fa icon={faUser} class="w-2" />
		<div class="flex-auto flex justify-between items-center truncate">
			<h6 class="font-bold h-4 truncate" style="width: 5.3rem;" title={graph.authorName}>
				{$_('card.graphItem.by_author', { values: { name: graph.authorName } })}
			</h6>
			{#if graph.updatedAt && $locale}
				<small
					title={graph.updatedAt.toLocaleTimeString($locale, {
						hour: '2-digit',
						minute: '2-digit'
					})}
					>{$_('card.graphItem.on_date', {
						values: { date: new Date(graph.updatedAt).toLocaleDateString($locale) }
					})}</small
				>
			{/if}
		</div>
	</footer>
</div>
