import { NodeComponent, type NodeComponentParams } from '$graph-editor/components';
import type { Connection } from '../Node.svelte';

export type ConnectionTrackerCallback = (conn: Connection, type: 'creation' | 'removal') => unknown;
export type ConnectionTrackerParams = NodeComponentParams & {
	onOutConnectionChange?: ConnectionTrackerCallback;
	onInConnectionChange?: ConnectionTrackerCallback;
};
export class ConnectionTrackerComponent extends NodeComponent {
	constructor(params: ConnectionTrackerParams) {
		const { owner } = params;
		super({ owner });

		const factory = owner.factory;
		if (!factory) {
			console.warn("Can't setup connection tracking pipe safely, missing factory. Skipping.");
			return;
		}

		const pipeState = factory.useState('connectionTracker', 'pipeSetup', false);
		/** Map node ids to callbacks. */
		const trackedNodes = factory.getState(
			'connectionTracker',
			'trackedNodes',
			new Map<string, ConnectionTrackerParams>()
		);
		trackedNodes.set(owner.id, params);
		if (!pipeState.value) {
			pipeState.value = true;
			console.log('Setting up connection tracking pipe.');
			factory.editor.addPipe((ctx) => {
				if (ctx.type !== 'connectioncreated' && ctx.type !== 'connectionremoved') return ctx;
				const { source, target } = ctx.data;
                const type = ctx.type === 'connectioncreated' ? 'creation' : 'removal';
				trackedNodes.get(source)?.onOutConnectionChange?.(ctx.data, type);
				trackedNodes.get(target)?.onInConnectionChange?.(ctx.data, type);

				return ctx;
			});
		}
	}
}
