<script lang="ts">
	import { faCubes } from '@fortawesome/free-solid-svg-icons';
	import EditorButton from './EditorButton.svelte';
	import type { NodeEditor } from '$rete/NodeEditor';

	// export let editor: NodeEditor;

	function openDrawer() {
		console.log('open drawer');
	}
</script>

<EditorButton onClick={openDrawer} icon={faCubes} />
