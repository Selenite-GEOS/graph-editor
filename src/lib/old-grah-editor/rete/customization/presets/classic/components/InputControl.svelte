<script lang="ts">
	import type { InputControl, InputControlTypes } from '$graph-editor/control/Control';
	import { FileButton } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	export let data: InputControl<InputControlTypes>;
	let isReady = false;
	let type: InputControlTypes;
	$: type = data.type;
	$: readonly = data.readonly;
	$: value = data.value;
	let debouncedValue = value;
	let debouncedTimer: NodeJS.Timeout | undefined;
	$: options = data.options;
	$: pattern = options?.pattern;
	let isFirstSet = true;
	export let width = 'w-full';
	let fileList: FileList | undefined;

	// Debounce value
	$: if (!isFirstSet) {
		console.log('debounced', debouncedValue);
		data.setValue(debouncedValue);
		if (data?.options?.debouncedOnChange) data.options.debouncedOnChange(debouncedValue);
	}

	function onChange(val: unknown) {
		if (isFirstSet) {
			isFirstSet = false;
			// return;
		}

		value = val;

		if (data.options?.change !== undefined) data.options.change(val);
		clearTimeout(debouncedTimer);
		debouncedTimer = setTimeout(() => {
			debouncedValue = val;
		}, 200);
	}
	function onChangeFromEvent(event: Event) {
		const target = event.target as HTMLInputElement;
		const val = target.value;
		onChange(val);
	}

	function onFileChange(event: Event) {
		const val = (event.target as HTMLInputElement)?.value;
		console.log(val);
		console.log(typeof val);
		onChange(val);
	}
	export let inputTextSize = 'text-md';
	console.log(data.options?.pattern);
</script>

{#if type == 'select'}
	<label class="label">
		{#if options?.label}
			<div class="truncate w-full">
				<span title={options.label} class="text-ellipsis text-white">
					{options?.label ? options?.label : ''}</span
				>
			</div>
		{/if}
		{#if options?.options}
			<select
				class="{inputTextSize} hover:bg-surface-50-900-token focus:bg-surface-50-900-token {width} rounded-token bg-surface-200-700-token
				
			 text-surface-900-50-token border-token
			 focus:border-primary-500 focus:ring-primary-500 transition-colors"
				{value}
				on:input={onChangeFromEvent}
				on:pointerdown|stopPropagation={() => false}
			>
				{#each options?.options as option, i}
					<option value={option}>{option}</option>
				{/each}
			</select>
		{/if}
	</label>
	<!-- {:else if type == 'color'}
	<label class="label">
		{#if options?.label}
			<span title={options.label} class="text-white"> {options?.label ? options?.label : ''}</span>
		{/if}
		<input
			on:dblclick|stopPropagation
			type="color"
			class="hover:bg-surface-50-900-token focus:bg-surface-50-900-token {width} rounded-token bg-surface-200-700-token
				
			 text-surface-900-50-token border-token
			 focus:border-primary-500 focus:ring-primary-500 transition-colors"
			{value}
			{readonly}
			on:input={onChangeFromEvent}
			on:pointerdown|stopPropagation={() => false}
		/>
	</label>
{:else if type == 'date'}
	<label class="label">
		{#if options?.label}
			<span title={options.label} class="text-white"> {options?.label ? options?.label : ''}</span>
		{/if}
		<input
			on:dblclick|stopPropagation
			type="date"
			class="hover:bg-surface-50-900-token focus:bg-surface-50-900-token {width} rounded-token bg-surface-200-700-token
				
			 text-surface-900-50-token border-token
			 focus:border-primary-500 focus:ring-primary-500 transition-colors"
			{value}
			{readonly}
			on:input={onChangeFromEvent}
			on:pointerdown|stopPropagation={() => false}
		/>
	</label> -->
{:else if type == 'checkbox'}
	<label
		title="boolean"
		class="label {width} h-full flex items-center cursor-pointer justify-start"
	>
		<!-- <span title={options.label} class="">{options?.label}</span> -->
		<div class="flex gap-2 w-full">
			{#if options?.label}
				<div class="truncate">
					<span title={options.label} class="text-white">{options?.label}</span>
				</div>
			{/if}
			<input
				on:pointerdown|stopPropagation={() => false}
				on:dblclick|stopPropagation
				type="checkbox"
				class="checkbox"
				title="boolean"
				{value}
				checked={value}
				readOnly={readonly}
				on:change={(e) => onChange(e.currentTarget.checked)}
				label={options?.label}
			/>
		</div>
	</label>
{:else if type === 'integer'}
	<label class="label w-full">
		{#if options?.label}
			<div class="w-full truncate">
				<span title={options.label} class="text-white">
					{options?.label ? options?.label : ''}</span
				>
			</div>
		{/if}
		<input
			placeholder="integer"
			title="integer"
			step="1"
			type="number"
			class="{inputTextSize} hover:bg-surface-50-900-token focus:bg-surface-50-900-token {width} rounded-token bg-surface-200-700-token
				
			 text-surface-900-50-token border-token
			 focus:border-primary-500 focus:ring-primary-500 transition-colors"
			{value}
			{readonly}
			on:dblclick|stopPropagation
			on:pointerdown|stopPropagation
			on:keypress={(e) => {
				if (e.key === '.' || e.key === ',') {
					e.preventDefault();
				}
			}}
			on:input={onChangeFromEvent}
			on:pointerdown|stopPropagation={() => false}
		/>
	</label>
{:else if type == 'number'}
	<label class="label">
		{#if options?.label}
			<div class="truncate w-full">
				<span title={options.label} class="text-white">
					{options?.label ? options?.label : ''}</span
				>
			</div>
		{/if}
		<input
			placeholder="number"
			title="number"
			step="0.1"
			type="number"
			class="{inputTextSize} hover:bg-surface-50-900-token focus:bg-surface-50-900-token {width} rounded-token bg-surface-200-700-token
				
			 text-surface-900-50-token border-token
			 focus:border-primary-500 focus:ring-primary-500 transition-colors"
			{value}
			{readonly}
			on:blur={() => {
				let candidate = value;

				console.log('candidate', candidate);
				if (typeof candidate !== 'string') return;

				candidate = parseFloat(candidate);
				if (isNaN(candidate)) {
					onChange('');
				} else {
					onChange(candidate);
					value = candidate;
				}
			}}
			on:input={onChangeFromEvent}
			on:dblclick|stopPropagation
			on:pointerdown|stopPropagation={() => false}
		/>
	</label>
{:else if type == 'text'}
	<label class="label">
		<!-- {options?.label ? options?.label : ''} -->
		{#if options?.label}
			<div class="truncate w-full">
				<span title={options.label} class="text-white">
					{options?.label ? options?.label : ''}</span
				>
			</div>
		{/if}
		<input
			on:dblclick|stopPropagation
			type="text"
			placeholder="string"
			title="string"
			class="{inputTextSize} hover:bg-surface-50-900-token focus:bg-surface-50-900-token {width} rounded-token bg-surface-200-700-token
				
			 text-surface-900-50-token border-token
			 focus:border-primary-500 focus:ring-primary-500 transition-colors"
			{value}
			on:input={onChangeFromEvent}
			{readonly}
			on:pointerdown|stopPropagation={() => false}
		/>
	</label>
{:else if type == 'textarea'}
	<label class="label">
		<!-- {options?.label} -->
		{#if options?.label}
			<div class="truncate w-full">
				<span title={options.label} class="text-white">
					{options?.label ? options?.label : ''}</span
				>
			</div>{/if}
		<textarea
			class="{inputTextSize} hover:bg-surface-50-900-token focus:bg-surface-50-900-token {width} rounded-md bg-surface-200-700-token
			 text-surface-900-50-token border-token
			 focus:border-primary-500 focus:ring-primary-500 transition-colors
			 "
			{value}
			{readonly}
			on:input={onChangeFromEvent}
			on:pointerdown|stopPropagation={() => false}
		/>
	</label>
{:else if type == 'vector'}
	<div class="label">
		{#if options?.label}
			<div class="truncate w-full">
				<span title={options.label} class="text-white text-sm"
					>{options?.label ? options?.label : ''}</span
				>
			</div>
		{/if}
		<div class="vector flex {width}">
			<input
				on:dblclick|stopPropagation
				type="number"
				class="{inputTextSize} hover:bg-surface-50-900-token focus:bg-surface-50-900-token w-1/3 bg-surface-200-700-token
				rounded-tl-token rounded-bl-token text-end
			 text-surface-900-50-token border-token
			 focus:border-primary-500 focus:ring-primary-500 transition-colors"
				name="x"
				placeholder="x"
				title="x"
				value={value.x}
				readOnly={readonly}
				on:input={(e) => {
					onChange({ ...value, x: e.currentTarget.value });
					// data.setValue(val);
				}}
				on:pointerdown|stopPropagation={() => false}
			/>
			<input
				on:dblclick|stopPropagation
				name="y"
				placeholder="y"
				title="y"
				type="number"
				class="{inputTextSize} hover:bg-surface-50-900-token focus:bg-surface-50-900-token w-1/3 bg-surface-200-700-token
			 text-surface-900-50-token border-token text-end
			 focus:border-primary-500 focus:ring-primary-500 transition-colors"
				value={value.y}
				{readonly}
				on:input={(e) => {
					onChange({ ...value, y: e.currentTarget.value });
					// data.setValue(val);
				}}
				on:pointerdown|stopPropagation={() => false}
			/>
			<input
				on:dblclick|stopPropagation
				type="number"
				placeholder="z"
				title="z"
				class="{inputTextSize} hover:bg-surface-50-900-token focus:bg-surface-50-900-token w-1/3 bg-surface-200-700-token
				rounded-tr-token rounded-br-token text-end
			 text-surface-900-50-token border-token
			 focus:border-primary-500 focus:ring-primary-500 transition-colors"
				name="z"
				value={value.z}
				{readonly}
				on:input={(e) => {
					const val = { ...value, z: e.currentTarget.value };
					onChange(val);
					// data.setValue(val);
				}}
				on:pointerdown|stopPropagation={() => false}
			/>
		</div>
	</div>
{:else if type == 'file'}
	<label class="label">
		<!-- {options?.label ? options?.label : ''} -->
		{#if options?.label}
			<div class="truncate w-full">
				<span title={options.label} class="text-white">
					{options?.label ? options?.label : ''}</span
				>
			</div>{/if}
		<input
			on:dblclick|stopPropagation
			type="text"
			class="{inputTextSize} hover:bg-surface-50-900-token focus:bg-surface-50-900-token {width} rounded-token bg-surface-200-700-token
				
			 text-surface-900-50-token border-token
			 focus:border-primary-500 focus:ring-primary-500 transition-colors"
			{value}
			on:input={onChangeFromEvent}
			{readonly}
			on:pointerdown|stopPropagation={() => false}
		/>
	</label>
{:else if type === 'remote-file'}
	<div class="flex gap-1">
		<input
			on:dblclick|stopPropagation
			on:pointerdown|stopPropagation
			type="text"
			title="remote file"
			class="{inputTextSize} input"
			placeholder="Select file or folder"
			{value}
		/>
		<button
			on:pointerdown|stopPropagation
			class="btn btn-sm variant-filled"
			on:click={() => console.log('clicked')}>^</button
		>
	</div>
	<!-- <FileButton
		{value}
		{readonly}
		{options}
		on:change={onFileChange}
	/> -->
{:else if type === 'group-name-ref'}
	<label class="label">
		{#if options?.label}
			<div class="truncate w-full">
				<span
					title={options.label}
					class="text-white
					">{options?.label ? options?.label : ''}</span
				>
			</div>
		{/if}
		<input
			on:dblclick|stopPropagation
			type="text"
			class="{inputTextSize} hover:bg-surface-50-900-token focus:bg-surface-50-900-token {width} rounded-token bg-surface-200-700-token
			
			 text-surface-900-50-token border-token
			 focus:border-primary-500 focus:ring-primary-500 transition-colors"
			placeholder="groupName"
			{value}
			on:input={onChangeFromEvent}
			{readonly}
			on:pointerdown|stopPropagation={() => false}
		/>
	</label>
{:else}
	Unsupported control type&nbsp: '{type}'
{/if}

<style>
	.vector input[type='number']::-webkit-inner-spin-button,
	.vector input[type='number']::-webkit-outer-spin-button {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		margin: 0;
	}

	.vector input[type='number'] {
		-moz-appearance: textfield;
		appearance: textfield;
	}
</style>
