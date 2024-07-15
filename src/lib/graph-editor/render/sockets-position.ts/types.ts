import type { Side } from '$graph-editor/socket';
import type { Position } from '@selenite/commons';
import type { BaseSchemes, NodeId } from 'rete';


export type OnChange = (data: Position) => void;

/**
 * Interface for socket position watcher.
 */
export type SocketPositionWatcher<ChildScope> = {
	/** Attach the watcher to the area's child scope. */
	attach(area: ChildScope): void;
	/**
	 * Listen to the socket position changes.
	 * @param nodeId Node ID
	 * @param side Side of the socket, 'input' or 'output'
	 * @param key Socket key
	 * @param onChange Callback that is called when the socket position changes
	 * @returns Function that removes the listener
	 */
	listen(nodeId: NodeId, side: Side, key: string, onChange: OnChange): () => void;
};

export type RenderMeta = { filled?: boolean };
export type RenderSignal<Type extends string, Data> =
	| { type: 'render'; data: { element: HTMLElement; type: Type } & RenderMeta & Data }
	| { type: 'rendered'; data: { element: HTMLElement; type: Type } & Data };


export type ExpectArea2DExtra<Schemes extends BaseSchemes> =
	| RenderSignal<
			'socket',
			{
				nodeId: string;
				key: string;
				side: Side;
			}
	  >
	| RenderSignal<'connection', { payload: Schemes['Connection']; start?: Position; end?: Position }>
	| { type: 'unmount'; data: { element: HTMLElement } }
	| { type: 'noderesized'; data: { id: string } }
	| { type: 'nodetranslated'; data: { id: string; position: any } };
