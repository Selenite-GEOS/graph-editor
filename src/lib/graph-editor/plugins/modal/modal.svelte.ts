import type { Component, Snippet } from 'svelte';

type ButtonLevel = 'primary' | 'secondary' | 'danger' | 'neutral' | 'warning';
export type ModalSettings<Props extends Record<string, any> = {}, Params extends unknown[] = []> = {
	title?: string;
	buttons?: (
		| {
				level?: ButtonLevel;
				label: string;
				onclick: () => void;
		  }
		| 'cancel'
	)[];
} & ({ component: Component<Props>; props: Props } | { snippet: Snippet<Params>; params: Params });
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
		console.debug('Show modal');
		this.queue.push(params as unknown as ModalSettings);
	}

	close() {
		console.debug('Close modal');
		this.queue.pop();
	}
}
