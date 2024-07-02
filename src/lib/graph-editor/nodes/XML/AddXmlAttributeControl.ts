import { Control } from '$graph-editor/socket';
import type { XmlNode } from './XmlNode';

export class AddXmlAttributeControl extends Control {
	constructor(public readonly xmlNode: XmlNode) {
		super();
	}
}
