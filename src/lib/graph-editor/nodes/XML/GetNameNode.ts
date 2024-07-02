import type { Socket } from '../../socket/Socket';
import { Node } from '../Node';
import type { NodeFactory } from '../../editor/NodeFactory';
import type { XmlData } from './types';

export class GetNameNode extends Node<{ xml: Socket }, { name: Socket }> {
	constructor({ factory }: { factory: NodeFactory }) {
		super({ label: 'Get Name', factory });
		this.addInData({
			name: 'xml',
			displayName: 'XML',
			socketLabel: 'XML',
			type: 'xmlElement:*'
		});
		this.addOutData({
			name: 'name',
			displayName: 'Name',
			socketLabel: 'Name',
			type: 'groupNameRef'
		});
	}

	override data(inputs?: Record<string, unknown>): { name: string } {
		const xml = this.getData('xml', inputs) as XmlData;

		return { name: xml?.name };
	}
}
