<script>
	import { faEarth } from '@fortawesome/free-solid-svg-icons';
	import EditorButton from './EditorButton.svelte';
	import { getContext } from 'svelte';
	import { notifications } from '@mantine/notifications';
	import { _ } from '$lib/global';

	const toggleGeos = getContext('toggleGeos');

	function onClick() {
		if (toggleGeos === undefined) {
			notifications.show({
				title: 'GEOS',
				message: $_('toggle-geos.failure.missing-toggle'),
				color: 'red'
			});
		} else {
			toggleGeos();
		}
	}
</script>

<EditorButton
	icon={faEarth}
	execNoNeedActiveFactory={onClick}
	tooltip={$_('editor.button.toggle-geos')}
/>
