import type { NodeEditor } from '$rete/NodeEditor';
import type { AreaExtra } from '$rete/node/AreaExtra';
import type { NodeFactory } from '$rete/node/NodeFactory';
import type { Schemes } from '$rete/node/Schemes';
import type { Area2D, AreaPlugin } from 'rete-area-plugin';
import { Setup } from './Setup';
import {
	BidirectFlow,
	ClassicFlow,
	ConnectionPlugin,
	type EventType,
	Presets,
	type SocketData,
	type ClassicParams
} from 'rete-connection-plugin';
import { isConnectionInvalid } from '$rete/plugin/typed-sockets';
import type { Socket } from '$rete/socket/Socket';
import { notifications } from '$lib/global';
import type { Root } from 'rete';
import { findSocket } from '$rete/socket/utils';
import type { Connection, Node } from '$rete/node/Node';
import { moonMenuVisibleStore } from '$lib/menu/context-menu/moonContextMenu';
import { XmlNode } from '$rete/node/XML/XmlNode';
import { MakeArrayNode } from '$rete/node/data/MakeArrayNode';

let dropMenuVisible = false;
// moonMenuVisibleStore.subscribe((value) => {
//   dropMenuVisible = value;
// });

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

class MyConnectionPlugin extends ConnectionPlugin<Schemes, AreaExtra> {
	picked = false;
	public lastClickedSocket = false;
	public lastPickedSockedData: (SocketData & { payload: Socket }) | undefined;

	constructor(private factory: NodeFactory) {
		super();
	}

	override async pick(event: PointerEvent, type: EventType): Promise<void> {
		// select socket on right click
		if (event.button == 0) {
			const pointedElements = document.elementsFromPoint(event.clientX, event.clientY);
			const droppedSocketData = findSocket(this.socketsCache, pointedElements) as
				| (SocketData & { payload: Socket })
				| undefined;
			const node = droppedSocketData?.payload.node;

			if (type === 'down') {
				if (droppedSocketData) {
					this.picked = true;
				}
			}

			if (type === 'up' && this.picked && this.lastPickedSockedData) {
				this.picked = false;
				// Check if the pointer is over a socket

				if (!droppedSocketData) {
					const area: AreaPlugin<Schemes, AreaExtra> = this.parent;
					area.container.dispatchEvent(
						new ConnectionDropEvent(
							event,
							() => this.drop(),
							this.lastPickedSockedData as unknown as SocketData & {
								payload: Socket;
							},
							this.factory
						)
					);
					return;
				}
			}
		}

		if (event.button == 2) {
			if (type === 'up') return;
			const pointedElements = document.elementsFromPoint(event.clientX, event.clientY);

			const pickedSocketData = findSocket(this.socketsCache, pointedElements);
			if (pickedSocketData === undefined) return;

			// pickedSocket.selected = !pickedSocket.selected;
			const node: Node = this.editor.getNode(pickedSocketData.nodeId);
			const socket = (
				pickedSocketData.side === 'input'
					? node.inputs[pickedSocketData.key]
					: node.outputs[pickedSocketData.key]
			)?.socket;
			if (socket === undefined)
				throw new Error(`Socket not found for node ${node.id} and key ${pickedSocketData.key}`);

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

export class ConnectionSetup extends Setup {
	setup(
		editor: NodeEditor,
		area: AreaPlugin<Schemes, AreaExtra> | undefined,
		factory: NodeFactory
	): void {
		// let lastButtonClicked : number;
		// area.container.addEventListener('pointerdown', (e) => {
		//     e.preventDefault();
		//     e.stopPropagation();
		//     lastButtonClicked = e.button
		//     console.log("pointerdown", lastButtonClicked)
		//     return false;
		// }, false);
		const connection = new MyConnectionPlugin(factory);
		Presets.classic.setup();
		connection.addPreset((socketData: SocketData & { payload: Socket }) => {
			// console.log("connectionPlugin", socketData)
			const params: ClassicParams<Schemes> = {
				makeConnection(from, to, context) {
					const forward = from.side === 'output' && to.side === 'input';
					const backward = from.side === 'input' && to.side === 'output';
					const [source, target] = forward ? [from, to] : backward ? [to, from] : [];

					if (!source || !target) return false;
					editor.addNewConnection(
						editor.getNode(source.nodeId),
						source.key,
						editor.getNode(target.nodeId),
						target.key
					);
					return true;
				},
				canMakeConnection(from, to) {
					connection.drop();

					const forward = from.side === 'output' && to.side === 'input';
					const backward = from.side === 'input' && to.side === 'output';
					const [source, target] = forward ? [from, to] : backward ? [to, from] : [];
					if (!source || !target) return false;

					const sourceNode = editor.getNode(source.nodeId);
					const targetNode = editor.getNode(target.nodeId);
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
						notifications.show({
							title: 'Erreur',
							message: `Connection invalide entre types "${from.payload.type}" et "${to.payload.type}" !`,
							color: 'red'
						});
						return false;
					} else return true;
				}
			};
			return new (
				socketData.payload.isArray &&
				socketData.payload.node instanceof XmlNode &&
				socketData.key === 'children'
					? BidirectFlow
					: ClassicFlow
			)(params);
		});

		connection.addPipe(async (ctx) => {
			// prevent the connection from moving when the drop menu is visible
			if (ctx.type === 'pointermove' && dropMenuVisible) {
				return;
			}

			if (ctx.type === 'connectionpick') {
				connection.lastPickedSockedData = ctx.data.socket as SocketData & {
					payload: Socket;
				};
			}
			if (ctx.type === 'contextmenu' && connection.lastClickedSocket) {
				connection.lastClickedSocket = false;
				ctx.data.event.preventDefault();
				ctx.data.event.stopPropagation();
				return;
			}
			return ctx;
		});
		area?.use(connection);
	}
}
