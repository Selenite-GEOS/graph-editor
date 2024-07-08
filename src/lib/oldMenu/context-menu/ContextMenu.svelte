<script lang="ts">
	import { popup } from '@skeletonlabs/skeleton';
	import type { PopupSettings } from '@skeletonlabs/skeleton';

	const popupClick: PopupSettings = {
		event: 'click',
		target: 'popupClick',
		placement: 'top'
	};
</script>

<button class="btn variant-filled" use:popup={popupClick}> Click </button>

<div class="card p-4 variant-filled-primary" data-popup="popupClick">
	<slot />
	<div class="arrow variant-filled-primary" />
</div>
