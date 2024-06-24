<script lang="ts">
  import { NodeFactory } from '$rete';
    import {setupClasses} from '$rete/setup/appLaunch'
  import { onMount } from 'svelte';

    let classRegistry : Record<string, string>
    onMount(async () => {
        await setupClasses();
        classRegistry = NodeFactory.classRegistry
        console.log(NodeFactory.classRegistry)
    })

</script>

{#if classRegistry}
<div class="grid grid-cols-2">
{#each Object.entries(classRegistry) as [k, v]}
<p>{k}</p>
{/each}
</div>
{/if}