<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { writable } from 'svelte/store';

	const set = new SvelteSet();

	const count = writable(0);

	let countState = $derived($count);
</script>

<button class="btn" onclick={() => set.add('yo')}>Add</button>
<button class="btn" onclick={() => set.clear()}>Clear</button>

{#each set as item}
	<p>{item}</p>
{/each}

<div>
	<p>Count: {countState}</p>
	<button class="btn" onclick={() => ($count += 1)}>Increment</button>
	<button class="btn" onclick={() => ($count -= 1)}>Decrement</button>
	<button class="btn" onclick={() => ($count = 0)}>Reset</button>
</div>
