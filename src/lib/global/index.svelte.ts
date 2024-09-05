import { readable, type Readable } from 'svelte/store';
import { get } from 'svelte/store';
import type { GeosSchema } from '$lib/geos';
import type { Action } from 'svelte/action';
import { notifications } from '$graph-editor/plugins/notifications';
import { browser, isBrowser } from '@selenite/commons';
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
	'aqua',
	'cyberpunk',
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
		if (isBrowser()) {
			localStorage.setItem('theme', this.themes[i]);
			document.body.dataset.theme = this.themes[i];
		}
	}

	getThemeIndex(theme?: string | null) {
		if (!theme) return undefined;
		const i = this.themes.findIndex((t) => t === theme);
		if (i !== -1) return i;
		return undefined;
	}

	themes = $state(themes);
	defaultDarkMode = $state('dim');
	defaultLightMode = $state('winter');
	#themeIndex = $state(0);
	constructor() {
		if (browser) {
			this.#themeIndex =
				this.getThemeIndex(localStorage.getItem('theme')) ??
				this.getThemeIndex(
					window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
						? this.defaultDarkMode
						: this.defaultLightMode
				) ??
				0;
			document.body.dataset.theme = this.themes[this.#themeIndex];
			if (typeof window.matchMedia === 'function')
				window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
					console.log('pizza', this.isDefault());
					if (this.isDefault()) {
						this.#themeIndex =
							this.getThemeIndex(event.matches ? this.defaultDarkMode : this.defaultLightMode) ?? 0;
						document.body.dataset.theme = this.themes[this.#themeIndex];
					}
				});
		} else this.#themeIndex = this.getThemeIndex(this.defaultDarkMode) ?? 0;
	}

	isDefault() {
		return browser ? localStorage.getItem('theme') === null : true;
	}

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
