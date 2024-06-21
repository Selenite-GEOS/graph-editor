import type { BaseSchemes } from "rete";
import {
  HistoryPlugin as BaseHistoryPlugin,
  type HistoryAction,
} from "rete-history-plugin";
import { get, writable } from "svelte/store";

export class HistoryPlugin<
  Schemes extends BaseSchemes,
> extends BaseHistoryPlugin<Schemes> {
  canRedo = writable(false);
  canUndo = writable(false);
  isUndoing = false;
  isRedoing = false;
  lastMoveTime = Date.now();

  add(action: HistoryAction): void {
    console.log("time", Date.now() - this.lastMoveTime);
    if (Date.now() - this.lastMoveTime < 100) return;
    if (this.isRedoing || this.isUndoing) return;
    console.log("Adding action to history", action);
    super.add(action);
    this.canUndo.set(this.history.produced.length > 0);
    this.canRedo.set(this.history.reserved.length > 0);
  }

  async undo(): Promise<void> {
    this.lastMoveTime = Date.now();
    this.isUndoing = true;
    await super.undo();
    this.canUndo.set(this.history.produced.length > 0);
    this.canRedo.set(this.history.reserved.length > 0);
    this.isUndoing = false;
  }

  async redo(): Promise<void> {
    this.lastMoveTime = Date.now();
    this.isRedoing = true;
    await super.redo();
    this.canRedo.set(this.history.reserved.length > 0);
    this.canUndo.set(this.history.produced.length > 0);
    this.isRedoing = false;
  }
}
