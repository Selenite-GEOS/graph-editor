<script lang="ts">
	import Portal from 'svelte-portal';
	import {
		notifications,
		type DisplayedNotification	} from './notifications.svelte';
	import { fly } from 'svelte/transition';
	import { faTimes } from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';

    const colors : Record<string, string> = {
        'red': 'oklch(var(--er))',
        'green': 'oklch(var(--ok))',
        'blue': 'oklch(var(--in))',
        'yellow': 'oklch(var(--wa))',
    }
</script>

{#snippet notification(notif: DisplayedNotification)}
	<article
		role="alert"
		class="alert shadow-lg w-[25rem]"
		out:fly={{ duration: notifications.hideAnimTime, x: 100 }}
	>
    <div class="border-4 h-full rounded-badge" style="border-color: {notif.color && notif.color in colors ? colors[notif.color] : 'oklch(var(--in))' };"></div>
		<div>
			<h1 class="font-bold">{notif.title ?? 'Notification'}</h1>
			<p class="text-wrap">
				{#each (notif.message ?? '').split('\n') as line}
					{line}
					<br />
				{/each}
			</p>
		</div>
		{#if notif.withCloseButton ?? true}
			<button type="button" class="btn btn-sm btn-ghost place-self-end self-center" onclick={() => notif.remove()}>
				<Fa icon={faTimes} class="opacity-75" />
			</button>
		{/if}
	</article>
{/snippet}

<Portal>
	<aside class="toast toast-top toast-end z-30">
		{#each notifications.displayed as notif (notif)}
			{#if notif.visible}
				{@render notification(notif)}
			{/if}
		{/each}
	</aside>
</Portal>
