import { SvelteSet } from 'svelte/reactivity';

const FAVORITES_KEY = 'favoriteGraphsIds';

export class FavoritesManager {
	static #instance: FavoritesManager | undefined = undefined;
	static get instance() {
		if (!this.#instance) {
			this.#instance = new FavoritesManager();
		}
		return this.#instance;
	}

	private constructor() {
		const favorites = localStorage.getItem(FAVORITES_KEY);
		if (favorites) {
			this.#favorites = new SvelteSet(JSON.parse(favorites));
		}
	}

	#favorites = new SvelteSet<string>();

	setFavorite(id: string, value: boolean) {
		if (value) {
			this.#favorites.add(id);
		} else {
			this.#favorites.delete(id);
		}
		this.saveFavorites();
	}

	favorites = $derived(Array.from(this.#favorites))

	static setFavorite(id: string, value: boolean) {
		this.instance.setFavorite(id, value);
	}

	isFavorite(id: string) {
		return this.#favorites.has(id);
	}

	static isFavorite(id: string) {
		return this.instance.isFavorite(id);
	}

	clearFavorites() {
		this.#favorites.clear();
		this.saveFavorites();
	}

	static clearFavorites() {
		this.instance.clearFavorites();
	}

	protected saveFavorites() {
		const favs = Array.from(this.#favorites);
		console.debug('Saving favorites', favs);
		localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
	}
}
