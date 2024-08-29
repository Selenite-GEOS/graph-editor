import { ErrorWNotif } from '$lib/global/index.svelte';
import { formatXMLArray } from '@selenite/commons';
import type { XmlNode } from './XmlNode.svelte';

function formatToXML(obj: object): string {
	if (obj instanceof Array) {
		return formatXMLArray(obj);
	}
	if (typeof obj === 'boolean') {
		return obj ? '1' : '0';
	}
	return obj.toString();
}

export class XMLData {
	tag: string;
	name?: string;
	properties: Record<string, unknown>;
	children: XMLData[];
	node: XmlNode;

	constructor({
		tag,
		name,
		properties,
		children,
		node,
	}: {
		tag: string;
		name?: string;
		properties: Record<string, unknown>;
		children: XMLData[];
		node: XmlNode;
	}) {
		this.tag = tag;
		this.name = name;
		this.properties = properties;
		this.children = children;
		this.node = node;
	}
	
	toXml(): string {
		let xml = `<${this.tag}`;
		if (this.name) xml += ` name="${this.name}"`;
		Object.entries(this.properties).forEach(([name, value]) => {
			// console.log(`property: ${name} value: ${JSON.stringify(value)}`)
			const val = formatToXML(value);

			xml += ` ${name}="${val}"`;
		});
		if (this.children.length === 0) xml += '/>';
		else {
			xml += '>';
			try {
				this.children.forEach((child) => {
					xml += child.toXml();
				});
			} catch (e) {
				throw new ErrorWNotif('Error generating XML, are you sure you connected everything ?');
			}
			xml += `</${this.tag}>`;
		}
		return xml;
	}
}
