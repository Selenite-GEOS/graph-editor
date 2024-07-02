<script lang="ts">
	import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';

	import Fa from 'svelte-fa';
	export let icon: IconDefinition;
	export let flip: 'horizontal' | 'vertical' | 'both' | undefined = undefined;
</script>

<button class="btn btn-icon-sm variant-filled-primary pointer-events-auto" on:click
	><Fa {icon} {flip} /></button
>
