<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import {
		isComponentModalSettings,
		isPromptModalSettings,
		isSnippetModalSettings,
		Modal,
		type ComponentModalSettings,
		type ModalButton
	} from './modal.svelte';

	let contentContainer = $state<HTMLElement>();
	let childComponent = $state<
		SvelteComponent & { getResponse?: () => Promise<unknown> | unknown }
	>();
	const modals = Modal.instance;
	let dialog = $state<HTMLDialogElement>();
	let lastModal = $derived(modals.queue.at(-1));
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
								onclick: () => modals.close()
							};
						case 'close':
							return {
								label: 'Close',
								level: 'neutral',
								onclick: () => modals.close()
							};
						case 'submit':
							return {
								label: 'Submit',
								level: 'primary',
								onclick: async () => {
									if (contentContainer) {
										const forms = contentContainer.querySelectorAll('form');
										for (const form of forms) if (!form.reportValidity()) return;
									}
									const r = await childComponent?.getResponse?.();
									lastModal?.response?.(r);
									modals.close();
								}
							};
						case 'promptConfirm':
							return {
								label: 'Confirm',
								level: 'primary',
								onclick: () => {
									lastModal?.response?.(promptInput?.value);
									modals.close();
								}
							};
						default:
							if ('formId' in btn) {
								return {
									label: 'Submit',
									level: 'primary',
									onclick: () => {
										const form = document.getElementById(btn.formId) as HTMLFormElement;
										if (form) {
											form.requestSubmit();
										}
									}
								};
							}
							return btn;
					}
				})
	);
	$effect(() => {
		if (!dialog) return;
		if (modals.queue.length > 0) {
			dialog.showModal();
		}
	});
	let promptInput = $state<HTMLInputElement>();
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
			<div bind:this={contentContainer}>
				{#if isComponentModalSettings(lastModal)}
					<lastModal.component bind:this={childComponent} {...lastModal?.props} modal={lastModal} />
				{:else if isSnippetModalSettings(lastModal)}
					{@render lastModal.snippet(lastModal.props)}
				{:else if isPromptModalSettings(lastModal)}
					<input
						value={lastModal.initial}
						bind:this={promptInput}
						placeholder="New value"
						class="input input-bordered w-full"
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								lastModal.response?.(promptInput?.value);
								modals.close();
							}
						}}
					/>
				{/if}
			</div>
			{#if resolvedButtons}
				{#if lastModal.divider ?? true}
					<div class="divider !mt-9"></div>
				{/if}
				<div class="modal-action">
					{#each resolvedButtons as button}
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
