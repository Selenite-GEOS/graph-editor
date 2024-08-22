<script lang="ts">
	import type { AddXmlAttributeControl } from '$graph-editor/nodes/XML';
	import { checkbox, keyboardNavigation, stopPropagation } from '@selenite/commons';
	import { modals } from '$graph-editor/plugins';
	import wu from 'wu';

	let { data }: { data: AddXmlAttributeControl } = $props();

	const xmlNode = $derived(data.xmlNode);
	let query = $state('');
	let loweredQuery = $derived(query.toLowerCase());
	let filteredOptAttr = $derived(loweredQuery.trim() === '' ? xmlNode.optionalXmlAttributes : wu(xmlNode.optionalXmlAttributes).filter((attr) => attr.toLowerCase().includes(loweredQuery)).toArray());
	let attrs = $derived(xmlNode.complex.attributes);
</script>

{#snippet OptionalAttributesModal()}
	<input class="input input-bordered w-full mb-2" placeholder="Search..." bind:value={query}>
	<p class="text-xs italic ms-2 mb-1 opacity-60">Hold and drag to trigger multiple checkboxes.</p>
	<div class="h-[50vh] overflow-y-auto scrollbar-thin p-2">
		<ul class="flex flex-col">
			{#each filteredOptAttr as attrName}
				{@const doc = attrs.get(attrName)?.doc}
				<li >
					<label class="flex items-center gap-4 py-2 cursor-pointer" title={doc}>
						<input use:checkbox use:keyboardNavigation checked={xmlNode.usedOptionalAttrs.has(attrName)} onchange={() => {
							if (xmlNode.usedOptionalAttrs.has(attrName)) {
								xmlNode.removeOptionalAttribute(attrName);
							} else {
								xmlNode.addOptionalAttribute(attrName);
							}
						}}>
					{attrName} <span class="text-nowrap truncate italic opacity-50 ms-0">{doc}</span>
					</label>
				</li>
			{/each}
		</ul>
	</div>
{/snippet}

<button
	type="button"
	title="Select optional attributes to use."
	class="btn btn-neutral"
	class:btn-ghost={false && xmlNode.selected}
	onclick={() => {
		modals.show({
			snippet: OptionalAttributesModal,
			props: {},
			title: 'Optional attributes',
			buttons: ['cancel']
		});
	}}
	onpointerdown={stopPropagation}
	ondblclick={stopPropagation}
>
	Optional attributes
</button>
<!-- <div class="flex">
	<select
		class="select text-base-content"
		on:pointerdown|stopPropagation
		bind:value={selectedPropName}
	>
		{#each remainingAttrNames as optAttrName (optAttrName)}
			<option value={optAttrName}>{optAttrName}</option>
		{/each}
	</select>
	<button
		type="button"
		class="btn-icon variant-filled"
		on:pointerdown|stopPropagation
		on:click={onClickAddAttribute}><Fa icon={faPlus} /></button
	>
</div> -->
