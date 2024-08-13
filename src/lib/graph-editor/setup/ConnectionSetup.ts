import type { NodeEditor, NodeFactory } from '$graph-editor/editor';
import type { AreaExtra } from '$graph-editor/area';
import type { Schemes } from '$graph-editor/schemes';
import type { AreaPlugin } from 'rete-area-plugin';
import { SetupClass, type SetupFunction, type SetupParams } from './Setup';
import {
	BidirectFlow,
	ClassicFlow,
	ConnectionPlugin as BaseConnectionPlugin,
	type EventType,
	Presets,
	type SocketData,
	type ClassicParams
} from 'rete-connection-plugin';
import { isConnectionInvalid } from '$graph-editor/plugins/typed-sockets';
import type { Socket } from '$graph-editor/socket/Socket.svelte';
import { findSocket } from '$graph-editor/socket/utils';
import type { Node } from '$graph-editor/nodes';
import { XmlNode } from '$graph-editor/nodes/XML';
import {
	baseNodeMenuItems,
	ContextMenu,
	getMenuItemsFromNodeItems,
	showContextMenu,
	type NodeMenuItem
} from '$graph-editor/plugins/context-menu';

export class ConnectionDropEvent extends Event {
	public readonly pos: { x: number; y: number };

	constructor(
		public readonly pointerEvent: PointerEvent,
		public readonly drop: () => void,
		public readonly socketData: SocketData & { payload: Socket },
		public readonly factory: NodeFactory
	) {
		super('connectiondrop');
		this.pos = { x: pointerEvent.clientX, y: pointerEvent.clientY };
	}
}

export class ConnectionPlugin extends BaseConnectionPlugin<Schemes, AreaExtra> {
	picked = false;
	public lastClickedSocket = false;
	public lastPickedSockedData: (SocketData & { payload: Socket }) | undefined;

	constructor(private factory: NodeFactory) {
		super();
	}

	/**
	 * Handles pointer down and up events to control interactive connection creation.
	 * @param event
	 * @param type
	 */
	override async pick(event: PointerEvent, type: EventType): Promise<void> {
		const pointedElements = document.elementsFromPoint(event.clientX, event.clientY);

		// @ts-expect-error: Access private field
		const socketData = findSocket(this.socketsCache, pointedElements) as
			| (SocketData & { payload: Socket })
			| undefined;

		// select socket on right click
		if (event.button == 0) {
			const node = socketData?.payload.node;

			if (type === 'down') {
				if (socketData === undefined) return;
				console.debug('Pick connection');
				this.picked = true;
			}

			if (type === 'up' && this.picked && this.lastPickedSockedData) {
				this.picked = false;
				// this.emit({
				// 	type: 'connectiondrop',
				// 	data: {
				// 		created: false,
				// 		initial: this.lastPickedSockedData,
				// 		socket: socketData ?? null,
				// 	}
				// })
				
				// return;
			}
		}
		if (event.button == 2) {
			if (type === 'up') return;

			// pickedSocket.selected = !pickedSocket.selected;
			// @ts-expect-error: Access private field
			const node: Node = this.editor.getNode(socketData.nodeId);
			const socket = (
				socketData.side === 'input' ? node.inputs[socketData.key] : node.outputs[socketData.key]
			)?.socket;
			if (socket === undefined)
				throw new Error(`Socket not found for node ${node.id} and key ${socketData.key}`);

			this.lastClickedSocket = true;
			event.preventDefault();
			event.stopPropagation();
			socket.toggleSelection();
			node.updateElement();
			return;
		}
		super.pick(event, type);
	}
}

export class ConnectionSetup extends SetupClass {
	setup(editor: NodeEditor, area: AreaPlugin<Schemes, AreaExtra>, factory: NodeFactory): void {
		// let lastButtonClicked : number;
		// area.container.addEventListener('pointerdown', (e) => {
		//     e.preventDefault();
		//     e.stopPropagation();
		//     lastButtonClicked = e.button
		//     console.log("pointerdown", lastButtonClicked)
		//     return false;
		// }, false);
		setupConnections({ editor, area, factory });
	}
}

export const setupConnections: SetupFunction = (params: SetupParams) => {
	console.log('Setting up connection plugin');
	const { factory, editor, area } = params;

	if (!area) {
		console.warn("Area plugin is not defined, can't setup connections plugin.");
		return params;
	}

	const connectionPlugin = new ConnectionPlugin(factory);
	Presets.classic.setup();
	// @ts-expect-error: Ignore type error
	connectionPlugin.addPreset((socketData: SocketData & { payload: Socket }) => {
		// console.log("connectionPlugin", socketData)
		const params: ClassicParams<Schemes> = {
			makeConnection(from, to, context) {
				const forward = from.side === 'output' && to.side === 'input';
				const backward = from.side === 'input' && to.side === 'output';
				const [source, target] = forward ? [from, to] : backward ? [to, from] : [];
				if (!source || !target) return false;
				const sourceNode = editor.getNode(source.nodeId);
				const targetNode = editor.getNode(target.nodeId);
				if (!sourceNode || !targetNode) {
					console.warn("Can't find source or target node in makeConnection function");
					return false;
				}
				editor.addNewConnection(sourceNode, source.key, targetNode, target.key);
				return true;
			},
			// @ts-expect-error: Ignore payload missing in parent method types
			canMakeConnection(
				from: SocketData & { payload: Socket },
				to: SocketData & { payload: Socket }
			) {
				connectionPlugin.drop();

				const forward = from.side === 'output' && to.side === 'input';
				const backward = from.side === 'input' && to.side === 'output';
				const [source, target] = forward ? [from, to] : backward ? [to, from] : [];
				if (!source || !target) return false;

				const sourceNode = editor.getNode(source.nodeId);
				const targetNode = editor.getNode(target.nodeId);
				if (!sourceNode || !targetNode) {
					console.warn("Can't find source or target node in canMakeConnection function");
					return false;
				}
				const conns =
					source.key in sourceNode.outgoingDataConnections
						? sourceNode.outgoingDataConnections[source.key]
						: source.key in sourceNode.outgoingExecConnections
							? sourceNode.outgoingExecConnections[source.key]
							: undefined;
				if (conns) {
					if (
						conns.some((conn) => conn.target === target.nodeId && conn.targetInput === target.key)
					) {
						console.log('Connection already exists');
						return false;
					}
				}

				// this function checks if the old connection should be removed
				if (
					isConnectionInvalid(
						(from as unknown as { payload: Socket }).payload,
						(to as unknown as { payload: Socket }).payload
					)
				) {
					console.log(
						`Connection between ${from.nodeId} and ${to.nodeId} is not allowed. From socket type is ${from.payload.type} and to socket type is ${to.payload.type}`
					);
					factory.notifications.show({
						title: 'Erreur',
						message: `Connection invalide entre types "${from.payload.type}" et "${to.payload.type}" !`,
						color: 'red'
					});
					return false;
				} else return true;
			}
		};
		return new (
			socketData.payload.datastructure === 'array' &&
			socketData.payload.node instanceof XmlNode &&
			socketData.key === 'children'
				? BidirectFlow
				: ClassicFlow
		)(params);
	});

	connectionPlugin.addPipe(async (ctx) => {
		// prevent the connection from moving when the drop menu is visible
		if (ctx.type === 'pointermove' && ContextMenu.instance.visible) {
			return;
		}

		if (ctx.type === 'connectionpick') {
			connectionPlugin.lastPickedSockedData = ctx.data.socket as SocketData & { payload: Socket };
		}
		if (ctx.type === 'contextmenu' && connectionPlugin.lastClickedSocket) {
			connectionPlugin.lastClickedSocket = false;
			ctx.data.event.preventDefault();
			ctx.data.event.stopPropagation();
			return;
		}
		return ctx;
	});
	area.use(connectionPlugin);
	factory.connectionPlugin = connectionPlugin;
	return params;
};
