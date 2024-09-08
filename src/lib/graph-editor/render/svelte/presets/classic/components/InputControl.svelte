<script lang="ts">
	import { Modal, type ModalButtonSettings } from '@selenite/commons';
	import {
		defaultInputControlValues,
		InputControl,
		socketToControl,
		type InputControlType,
		type InputControlValueType
	} from '$graph-editor/socket';
	import { autosize, checkbox, shortcut, stopPropagation } from '@selenite/commons';
	import type {
		HTMLInputAttributes,
		HTMLInputTypeAttribute,
		HTMLTextareaAttributes
	} from 'svelte/elements';
	import { fade } from 'svelte/transition';
	import type { DataType } from '$graph-editor/plugins/typed-sockets';
	import { description } from '$graph-editor/nodes';
	import Fa from 'svelte-fa';
	import { faTimes } from '@fortawesome/free-solid-svg-icons';
	import { cloneDeep } from 'lodash-es';
	import { tick } from 'svelte';
	type Props = {
		data: InputControl<InputControlType>;
		// width?: string;
		focus?: boolean;
		inputTextSize?: string;
	};
	let {
		data: inputControl = $bindable(),
		inputTextSize = 'text-md',
		focus = false
	}: Props = $props();
	let type = $derived(inputControl.type);
	const isCheckbox = $derived(type === 'checkbox');
	// $inspect(inputControl.value).with(console.debug);
	const modal = Modal.instance;
	const simpleTypes = ['checkbox', 'group-name-ref', 'integer', 'number', 'text'] as const;
	const inputType: Record<(typeof simpleTypes)[number], HTMLInputTypeAttribute> = {
		number: 'number',
		text: 'text',
		checkbox: 'checkbox',
		integer: 'number',
		'group-name-ref': 'text'
	};
	// let width: string = $derived.by(() => {
	// 	// if (type === )
	// 	if (type === "number" || type === "integer") return 'w-[8rem]'
	// 	return '';
	// })
	let inputProps: HTMLInputAttributes = $derived({
		placeholder: inputControl.socketType,
		title: isCheckbox ? String(Boolean(inputControl.value)) : undefined,
		readonly: inputControl.readonly,
		type: simpleTypes.includes(type as (typeof simpleTypes)[number])
			? inputType[type as (typeof simpleTypes)[number]]
			: 'text',
		checked: type === 'checkbox' ? (inputControl.value as boolean) : undefined,
		step: type === 'number' ? 0.01 : type === 'integer' ? 1 : undefined,
		oninput: (e) => {
			if (type === 'checkbox') {
				inputControl.value = e.currentTarget.checked;
				return;
			}
			if (type === 'number' && isNaN(parseFloat(e.currentTarget.value))) {
				return;
			}
			const stringTypes = ['string', 'path', 'groupNameRef'] as DataType[];
			if (stringTypes.includes(inputControl.socketType as DataType)) {
				inputControl.value = e.currentTarget.value;
				return;
			}
			let value: unknown;
			try {
				value = JSON.parse(e.currentTarget.value);
			} catch (error) {
				value = e.currentTarget.value;
			}
			inputControl.value = value as InputControlValueType<InputControlType>;
		},
		...inputControl.props,
		class: `${isCheckbox ? 'checkbox' : 'input input-bordered grow'} ${inputControl.props.class}`
	});

	let vector = $derived(
		type === 'vector' ? (inputControl.value as { x: number; y: number; z: number }) : undefined
	);
	const datastructure = $derived(inputControl.datastructure);

	function onTypeChange(k: keyof typeof socketToControl) {
		if (!inputControl.changeType) {
			console.error('Missing change type function');
			return;
		}
		inputControl.changeType(k);
		inputControl.type = socketToControl[k];
		console.debug('control type', inputControl.type);
	}

	// $inspect('InputControl:Type', inputControl.type).with(console.debug);
	let focusableInput = $state<HTMLInputElement>();
	$effect(() => {
		if (focus) {
			// console.log('Focus', focusableInput);
			focusableInput?.focus();
		}
	});
	// const options = $derived(inputControl.props.options)
</script>

<!-- TODO maybe move pointerdown stop propagation to framework agnostic logic -->
{#snippet input(props: HTMLInputAttributes = {})}
	<input
		onkeydown={(e) => {
			if (e.key === 'Enter') stopPropagation(e);
		}}
		bind:this={focusableInput}
		value={inputControl.value ?? ''}
		use:checkbox={props.type === 'checkbox'}
		ondblclick={props.type === 'checkbox' || props.type === 'number' ? stopPropagation : undefined}
		onpointerdown={stopPropagation}
		{...props}
		class="{props.class} text-base-content"
	/>
{/snippet}

{#snippet changeTypeModal()}
	<div class="flex flex-col">
		<div class="items-start grid grid-cols-[0fr,1fr] gap-2 max-w-[30rem] alert alert-warning mb-4">
			<span>Warning&nbsp;:</span>
			<span class="text-wrap">
				Changing type will get rid of unconvertible values and may break connections.</span
			>
		</div>
		<select
			class="select select-bordered"
			oninput={(e) => {
				onTypeChange(e.currentTarget.value as keyof typeof socketToControl);
				inputControl.socketType = e.currentTarget.value as keyof typeof socketToControl;
				modal.close();
			}}
		>
			{#each Object.entries(socketToControl) as [k, v] (k)}
				<option value={k} selected={k === inputControl.socketType}>{k}</option>
			{/each}
		</select>
	</div>
{/snippet}

{#if inputControl.datastructure === 'scalar'}
	{#if vector}
		<div class="vector">
			{#each ['x', 'y', 'z'] as k, i (k)}
				{@render input({
					type: 'number',
					class: `input input-bordered w-[6rem] rounded-none focus:z-10 no-spinner  ${i === 0 ? 'rounded-l-btn' : i === 2 ? 'rounded-r-btn' : ''}`,
					step: 0.01,
					value: vector[k as 'x' | 'y' | 'z'],
					oninput: (e) => {
						const res = parseFloat(e.currentTarget.value);
						if (isNaN(res)) {
							return;
						}
						inputControl.value = {
							...(inputControl.value as { x: number; y: number; z: number }),
							[k]: res
						};
					}
				})}
			{/each}
		</div>
	{:else if type === 'textarea'}
		<textarea
			use:autosize={inputControl.value}
			{...inputProps as HTMLTextareaAttributes}
			class="textarea text-start dmax-h-[20rem] min-w-[11rem] text-base-content d!overflow-hidden dhover:!overflow-y-auto break-keep"
			onkeydown={(e) => {
				if (e.key === 'Enter') stopPropagation(e);
			}}
			onscroll={(e) => {
				// Prevent area from scrolling if textarea has a scrollbar
				if (e.currentTarget.scrollHeight > e.currentTarget.clientHeight) stopPropagation(e);
			}}
			onmousewheel={(e) => {
				// Prevent area from scrolling if textarea has a scrollbar
				if (e.currentTarget.scrollHeight > e.currentTarget.clientHeight) stopPropagation(e);
			}}
			ondblclick={stopPropagation}
			onpointerdown={stopPropagation}>{inputControl.value}</textarea
		>
	{:else if type === 'select'}
		<select
			class="select select-bordered text-base-content"
			onpointerdown={stopPropagation}
			oninput={inputProps.oninput}
		>
			{#each inputControl.options ?? [] as option}
				<option value={option} selected={option === inputControl.value}>{option}</option>
			{/each}
		</select>
	{:else}
		{@render input(inputProps)}
	{/if}
{:else if datastructure === 'array'}
	{@const addRow = async () => {
		(inputControl.value as unknown[]).push(defaultInputControlValues[type]);
		// @ts-expect-error Ignore type error
		await tick();
		inputControl.onChange?.($state.snapshot(inputControl.value));
	}}
	{#snippet EditArray()}
		{@const array = inputControl.value as unknown[]}
		<div
			class="grid grid-cols-[0fr,0fr,1fr,0fr] gap-2 items-center h-[40rem] place-content-start overflow-auto py-2 pe-2"
			use:shortcut={{ key: 'Enter', action: addRow, ignoreElements: [] }}
		>
			{#each array as v, i (i)}
				<span class="text-end select-none w-6 truncate">{i}</span>
				<span class="select-none">—</span>
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class="text-center text-base-content cursor-pointer">
					<svelte:self
						data={new InputControl({
							datastructure: 'scalar',
							get socketType() {
								return inputControl.socketType;
							},
							onChange: (v) => {
								inputControl.value[i] = $state.snapshot(v);
								const res = $state.snapshot(array);
								res[i] = v;
								// @ts-expect-error Ignore type error
								inputControl.onChange?.(res);
							},
							type,
							initial: $state.snapshot(v)
						})}
						focus={true}
					/>
				</label>
				<!-- Delete row button -->
				<button
					type="button"
					title="Delete row"
					class="btn-icon"
					onclick={() => {
						array.splice(i, 1);
						inputControl.onChange?.($state.snapshot(array));
						// if (onchange) onchange(array);
					}}
				>
					<Fa icon={faTimes} class="m-auto opacity-50" />
				</button>
			{/each}
		</div>
	{/snippet}
	<button
		type="button"
		class="btn btn-outline btn-sm me-[0.25rem] dbtn-edit-datastructure text-nowrap"
		ondblclick={stopPropagation}
		onpointerdown={stopPropagation}
		onclick={() => {
			const buttons: ModalButtonSettings[] = [];
			if (inputControl.canChangeType) {
				buttons.push({
					label: 'Change type',
					level: 'warning',
					description:
						'Change the type of the array. This will lose unconvertible values and break incompatible connections.',
					onclick() {
						modal.show({
							divider: false,
							snippet: changeTypeModal,
							params: [],
							title: 'Change type',
							buttons: ['cancel']
						});
					}
				});
			}
			buttons.push({
				label: 'Add row',
				description: 'Add a new row to the array',
				level: 'neutral',
				onclick: addRow
			});
			modal.show({
				snippet: EditArray,
				get title() {
					return `Edit ${inputControl.socketType} array`;
				},
				props: {},
				buttons
				// props: {
				// 	addRow() {
				// 		(inputControl.value as []).push(defaultInputControlValues[type]);
				// 	},
				// 	get array() {
				// 		return inputControl.value as unknown[];
				// 	},
				// 	get type() {
				// 		return inputControl.type;
				// 	},

				// 	onchange: (v) => {
				// 		console.log('change', v);
				// 		if (inputControl.onChange) inputControl.onChange(v);
				// 	}
				// }
			});
		}}>Edit array</button
	><span class="text-xs ms-1 text-nowrap">Length : {(inputControl.value as []).length}</span>
{:else}
	Unsupported datastructure
{/if}

<style lang="scss">
	.vector {
		display: flex;
	}

	/*input {
		width: 100%;
		padding: 0.25rem 0.5rem;
		border-radius: 5px;
		color: black;
	}*/
	/* .vector input {
		border-radius: 0;
	} */
	input[type='checkbox'] {
		height: 1.25rem;
	}

	$btn-base-color: hsl(0, 0%, 20%);
	$btn-text-color: white;
	.btn-edit-datastructure {
		background: $btn-base-color;
		color: white;
		font-size: 0.75rem;
		border-radius: 1rem;
		margin: 0 0.25rem;
		padding: 0.5rem;
		transition: all 0.2s;

		&:hover {
			background: lighten($btn-base-color, 7%);
			// color: darken($btn-text-color, 10%);
		}

		&:active {
			background: darken($btn-base-color, 10%);
			// color: white;
		}
	}

	.no-spinner {
		appearance: textfield;
		-moz-appearance: textfield;
	}

	.no-spinner::-webkit-outer-spin-button,
	.no-spinner::-webkit-inner-spin-button {
		margin: 0;
		-webkit-appearance: none;
	}
</style>
