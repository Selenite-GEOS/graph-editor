<script lang="ts">
	import { faDownload } from '@fortawesome/free-solid-svg-icons';
	import { type ButtonExec, EditorButton } from '$lib/editor/buttons';
	import { _ } from '$lib/global/index.svelte';

	const downloadGraph: ButtonExec = ({ editor }) => {
		// notifications.show({title: 'Download', message: 'Downloading graph...'});

		const content = JSON.stringify(editor);

		const blob = new Blob([content], { type: 'text/plain' });

		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = editor.name + '.txt';
		link.click();

		URL.revokeObjectURL(link.href);
		link.remove();
	};
</script>

<EditorButton
	exec={downloadGraph}
	icon={faDownload}
	tooltip={$_('editor.button.downloadGraph.tooltip')}
/>
