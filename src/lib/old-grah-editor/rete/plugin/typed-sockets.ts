import { type BaseSchemes, NodeEditor, type Root, Scope } from 'rete';
import type { Connection } from '../node/Node';
import type { Socket } from '../socket/Socket';
import { ExecSocket } from '../socket/ExecSocket';
import { ErrorWNotif } from '$lib/global';

export type XMLAttrType = `xmlAttr:${string}`;
export type XMLElementType = `xmlElement:${string}`;
const baseSocketTypes = [
	'integer',
	'exec',
	'any',
	'vector',
	'number',
	'string',
	'boolean',
	'path',
	'options'
] as const;
export type BaseSocketType = (typeof baseSocketTypes)[number];

export type SocketType =
	| BaseSocketType
	// | 'constitutive'
	// | 'elementRegion'
	// | 'numericalMethod'
	// | 'sameType'
	// | 'mesh'
	// | 'geometry'
	// | 'fieldSpecification'
	// | 'output'
	// | 'pythonObject'
	// | 'pythonProperty'
	// | 'solver'
	// | 'xmlProblem'
	| 'groupNameRef'
	| XMLAttrType
	| XMLElementType;

export type ExportedSocketType = BaseSocketType | 'xmlAttr' | 'xmlElement';
export function socketTypeExport(t: SocketType): ExportedSocketType {
	if ((baseSocketTypes as readonly string[]).includes(t)) return t as BaseSocketType;
	if (t.startsWith('xmlAttr')) return 'xmlAttr';
	else if (t.startsWith('xmlElement')) return 'xmlElement';
	else throw new ErrorWNotif('Invalid socket type');
}

export function isConnectionInvalid(outputSocket: Socket, inputSocket: Socket) {
	const re = /(\w+):(.+)/;

	const [, outType, outSubtypes] = re.exec(outputSocket.type) || [];
	const [, inType, inSubtypes] = re.exec(inputSocket.type) || [];
	if (inType && outType && inType === outType) {
		if (outSubtypes === '*' || inSubtypes === '*') {
			return false;
		}
		const outSubtypesArray = outSubtypes.split('|');
		const inSubtypesArray = inSubtypes.split('|');
		const intersection = outSubtypesArray.filter((subtype) => inSubtypesArray.includes(subtype));
		if (intersection.length > 0) {
			return false;
		}
	}

	return (
		outputSocket instanceof ExecSocket !== inputSocket instanceof ExecSocket ||
		(outputSocket.type !== inputSocket.type &&
			outputSocket.type !== 'any' &&
			inputSocket.type !== 'any' &&
			!(outputSocket.type === 'pythonObject' && inputSocket.type === 'pythonProperty') &&
			!(outputSocket.type === 'pythonProperty' && inputSocket.type === 'pythonObject'))
	);
}

export class TypedSocketsPlugin<Schemes extends BaseSchemes> extends Scope<never, [Root<Schemes>]> {
	lastConnectionRemove: Connection | null = null;

	constructor() {
		super('typed-sockets');
	}

	setParent(scope: Scope<Root<Schemes>>): void {
		super.setParent(scope);

		// Prevent connections between incompatible sockets

		this.addPipe(async (ctx) => {
			// console.log(ctx);
			let conn: Connection;

			// TODO : restore removed connection if it was removed for an impossible connection
			if (ctx.type === 'connectionremove' && (conn = ctx.data as Connection)) {
				// console.log(ctx);

				this.lastConnectionRemove = conn;
			}

			if (ctx.type === 'connectioncreate' && (conn = ctx.data as Connection)) {
				const outputSocket = this.getOutputSocket(conn.source, conn.sourceOutput);
				const inputSocket = this.getInputSocket(conn.target, conn.targetInput);

				if (isConnectionInvalid(outputSocket, inputSocket)) {
					console.log(
						`Connection between ${conn.source} and ${conn.target} is not allowed. Output socket type is ${outputSocket.type} and input socket type is ${inputSocket.type}`
					);
					let nodeEditor: NodeEditor<Schemes>;

					if ((nodeEditor = scope as NodeEditor<Schemes>) && this.lastConnectionRemove) {
						console.log(`Restoring connection ${this.lastConnectionRemove?.id}`);

						await nodeEditor.addConnection(this.lastConnectionRemove);
					}

					return;
				}
				let nodeEditor: NodeEditor<Schemes>;
				if ((nodeEditor = scope as NodeEditor<Schemes>)) {
					if (outputSocket instanceof ExecSocket) {
						const connections = nodeEditor.getConnections();
						connections
							.filter(
								(connection) =>
									connection.source === conn.source &&
									(connection as Connection).sourceOutput === conn.sourceOutput
							)
							.forEach(async (connection) => {
								await nodeEditor.removeConnection(connection.id);
							});
					}
					if (outputSocket.isArray === true && inputSocket.isArray === true) {
						if (conn.targetInput in inputSocket.node.ingoingDataConnections)
							await nodeEditor.removeConnection(
								inputSocket.node.ingoingDataConnections[conn.targetInput].id
							);
					}
				}
			}

			return ctx;
		});
	}

	getInputSocket(nodeId: string, socketName: string | number): Socket {
		return this.parent.getNode(nodeId).inputs[socketName]?.socket;
	}

	getOutputSocket(nodeId: string, socketName: string | number): Socket {
		return this.parent.getNode(nodeId).outputs[socketName]?.socket;
	}
}
