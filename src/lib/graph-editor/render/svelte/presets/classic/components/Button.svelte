<script lang="ts">
	import type { ButtonControl } from '../../../../../control/button/button.svelte';

	export let data: ButtonControl;
</script>

<button
	class="btn variant-filled"
	on:dblclick|stopPropagation
	on:pointerdown|stopPropagation={() => null}
	on:click={data.onClick}
>
	{data.label}
</button>
