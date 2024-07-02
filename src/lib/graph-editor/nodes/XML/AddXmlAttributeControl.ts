import { Control } from '$rete/control/Control';
import type { XmlNode } from './XmlNode';

export class AddXmlAttributeControl extends Control {
	constructor(public readonly xmlNode: XmlNode) {
		super();
	}
}
