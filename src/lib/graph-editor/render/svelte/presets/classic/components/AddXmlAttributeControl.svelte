<script lang="ts">
	import Fa from 'svelte-fa';
	import { faPlus } from '@fortawesome/free-solid-svg-icons';
	import type { AddXmlAttributeControl } from '../../../../../nodes/XML/XmlNode.svelte';

	export let data: AddXmlAttributeControl;
	const optAttrNames = [...data.xmlNode.optionalXmlAttributes];
	let remainingAttrNames = optAttrNames.filter(
		(attrName) => !data.xmlNode.state.usedOptionalAttrs.includes(attrName)
	);
	console.log('Creat', remainingAttrNames);
	let selectedPropName = remainingAttrNames[0];

	function onClickAddAttribute(event: Event) {
		data.xmlNode.addOptionalAttribute(selectedPropName);
		remainingAttrNames = remainingAttrNames.filter((attrName) => attrName !== selectedPropName);
		selectedPropName = remainingAttrNames[0];
	}
</script>

<div class="flex">
	<select class="select" on:pointerdown|stopPropagation bind:value={selectedPropName}>
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
</div>
