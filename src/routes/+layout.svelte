<script>
	import NotificationsComponent from '$graph-editor/plugins/notifications/NotificationsComponent.svelte';
	import { ContextMenu, ModalComponent } from '@selenite/commons';
	import '../app.css';
</script>

<svelte:head><title>Graph Editor</title></svelte:head>
<ModalComponent />
<NotificationsComponent />
<ContextMenu />
<div class="h-screen w-screen overflow-clip">
	<slot />
</div>
