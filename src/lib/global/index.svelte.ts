import { readable, type Readable } from 'svelte/store';
import { get } from 'svelte/store';
import type { GeosSchema } from '$lib/geos';
import type { Action } from 'svelte/action';
import { notifications } from '$graph-editor/plugins/notifications';
export { notifications } from '$graph-editor/plugins/notifications';
export { getContext } from 'svelte';
export type NewGeosContext = { geosSchema: GeosSchema };

export const themes = [
	'light',
	'dark',
	'cupcake',
	'bumblebee',
	'emerald',
	'corporate',
	'synthwave',
	'retro',
	'cyberpunk',
	'valentine',
	'halloween',
	'garden',
	'forest',
	'aqua',
	'lofi',
	'pastel',
	'fantasy',
	'wireframe',
	'black',
	'luxury',
	'dracula',
	'cmyk',
	'autumn',
	'business',
	'acid',
	'lemonade',
	'night',
	'coffee',
	'winter',
	'dim',
	'nord',
	'sunset'
] as const;

export const darkThemes = [
	'dark',
	'synthwave',
	'halloween',
	'forest',
	'black',
	'luxury',
	'dracula',
	'business',
	'night',
	'coffee',
	'dim',
	'sunset'
] as (typeof themes)[number][];
class ThemeControl {
	get theme() {
		return this.themes[this.#themeIndex];
	}
	set theme(theme: string) {
		const i = this.themes.findIndex((t) => t === theme);
		if (i === -1) {
			console.warn('Tried to set an invalid theme.');
			return;
		}
		this.#themeIndex = i;
		// if (typeof window !== 'undefined') {
		localStorage.setItem('theme', this.themes[i]);
		document.body.dataset.theme = this.themes[i];
		// }
	}
	constructor() {
		this.theme = localStorage.getItem('theme') ?? 'dark';
	}
	themes = $state(themes);
	#themeIndex = $state(0);
	previousTheme = $derived(
		this.themes[(this.themes.length + this.#themeIndex - 1) % this.themes.length]
	);
	nextTheme = $derived(this.themes[(this.#themeIndex + 1) % this.themes.length]);
	isLight = $derived(!darkThemes.includes(this.theme as (typeof darkThemes)[number]));
}

export const themeControl = new ThemeControl();
export const keyboardShortcut: Action = () => {};

export const _ = readable<(msg: string) => string>((msg) => {
	const msgs: Record<string, string> = {
		'editor.default-name': 'New editor',
		'notifications.error.title': 'Error'
	};

	return msgs[msg] ?? msg;
});

export function getModalStore() {
	console.warn('Not implemented');
	return undefined;
}

export class ErrorWNotif extends Error {
	constructor(
		params:
			| {
					title?: string;
					message?: string;
					emessage: string;
			  }
			| string
	) {
		let title, msg, emsg;
		if (typeof params === 'string') emsg = params;
		else ({ title, message: msg, emessage: emsg } = params);

		super(emsg);
		const browser = typeof window !== 'undefined';
		if (browser)
			notifications.show({
				title: title ?? get(_)('notifications.error.title'),
				message: msg ?? emsg,
				color: 'red'
			});
	}
}
