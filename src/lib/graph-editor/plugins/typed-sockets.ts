import { type BaseSchemes, NodeEditor, type Root, Scope } from 'rete';
import type { Connection } from '$graph-editor/nodes';
import { ExecSocket, type Socket, type SocketDatastructure } from '$graph-editor/socket';
import { ErrorWNotif, notifications } from '$lib/global/todo.svelte';

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
export type DataType = Exclude<SocketType, 'exec'>;
export type ExportedSocketType = BaseSocketType | 'xmlAttr' | 'xmlElement';
export function socketTypeExport(t: SocketType): ExportedSocketType {
	if ((baseSocketTypes as readonly string[]).includes(t)) return t as BaseSocketType;
	if (t.startsWith('xmlAttr')) return 'xmlAttr';
	else if (t.startsWith('xmlElement')) return 'xmlElement';
	else throw new ErrorWNotif('Invalid socket type');
}
export type TypeInfo = {
	type: SocketType;
	datastructure: SocketDatastructure;
};
export function areTypesCompatible(outType: TypeInfo, inType: TypeInfo): boolean {
	const re = /(\w+):(.+)/;

	const [, outMainType, outSubtypes] = re.exec(outType.type) || [];
	const [, inMainType, inSubtypes] = re.exec(inType.type) || [];
	if (inMainType && outMainType && inMainType === outMainType) {
		if (outSubtypes === '*' || inSubtypes === '*') {
			return true;
		}
		const outSubtypesArray = outSubtypes.split('|');
		const inSubtypesArray = inSubtypes.split('|');
		const intersection = outSubtypesArray.filter((subtype) => inSubtypesArray.includes(subtype));
		if (intersection.length > 0) {
			return true;
		}
	}

	if (outType.type === 'groupNameRef' && inType.type === 'groupNameRef') {
		return true;
	}

	return (
		outType.type === 'any' ||
		((outType.datastructure === inType.datastructure || inType.datastructure === 'array') &&
			(inType.type === 'any' || outType.type === inType.type)) ||
		inType.type === 'any'
	);
}

export function isConnectionInvalid(outputSocket: Socket, inputSocket: Socket) {
	return !areTypesCompatible(outputSocket, inputSocket);
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
					const sourceNode = this.parent.getNode(conn.source);
					const targetNode = this.parent.getNode(conn.target);
					const eMessage = `Connection between ${sourceNode.name ?? sourceNode.label} and ${targetNode.name ?? targetNode.label} is not allowed. Output socket type is ${outputSocket.datastructure}<${outputSocket.type}> and input socket type is ${inputSocket.datastructure}<${inputSocket.type}>`;
					console.error(eMessage);
					notifications.error({ message: eMessage, autoClose: 8000 });
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
					if (outputSocket.datastructure === 'array' && inputSocket.datastructure === 'array') {
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
