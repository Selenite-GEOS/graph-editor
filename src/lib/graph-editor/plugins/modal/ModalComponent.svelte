<script lang="ts">
	import { isComponentModalSettings, isSnippetModalSettings, Modal } from './modal.svelte';

	const modal = Modal.instance;
	let dialog = $state<HTMLDialogElement>();
	let lastModal = $derived(modal.queue.at(-1));
	let title = $derived(lastModal?.title);
	let buttons = $derived(lastModal?.buttons);
	let resolvedButtons = $derived(
		buttons === undefined
			? undefined
			: buttons.map((btn) => {
					switch (btn) {
						case 'cancel':
							return {
								label: 'Cancel',
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
				<h1>{title}</h1>
			{/if}
			<div class="text-base-content">
			{#if isComponentModalSettings(lastModal)}
				<svelte:component this={lastModal.component} {...lastModal.props} />
			{:else if isSnippetModalSettings(lastModal)}
				{@render lastModal.snippet(lastModal.props)}
			{/if}
			</div>
			{#if resolvedButtons}
				<div class="divider"></div>
				<div class="modal-buttons">
					{#each resolvedButtons as button}
						<button class="modal-button" onclick={() => button.onclick()}>{button.label}</button>
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
	.modal-button {
		background-color: #2d3748;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;

		&:hover {
			background-color: #4a5568;
		}
		&:active {
			background-color: #2d3748;
		}
	}
	.divider {
		height: 1px;
		background-color: #2d3748;
		margin: 1rem 0;
	}
	.modal-box {
		min-width: 30rem;
		background-color: #1d232a;
		padding: 1.5rem;
		border-radius: 1rem;
		color: white;

		h1 {
			font-size: 1.5rem;
			margin-bottom: 1rem;
		}
	}
	.modal {
		margin: 0;
		transition: all 0.2s;
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
