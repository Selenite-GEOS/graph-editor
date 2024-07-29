<script lang="ts">
	import { SvelteSet } from "svelte/reactivity";

    const set = new SvelteSet();


</script>

<button class="btn"  onclick={() => set.add("yo")}>Add</button>
<button class="btn" onclick={() => set.clear()}>Clear</button>

{#each set as item}
    <p>{item}</p>
{/each}