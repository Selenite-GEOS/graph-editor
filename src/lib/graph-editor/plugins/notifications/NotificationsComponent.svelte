<script lang="ts">
	import Portal from 'svelte-portal';
	import { notifications, type DisplayedNotification } from './notifications.svelte';
	import { fly } from 'svelte/transition';
	import { faTimes } from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';

	const colors: Record<string, string> = {
		red: 'oklch(var(--er))',
		error: 'oklch(var(--er))',
		green: 'oklch(var(--su))',
		success: 'oklch(var(--su))',
		blue: 'oklch(var(--in))',
		info: 'oklch(var(--in))',
		warn: 'oklch(var(--wa))',
		warning: 'oklch(var(--wa))',
		yellow: 'oklch(var(--wa))'
	};
</script>

{#snippet notification(displayedNotif: DisplayedNotification)}
	{@const notif = displayedNotif.notif}
	<article
		role="alert"
		class="alert shadow-lg w-[25rem] overflow-clip"
		out:fly={{ duration: notifications.hideAnimTime, x: 100 }}
	>
		<div
			class="border-4 h-full rounded-badge"
			style="border-color: {notif.color && notif.color in colors
				? colors[notif.color]
				: 'oklch(var(--in))'};"
		></div>
		<div>
			<h1 class="font-bold truncate">{notif.title ?? 'Notification'}</h1>
			<p class="text-wrap">
				{#each (notif.message ?? '').split('\n') as line}
					{line}
					<br />
				{/each}
			</p>
		</div>
		{#if notif.withCloseButton ?? true}
			<button
				type="button"
				class="btn btn-sm btn-ghost place-self-end self-center"
				onclick={() => displayedNotif.remove()}
			>
				<Fa icon={faTimes} class="opacity-75" />
			</button>
		{/if}
	</article>
{/snippet}

<Portal>
	<aside class="toast toast-top toast-end z-30 max-h-screen overflow-y-auto overflow-x-clip">
		{#each notifications.displayed as notif (notif)}
			{#if notif.visible}
				{@render notification(notif)}
			{/if}
		{/each}
	</aside>
</Portal>

<style>
	.alert {
		grid-auto-flow: column;
		grid-template-columns: auto minmax(auto, 1fr);
		justify-items: start;
		text-align: start;
		max-width: 70vw;
	}
</style>
