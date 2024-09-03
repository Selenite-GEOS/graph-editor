<script lang="ts">
	import type { ButtonControl } from '../../../../../control/button/button.svelte';

	export let data: ButtonControl;

	const isPlay = data.label?.toLowerCase() === 'play';
</script>

<button
	class="btn btn-primary" class:m-2={isPlay}
	on:dblclick|stopPropagation
	on:pointerdown|stopPropagation={() => null}
	on:click={data.onClick}
>
	{data.label}
</button>
