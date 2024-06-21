<script lang="ts">
	import { graphql, type RemoteFileExplorer$result } from '$houdini';
	import { AppShell, localStorageStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { RemoteFileExplorerStore } from '$houdini';
	export let host = localStorageStore('remote-explorer-host', '');
	export let password = localStorageStore('remote-explorer-password', '');
	export let username = localStorageStore('remote-explorer-username', '');
	export let path = localStorageStore('remote-explorer-path', '/');
	export let hrefRoute = '/remote-explorer';

	// Identifying path crumbs
	let pathCrumbs: { label: string; path: string }[] = [];
	$: {
		let res: typeof pathCrumbs = [];
		let crumbPath = '';
		for (const crumb of $path.split('/')) {
			crumbPath += crumb + '/';
			res.push({
				label: crumb,
				path: crumbPath
			});
		}
		pathCrumbs = res;
	}
	$: console.log(pathCrumbs);
	export let files: RemoteFileExplorer$result['remoteExplorer']['files'] = [];
	let mounted = false;
	onMount(() => {
		mounted = true;
	});
	let promise: ReturnType<RemoteFileExplorerStore['fetch']> | null = null;
	let isFetching = false;
	async function go() {
		isFetching = true;
		promise = new RemoteFileExplorerStore().fetch({
			variables: {
				explorerInput: {
					host: $host,
					password: $password,
					username: $username,
					path: $path
				}
			}
		});
		const { data } = await promise;
		isFetching = false;
		if (data) {
			console.log(data.remoteExplorer.files);
			files = data.remoteExplorer.files;
		}
	}
</script>

{#if mounted}
	<div class="card p-4 bg-surface-50 w-2/5">
		<AppShell>
			<svelte:fragment slot="header">
				<h3 class="h3">Remote File Explorer</h3>
			</svelte:fragment>
			<svelte:fragment slot="sidebarRight">
				<div transition:fade class="flex flex-col items-center gap-1">
					<!-- <input type="text" name="username" placeholder="Username" bind:value={$username} />
					<input type="password" name="password" placeholder="Password" bind:value={$password} /> -->
				</div>
			</svelte:fragment>
			<svelte:fragment slot="pageHeader">
				<nav class="div flex text-center align-middle items-center p-2 gap-2">
					<input type="text" name="host" class="input w-24" placeholder="host" bind:value={$host} />
					<!-- <span class="p-2">:</span> -->

					<ol class="breadcrumb">
						{#each pathCrumbs as crumb, i (crumb.path)}
							{#if i < pathCrumbs.length - 1}
								<li class="crumb">
									<a class="anchor" href={hrefRoute + crumb.path}>{crumb.label + '/	'}</a>
								</li>
								<!-- <li class="crumb-separator" aria-hidden>/</li> -->
							{:else}
								<li class="crumb">{crumb.label}</li>
							{/if}
						{/each}
					</ol>
				</nav>
			</svelte:fragment>

			{#if promise}
				{#await promise}
					<p>Loading...</p>
				{:then res}
					<ul>
						{#if res.errors}
							<h3 class="h3">Error</h3>
							{#each res.errors as error}
								<li>{error.message}</li>
							{/each}
						{:else}
							<h3 class="h3">Result</h3>
							{#each files as file}
								<li class="flex gap-1"><span>{file.name}</span>{file.isDir ? 'DIR' : ''}</li>
							{/each}
						{/if}
					</ul>
				{:catch error}
					<p>{error.message}</p>
				{/await}
			{/if}
		</AppShell>
	</div>
{/if}
