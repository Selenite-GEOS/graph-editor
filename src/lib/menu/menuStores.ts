import { type Writable, writable } from 'svelte/store';
import type { IMenuItem } from './types';

export const addNodeMenu: Writable<IMenuItem[]> = writable([]);
