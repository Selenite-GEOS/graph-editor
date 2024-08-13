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
	type ClassicParams,
	createPseudoconnection
} from 'rete-connection-plugin';
import { isConnectionInvalid } from '$graph-editor/plugins/typed-sockets';
import type { Socket } from '$graph-editor/socket/Socket.svelte';
import { findSocket } from '$graph-editor/socket/utils';
import type { Connection, Node } from '$graph-editor/nodes';
import { XmlNode } from '$graph-editor/nodes/XML';
import { isEqual } from 'lodash-es';

export class ConnectionPlugin extends BaseConnectionPlugin<Schemes, AreaExtra> {
	picked = false;
	public lastClickedSocket = false;
	public lastPickedSockedData: (SocketData & { payload: Socket }) | undefined;
	/** Last picked connection. */
	lastConn?: Connection;
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
		if (event.button == 0) {

			if (type === 'down') {
				if (socketData === undefined) return;
				console.debug('Pick connection');
				this.lastPickedSockedData = socketData as SocketData & { payload: Socket };
				this.picked = true;
				const node = this.factory.editor.getNode(socketData.nodeId);
				if (node) {
					this.lastConn =
						socketData.side === 'output'
							? node.outConnections[socketData.key]?.at(0)
							: node.inConnections[socketData.key]?.at(0);
				}
			}

			if (type === 'up' && this.picked && this.lastPickedSockedData) {
				this.picked = false;
				if (!socketData) {
					this.emit({
						type: 'connectiondrop',
						data: {
							created: false,
							initial: this.lastPickedSockedData,
							socket: socketData ?? null,
							event
						}
					});

					return;

				}
				// Fix for the case where the user drops the connection on the same socket
				// it was picked from
				 else {
					if (this.lastConn && isEqual(this.lastPickedSockedData, socketData)) {
						await this.factory.editor.addConnection(this.lastConn);
						this.drop();
						return;
					}
				}
			}
		}
		// select socket on right click
		if (event.button == 2) {
			if (type === 'up') return;
			if (!socketData) return;
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
		await super.pick(event, type);
	}
}

export class ConnectionSetup extends SetupClass {
	setup(editor: NodeEditor, area: AreaPlugin<Schemes, AreaExtra>, factory: NodeFactory): void {
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
	area.use(connectionPlugin);
	factory.connectionPlugin = connectionPlugin;
	return params;
};
