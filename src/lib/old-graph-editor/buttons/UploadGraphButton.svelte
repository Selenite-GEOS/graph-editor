<script lang="ts">
	import { faCloud } from '@fortawesome/free-solid-svg-icons';
	import EditorButton from './EditorButton.svelte';
	import { _ } from '$lib/global/index.svelte';
	import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
	import type { UploadGraphModalMeta } from '$lib/modals/types';
	import type { ButtonExec } from '.';

	const modalStore = getModalStore();

	let openUploadGraphModal: ButtonExec = ({ editor }) => {
		const modal: ModalSettings = {
			type: 'component',
			component: 'uploadGraphModal',
			meta: { editor } as UploadGraphModalMeta
		};
		modalStore.trigger(modal);
	};
</script>

<EditorButton
	icon={faCloud}
	exec={openUploadGraphModal}
	tooltip={$_('editor.button.upload-graph.tooltip')}
/>
