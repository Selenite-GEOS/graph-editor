<script>
	import { ContextMenuComponent } from '$graph-editor';
	import { ModalComponent } from '$graph-editor/plugins/modal';
	import NotificationsComponent from '$graph-editor/plugins/notifications/NotificationsComponent.svelte';
	import '../app.css';
</script>

<ModalComponent />
<NotificationsComponent />
<ContextMenuComponent />
<div class="h-screen w-screen overflow-clip">
	<slot />
</div>
