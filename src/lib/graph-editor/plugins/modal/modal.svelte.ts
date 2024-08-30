import type { Component, Snippet } from 'svelte';

type ButtonLevel = 'primary' | 'secondary' | 'danger' | 'neutral' | 'warning';

export type ModalButton = {
			level?: ButtonLevel;
			label: string;
			description?: string;
			onclick: () => void;
	  }
export type ModalButtonSettings =
	ModalButton 
	| 'cancel'
	| 'close';
export type BaseModalSettings = {
	title?: string | Snippet;
	buttons?: ModalButtonSettings[];
};

export type ComponentModalSettings<Props extends Record<string, any> = {}> = {
	component: Component<Props & { modal: ComponentModalSettings }>;
	props: Props;
} & BaseModalSettings;

export type SnippetModalSettings<Props extends Record<string, any> = {}> = {
	snippet: Snippet<[Props]>;
	props: Props;
} & BaseModalSettings;

export type ModalSettings<Props extends Record<string, any> = {}> =
	| ComponentModalSettings<Props>
	| SnippetModalSettings<Props>;

export function isComponentModalSettings<Props extends Record<string, any>>(
	modal: ModalSettings<Props>
): modal is ComponentModalSettings<Props> {
	return 'component' in modal;
}
export function isSnippetModalSettings<Props extends Record<string, any>>(
	modal: ModalSettings<Props>
): modal is SnippetModalSettings<Props> {
	return 'snippet' in modal;
}

/**
 * Singleton that manages modals.
 *
 * The singleton can be accessed with `Modal.instance`.
 */
export class Modal {
	static #instance: Modal | undefined;
	static get instance(): Modal {
		if (!this.#instance) {
			this.#instance = new Modal();
		}
		return this.#instance;
	}

	queue: ModalSettings[] = $state([]);

	private constructor() {}

	show<Props extends Record<string, any>>(params: ModalSettings<Props>) {
		console.debug('Show modal', params);
		this.queue.push(params as unknown as ModalSettings);
	}

	close() {
		console.debug('Close modal');
		this.queue.pop();
	}
}

export const modals = Modal.instance;