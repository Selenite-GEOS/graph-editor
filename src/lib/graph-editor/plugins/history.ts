import type { BaseSchemes } from 'rete';
import { HistoryPlugin as BaseHistoryPlugin, type HistoryAction } from 'rete-history-plugin';
import { get, writable, type Writable } from 'svelte/store';

export class HistoryPlugin<Schemes extends BaseSchemes> extends BaseHistoryPlugin<Schemes> {
	canRedo = writable(false);
	canUndo = writable(false);
	isUndoing = false;
	isRedoing = false;
	lastMoveTime = Date.now();

	add(action: HistoryAction): void {
		// console.log('time', Date.now() - this.lastMoveTime);
		if (Date.now() - this.lastMoveTime < 100) return;
		if (this.isRedoing || this.isUndoing) return;
		// console.debug('Adding action to history', action);
		super.add(action);
		// @ts-expect-error bypass private access error
		this.canUndo.set(this.history.produced.length > 0);
		// @ts-expect-error bypass private access error
		this.canRedo.set(this.history.reserved.length > 0);
	}

	execute(action: HistoryAction): void {
		this.add(action);
		action.redo();
	}

	async undo(): Promise<void> {
		this.lastMoveTime = Date.now();
		this.isUndoing = true;
		await super.undo();
		// @ts-expect-error bypass private access error
		this.canUndo.set(this.history.produced.length > 0);
		// @ts-expect-error bypass private access error
		this.canRedo.set(this.history.reserved.length > 0);
		this.isUndoing = false;
	}

	async redo(): Promise<void> {
		this.lastMoveTime = Date.now();
		this.isRedoing = true;
		await super.redo();
		// @ts-expect-error bypass private access error
		this.canRedo.set(this.history.reserved.length > 0);
		// @ts-expect-error bypass private access error
		this.canUndo.set(this.history.produced.length > 0);
		this.isRedoing = false;
	}
}
