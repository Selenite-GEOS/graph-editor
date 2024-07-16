<script>
	import { ModalComponent } from '$graph-editor/plugins/modal';
	import NotificationsComponent from '$graph-editor/plugins/notifications/NotificationsComponent.svelte';
	import '../app.css';
</script>

<ModalComponent />
<NotificationsComponent/>
<div class="h-screen w-screen">
	<slot />
</div>
