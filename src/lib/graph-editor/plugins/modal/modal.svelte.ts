import type { Component } from 'svelte';

type ButtonLevel = 'primary' | 'secondary' | 'danger' | 'neutral' | 'warning';
export type ModalSettings<Props extends Record<string, any> = {}> = {
	component: Component<Props>;
	props: Props;
	title?: string;
    buttons?: {
        level?: ButtonLevel,
        label: string,
        onclick: () => void;
    }[];
};
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
		console.log('Show modal');
		this.queue.push(params as unknown as ModalSettings);
	}

	close() {
		console.log('Close modal');
		this.queue.pop();
	}
}
