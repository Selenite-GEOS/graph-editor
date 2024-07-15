<script lang="ts">
	import { faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
	import { notifications } from '@mantine/notifications';
	import { _, getContext } from '$lib/global/index.svelte';
	import EditorButton from './EditorButton.svelte';
	import { getLocalStorageUsagePercent as getLocalStorageUsage } from '$utils/localStorage';
	import { ErrorWNotif } from '$lib/global/error';

	const onSave = getContext('onSave');

	function saveGraph() {
		if (onSave === undefined) throw new ErrorWNotif({ emessage: 'onSave not defined' });
		onSave();
	}
</script>

<EditorButton
	execNoNeedActiveFactory={saveGraph}
	icon={faFloppyDisk}
	tooltip={$_('editor.button.save')}
/>
