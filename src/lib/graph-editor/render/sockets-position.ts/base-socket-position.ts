import type { BaseSchemes, NodeId, Scope } from 'rete';
import { BaseAreaPlugin } from 'rete-area-plugin';

import type { Side } from '$graph-editor/socket';
import { SocketsPositionsStorage } from './storage';
import type { SocketPositionWatcher } from 'rete-render-utils';
import { EventEmitter } from './utils';
import type { ExpectArea2DExtra, OnChange } from './types';
import type { Position } from '@selenite/commons';

type ListenerData = {
	nodeId: string;
	side?: Side;
	key?: string;
};

/**
 * Abstract class for socket position calculation. It can be extended to implement custom socket position calculation.
 * @abstract
 * @listens render
 * @listens rendered
 * @listens unmount
 * @listens nodetranslated
 * @listens noderesized
 */
export abstract class BaseSocketPosition<Schemes extends BaseSchemes, K>
	implements SocketPositionWatcher<Scope<never, [K]>>
{
	sockets = new SocketsPositionsStorage();
	emitter = new EventEmitter<ListenerData>();
	area: BaseAreaPlugin<Schemes, ExpectArea2DExtra<Schemes>> | null = null;

	/**
	 * The method needs to be implemented that calculates the position of the socket.
	 * @param nodeId Node ID
	 * @param side Side of the socket, 'input' or 'output'
	 * @param key Socket key
	 * @param element Socket element
	 */
	abstract calculatePosition(
		nodeId: string,
		side: Side,
		key: string,
		element: HTMLElement
	): Promise<Position | null>;

	/**
	 * Attach the watcher to the area's child scope.
	 * @param scope Scope of the watcher that should be a child of `BaseAreaPlugin`
	 */
	attach(scope: Scope<never, [K]>) {
		if (this.area) return;
		if (!scope.hasParent()) return;
		this.area =
			scope.parentScope<BaseAreaPlugin<Schemes, ExpectArea2DExtra<Schemes>>>(BaseAreaPlugin);

		// eslint-disable-next-line max-statements, complexity
		this.area.addPipe(async (context) => {
			if (context.type === 'rendered' && context.data.type === 'socket') {
				const { nodeId, key, side, element } = context.data;

				const position = await this.calculatePosition(nodeId, side, key, element);

				if (position) {
					this.sockets.add({ nodeId, key, side, element, position });
					this.emitter.emit({ nodeId, key, side });
				}
			} else if (context.type === 'unmount') {
				this.sockets.remove(context.data.element);
			} else if (context.type === 'nodetranslated') {
				this.emitter.emit({ nodeId: context.data.id });
			} else if (context.type === 'noderesized') {
				const { id: nodeId } = context.data;

				await Promise.all(
					this.sockets
						.snapshot()
						.filter((item) => item.nodeId === context.data.id)
						.map(async (item) => {
							const { side, key, element } = item;
							const position = await this.calculatePosition(nodeId, side, key, element);

							if (position) {
								item.position = position;
							}
						})
				);
				this.emitter.emit({ nodeId });
			} else if (context.type === 'render' && context.data.type === 'connection') {
				const { source, target } = context.data.payload;
				const nodeId = source || target;

				this.emitter.emit({ nodeId });
			}
			return context;
		});
	}

	/**
	 * Listen to socket position changes. Usually used by rendering plugins to update the start/end of the connection.
	 * @internal
	 * @param nodeId Node ID
	 * @param side Side of the socket, 'input' or 'output'
	 * @param key Socket key
	 * @param change Callback function that is called when the socket position changes
	 */
	listen(nodeId: NodeId, side: Side, key: string, change: OnChange) {
		const unlisten = this.emitter.listen((data: ListenerData) => {
			if (data.nodeId !== nodeId) return;
			if ((!data.key || data.side === side) && (!data.side || data.key === key)) {
				const position = this.sockets.getPosition({ side, nodeId, key });

				if (!position) return;

				const { x, y } = position;
				const nodeView = this.area?.nodeViews.get(nodeId);

				if (nodeView)
					change({
						x: x + nodeView.position.x,
						y: y + nodeView.position.y
					});
			}
		});

		this.sockets.snapshot().forEach((data) => {
			if (data.nodeId === nodeId) this.emitter.emit(data);
		});
		return unlisten;
	}
}
