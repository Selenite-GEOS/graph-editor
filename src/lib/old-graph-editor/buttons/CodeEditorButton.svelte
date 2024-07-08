<script lang="ts">
	import { faFileCode } from '@fortawesome/free-solid-svg-icons';
	import EditorButton from './EditorButton.svelte';
	import { _, getContext } from '$lib/global';
	import type { CodeEditorIntegration } from '$lib/editor';
	import { onDestroy, onMount } from 'svelte';
	import { localStorageStore } from '@skeletonlabs/skeleton';
	import { writable } from 'svelte/store';
	import { browser } from '$app/environment';
	import { moonMenuVisibleStore } from '$lib/oldMenu/context-menu/moonContextMenu';
	const mainRightSideBar = getContext<'mainRightSideBar', CodeEditorIntegration>(
		'mainRightSideBar'
	);
	const editorContext = getContext('editor');

	// const codeEditorActive = writable('codeEditorActive', false);
	const codeEditorActive = writable(false);

	async function toggleCodeEditor() {
		const { CodeEditorIntegration } = await import('$lib/editor');
		if ($mainRightSideBar.component === CodeEditorIntegration) {
			$mainRightSideBar = { component: undefined };
			return;
		}
		$mainRightSideBar = {
			component: CodeEditorIntegration,
			props: { editorContext }
		};
	}

	onMount(async () => {
		if ($codeEditorActive) await toggleCodeEditor();
	});
</script>

<EditorButton
	shortcut="shift+c"
	icon={faFileCode}
	tooltip={$_('editor.button.toggle-code-editor.tooltip')}
	execNoNeedActiveFactory={() => {
		$codeEditorActive = !$codeEditorActive;
		toggleCodeEditor();
	}}
/>
