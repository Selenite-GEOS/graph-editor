<script lang="ts">
	import {
		isComponentModalSettings,
		isPromptModalSettings,
		isSnippetModalSettings,
		Modal	} from './modal.svelte';

	const modals = Modal.instance;
	let dialog = $state<HTMLDialogElement>();
	let lastModal = $derived(modals.queue.at(-1));
	let title = $derived(lastModal?.title);

	$effect(() => {
		if (!dialog) return;
		if (modals.queue.length > 0) {
			dialog.showModal();
		}
	});
</script>

{#if lastModal}
	<dialog bind:this={dialog} class="modal" onclose={() => modals.close()}>
		<div class="modal-box">
			{#if title}
				{#if typeof title === 'string'}
					<h1 class="font-bold">{title}</h1>
				{:else}
					{@render title()}
				{/if}
			{/if}
			<div bind:this={Modal.instance.contentContainer}>
				{#if isComponentModalSettings(lastModal)}
					<lastModal.component bind:this={modals.childComponent} {...lastModal?.props} modal={lastModal} />
				{:else if isSnippetModalSettings(lastModal)}
					{@render lastModal.snippet(lastModal.props)}
				{:else if isPromptModalSettings(lastModal)}
					<input
						value={lastModal.initial}
						bind:this={modals.promptInput}
						placeholder="New value"
						class="input input-bordered w-full"
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								lastModal.response?.(modals.promptInput?.value);
								modals.close();
							}
						}}
					/>
				{/if}
			</div>
			{#if modals.resolvedButtons}
				{#if lastModal.divider ?? true}
					<div class="divider !mt-9"></div>
				{/if}
				<div class="modal-action">
					{#each modals.resolvedButtons as button}
						<button
							title={button.description}
							class:btn-primary={button.level === 'primary'}
							class:btn-secondary={button.level === 'secondary'}
							class:btn-neutral={button.level === 'neutral'}
							class:btn-warning={button.level === 'warning'}
							class:btn-error={button.level === 'danger'}
							class="btn btn-neutral"
							onclick={() => button.onclick()}>{button.label}</button
						>
					{/each}
				</div>
			{/if}
		</div>
		<form method="dialog" class="backdrop">
			<button></button>
		</form>
	</dialog>
{/if}

<style lang="scss">
	form[method='dialog'] {
		button {
			width: 100%;
			height: 100%;
		}
	}

	.divider {
		height: 1px;
		// background-color: #2d3748;
		// background-color: oklch(var(--bc) / 0.3);
		margin: 1rem 0;
	}
	.modal-box {
		min-width: 30rem;
		// background-color: #1d232a;
		overflow-x: visible !important;
		padding: 1.5rem;
		border-radius: 1rem;
		// color: white;

		h1 {
			font-size: 1.5rem;
			margin-bottom: 1rem;
		}
	}
	.modal {
		margin: 0;
		transition: all 0.2s;
		// color: white;
		position: fixed;
		max-height: none;
		max-width: none;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
		display: grid;
		align-items: center;
		justify-items: center;
		background: none;
	}
	.backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		z-index: -1;
	}
</style>
