<script lang="ts">
	import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
	import { popup, type PopupSettings } from '@skeletonlabs/skeleton';
	import Fa, { type IconSize } from 'svelte-fa';
	import type { ButtonExec, ButtonExecNoNeedFactory } from '.';
	import { ErrorWNotif, getContext, _, keyboardShortcut } from '$lib/global';
	import newLocalId from 'locally-unique-id-generator';
	import { fade, scale } from 'svelte/transition';

	import type { ComponentProps } from 'svelte';
	export let shortcut: string | undefined = undefined;

	$: shortcutComponents = shortcut?.split('+').map((t) => t.toLowerCase());
	$: ctrl = shortcutComponents?.includes('ctrl');
	$: shift = shortcutComponents?.includes('shift');
	$: alt = shortcutComponents?.includes('alt');
	$: key = shortcutComponents?.find((t) => !['ctrl', 'shift', 'alt'].includes(t));
	export let icon: IconDefinition;
	export let shortcutTooltip: string | false = false;
	export let active = false;
	export let tooltip = 'Missing tooltip';
	export let exec: ButtonExec | undefined = undefined;
	export let execNoNeedActiveFactory: ButtonExecNoNeedFactory | undefined = undefined;

	const editorContext = getContext('editor');

	const target = 'buttonTooltip-' + newLocalId();
	const popupHover: PopupSettings = {
		event: 'hover',
		target: target,
		placement: 'bottom'
	};

	async function onExec() {
		if (!exec && !execNoNeedActiveFactory)
			throw new ErrorWNotif({
				emessage: 'Missing exec function',
				message: $_('editor.button.error.no_exec_function')
			});
		if (execNoNeedActiveFactory) await execNoNeedActiveFactory();
		if (!exec) return;

		if (!editorContext) throw new ErrorWNotif({ emessage: 'Missing editor context' });

		const factory = editorContext.getActiveFactory();

		if (!factory)
			throw new ErrorWNotif({
				emessage: 'Missing active factory',
				message: $_('editor.button.error.no_active_factory')
			});
		const editorViewport = editorContext.getEditorViewport();
		if (!editorViewport)
			throw new ErrorWNotif({
				emessage: 'Missing editor viewport'
			});

		if (exec) await exec({ editor: factory.getEditor(), factory, editorViewport });
	}
	export let variant = 'variant-ghost-secondary';
	/**
	 * Classes to style the button
	 * @type {string}
	 */
	export let button = 'btn-icon';
	export let iconSize: IconSize | undefined = undefined;
	export let iconProps: ComponentProps<Fa> = { icon, size: iconSize };
</script>

<div class="card p-4 variant-filled-secondary" data-popup={target}>
	<p>{tooltip}</p>
	{#if shortcutTooltip}
		<small>({shortcutTooltip})</small>
	{/if}
	<div class="arrow variant-filled-secondary" />
</div>
<button
	use:keyboardShortcut={{ key, alt, ctrl, shift, action: onExec }}
	use:popup={popupHover}
	on:click={onExec}
	class="{button} [&>*]:pointer-events-none {active
		? 'variant-ghost-success'
		: variant} pointer-events-auto"><Fa {...iconProps} /></button
>
