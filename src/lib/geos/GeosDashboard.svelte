<script lang="ts">
	import { _ } from '$lib/global/index.svelte';
	import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
	import { capitalize, words } from '$utils/string';

	let selectedJobs: number[] = [];
	export let card = '';
	export let padding = 'py-8 px-12';
	export let variant = '';
	export let width = 'w-full sm:w-4/5 md:w-2/3 lg:w-7/12 xl:w-5/12';
</script>

<div class="w-full flex justify-center items-start p-4">
	<div
		class=" text-center card variant-soft-surface
         {width} flex justify-center items-start
        {card} min-w-fit {padding} w-full {variant}"
	>
		<div class="prose dark:prose-invert space-y-6 flex flex-col justify-start items-center w-full">
			<h1 class="mb-2">GEOS</h1>
			<div class="text-start w-full">
				<div>
					<h2 class="mt-0">{capitalize($_('geos.dash.source'))}</h2>
					<select class="select pointer-events-auto">
						<option value="1">Source 1</option>
						<option value="2">Source 2</option>
						<option value="3">Source 3</option>
					</select>
				</div>
				<div>
					<h2>{capitalize($_('geos.dash.job_queue'))}</h2>
					<!-- <select class="select pointer-events-auto" multiple size="3">
						<option value="1">Job 1</option>
						<option value="2">Job 2</option>
						<option value="3">Job 3</option>
					</select> -->
					<div
						class="card p-4 pointer-events-auto variant-ringed select-none bg-surface-200-700-token transition duration-150 ease-in-out"
					>
						<div class="overflow-y-auto h-40 pe-3">
							<ListBox
								multiple
								rounded="rounded-container-token"
								hover="hover:bg-gradient-to-tr hover:variant-gradient-secondary-tertiary"
							>
								<div class="bg-surface-50-900-token rounded-container-token">
									<ListBoxItem bind:group={selectedJobs} name="job" value="1">Job 1</ListBoxItem>
								</div>
								<div class="bg-surface-50-900-token rounded-container-token">
									<ListBoxItem bind:group={selectedJobs} name="job" value="2">Job 2</ListBoxItem>
								</div>
								<div class="bg-surface-50-900-token rounded-container-token">
									<ListBoxItem bind:group={selectedJobs} name="job" value="3">Job 3</ListBoxItem>
								</div>
								<div class="bg-surface-50-900-token rounded-container-token">
									<ListBoxItem bind:group={selectedJobs} name="job" value="4">Job 4</ListBoxItem>
								</div>
							</ListBox>
						</div>
					</div>
				</div>
			</div>
			<button class="btn variant-filled-surface mx-auto pointer-events-auto select-none"
				>{words($_('geos.dash.new_job.btn'))}</button
			>
		</div>
	</div>
</div>
