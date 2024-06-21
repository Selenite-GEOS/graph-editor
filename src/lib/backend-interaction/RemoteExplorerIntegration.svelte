<script lang="ts">
	import RemoteExplorer from '$lib/../routes/remote-explorer/[user]/[host]/[...path]/+page.svelte';
	import type { PageData } from '../../routes/remote-explorer/[user]/[host]/[...path]/$houdini';
	import { preloadData, pushState } from '$app/navigation';
	import { page } from '$app/stores';
	import { ErrorWNotif, _ } from '$lib/global';
	import { getModalStore, localStorageStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { capitalize } from '$utils';

	export let host = localStorageStore('remote-explorer-integration-host', '10.57.2.151');
	export let path = '/';
	$: if ($page.state.remoteExplorerIntegration) path = $page.state.remoteExplorerIntegration.path;
	$: console.log(
		$page.state.remoteExplorerIntegration?.data.remoteExplorerData.data?.remoteExplorer.files
			.length,
		$page.state.remoteExplorerIntegration?.path
	);
	export let user = localStorageStore('remote-explorer-integration-user', '');
	const modalStore = getModalStore();
	onMount(() => {
		setTimeout(
			() =>
				goto(
					'/remote-explorer/' +
						($user && $user !== '' ? $user : '__missing_user__') +
						'/' +
						$host +
						path
				),
			0
		);
	});
	let isLoading = false;
	async function goto(url: string) {
		console.log('going to ', url);
		const goToPath = '/' + url.split('/').slice(4).join('/');

		console.log('goto path', goToPath);
		isLoading = true;
		const result = await preloadData(url);
		if (!(result.type === 'loaded')) throw new ErrorWNotif('Error loading remote explorer data');
		const data = result.data as PageData;
		console.log('data', data);
		pushState(url, { remoteExplorerIntegration: { data, path: goToPath } });
		isLoading = false;
	}

	let files: unknown[] = [];
</script>

<div class="w-full" class:cursor-wait={false}>
	{#if $page.state.remoteExplorerIntegration?.data}
		<RemoteExplorer
			on:fileselect={(e) => {
				console.log('fileselect', e.detail.file);
			}}
			bind:user={$user}
			bind:host={$host}
			path={$page.state.remoteExplorerIntegration.path}
			{goto}
			data={$page.state.remoteExplorerIntegration.data}
			bind:files
			{isLoading}
		/>
	{:else}
		<div class="flex w-full justify-center items-center gap-2 p-4">Loading...</div>
	{/if}
</div>
