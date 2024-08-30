<script lang="ts">
	import { isComponentModalSettings, isSnippetModalSettings, Modal, type ModalButton } from './modal.svelte';

	const modal = Modal.instance;
	let dialog = $state<HTMLDialogElement>();
	let lastModal = $derived(modal.queue.at(-1));
	let title = $derived(lastModal?.title);
	let buttons = $derived(lastModal?.buttons);
	let resolvedButtons: ModalButton[] | undefined = $derived(
		buttons === undefined
			? undefined
			: buttons.map((btn) => {
					switch (btn) {
						case 'cancel':
							return {
								label: 'Cancel',
								onclick: () => modal.close()
							};
						case 'close': 
							return {
								label: 'Close',
								level: 'neutral',
								onclick: () => modal.close()
							};
							
						default:
							return btn;
					}
				})
	);
	$effect(() => {
		if (!dialog) return;
		if (modal.queue.length > 0) {
			dialog.showModal();
		}
	});
</script>

{#if lastModal}
	<dialog bind:this={dialog} class="modal" onclose={() => modal.close()}>
		<div class="modal-box">
			{#if title}
				{#if typeof title === 'string'}
					<h1>{title}</h1>
				{:else}
					{@render title()}
				{/if}
			{/if}
			<div>
				{#if isComponentModalSettings(lastModal)}
					<lastModal.component {...lastModal?.props} modal={lastModal} />
				{:else if isSnippetModalSettings(lastModal)}
					{@render lastModal.snippet(lastModal.props)}
				{/if}
			</div>
			{#if resolvedButtons}
				<div class="divider"></div>
				<div class="modal-buttons modal-action">
					{#each resolvedButtons as button}
						<button
						title={button.description}
						class:btn-primary={button.level === 'primary'}
						class:btn-secondary={button.level === 'secondary'}
						class:btn-neutral={button.level === 'neutral'}
						class:btn-warning={button.level === 'warning'}
						class:btn-error={button.level === 'danger'}
						 class="btn btn-neutral" onclick={() => button.onclick()}>{button.label}</button>
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
	.modal-buttons {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
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
