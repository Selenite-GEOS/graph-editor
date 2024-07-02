<script lang="ts">
	import type { Action } from 'svelte/action';
	import {
		ArrangeLayoutButton,
		CodeEditorButton,
		DownloadGraphButton,
		LoadGraphFromFileButton,
		SaveGraphButton,
		ToPythonButton,
		ToggleGeosButton,
		UploadGraphButton
	} from '.';

	const pointerEventsOnlyOnOverflow: Action = (node) => {
		node.classList.add('pointer-events-none');
		const resizeObserver = new ResizeObserver((entries) => {
			if (node.scrollWidth > node.clientWidth) node.classList.add('pointer-events-auto');
			else node.classList.remove('pointer-events-auto');
		});
		resizeObserver.observe(node);
		return {
			destroy() {
				resizeObserver.unobserve(node);
			}
		};
	};
</script>

<div
	use:pointerEventsOnlyOnOverflow
	class="flex
 w-full justify-between overflow-x-auto gap-4"
>
	<div class="flex gap-4">
		<SaveGraphButton />
		<LoadGraphFromFileButton />
		<!-- <ToPythonButton /> -->
		<ArrangeLayoutButton />
	</div>
	<div class="flex gap-4">
		<DownloadGraphButton />
		<UploadGraphButton />
		<CodeEditorButton />
		<!-- <ToggleGeosButton /> -->
	</div>
</div>
