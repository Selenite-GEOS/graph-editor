import { Connection, Node } from '$graph-editor/nodes/Node.svelte';
import { XmlNode } from '$graph-editor/nodes/XML/XmlNode.svelte';
import { MakeArrayNode } from '$graph-editor/nodes/data/array';
import type { XmlAttributeDefinition } from '$graph-editor/nodes/XML/types';
import { ErrorWNotif } from '$lib/global';
import {
	getElementFromParsedXml,
	getXmlAttributes,
	parseXml,
	XmlSchema,
	type ParsedXmlNodes
} from '@selenite/commons';
import wu from 'wu';
import type { NodeFactory } from '../NodeFactory.svelte';

export function xmlToGraph(params: { xml: string; schema: XmlSchema; factory?: NodeFactory }) {
	const parsedXml = parseXml(params.xml);
	console.debug('parsed xml', parsedXml);
	const res = parsedXmlToGraph({
		...params,
		xml: parsedXml
	});
	return res;
}

/**
 * Recursively converts the parsed xml to editor nodes
 */
export function parsedXmlToGraph({
	xml,
	schema,
	factory
}: {
	xml: ParsedXmlNodes;
	schema: XmlSchema;
	factory?: NodeFactory;
}): {
	nodes: Node[];
	connections: Connection[];
} {
	const nodes: Node[] = [];
	const connections: Connection[] = [];
	const rootTypes = schema.roots;
	const nameToXmlNode = new Map<string, XmlNode>();
	const groupNameLinks: {
		source: string;
		target: { node: Node; key: string };
	}[] = [];
	function rec({ xml, parent }: { xml: ParsedXmlNodes; parent?: XmlNode }): void {
		for (const xmlNode of xml) {
			const xmlTag = getElementFromParsedXml(xmlNode);
			if (xmlTag === null) {
				console.error('Failed to parse xml tag.');
			}
			if (xmlTag?.startsWith('?')) continue;
			const complex = schema.complexTypes.get(xmlTag ?? '');
			if (!complex) {
				console.warn('Complex type not found', xmlTag);
				continue;
			}

			if (!xmlTag) throw new ErrorWNotif('Missing xml tag in parsed xml node');
			const hasNameAttribute = complex.attributes.has('name');
			const xmlAttributes: Record<string, unknown> = getXmlAttributes(
				xmlNode as Record<string, ParsedXmlNodes>
			);
			const arrayAttrs = new Map<string, string[]>();
			for (const [k, v] of Object.entries(xmlAttributes as Record<string, string>)) {
				const attrDef = complex.attributes.get(k);

				if (!attrDef) {
					console.warn('Attribute not found :', `${xmlTag}.${k}`);
					continue;
				}

				if (attrDef.type === 'R1Tensor') {
					const a = v
						.slice(1, -1)
						.split(',')
						.map((t) => t.trim());
					// console.log('R1Tensor', a, { x: a[0], y: a[1], z: a[2] });
					xmlAttributes[k] = { x: a[0], y: a[1], z: a[2] };
					continue;
				}

				if (attrDef.type.endsWith('Tensor')) {
					continue;
				}

				const isArray = /^\s*?\{\s*?/.test(v);
				if (!isArray) continue;

				type XMLArray = string[];
				type XMLNestedArrays = XMLArray[] | XMLArray;
				const candidate = JSON.parse(
					v
						.replaceAll('{', '[')
						.replaceAll('}', ']')
						.replaceAll(/[a-zA-Z0-9.\-_/]+/g, (t) => {
							// if (t === '') return '';
							// if (t === ',') return ',';
							return `"${t}"`;
						})
				) as XMLNestedArrays | undefined;

				if (candidate === undefined) continue;
				if (attrDef.type.startsWith('real') && attrDef.type.endsWith('array2d')) {
					console.log('candidate', candidate);
					xmlAttributes[k] = candidate.map((t) => {
						if (typeof t === 'string')
							throw new ErrorWNotif('Expected array for type real array2d');
						return { x: t[0], y: t[1], z: t[2] };
					});
					arrayAttrs.set(attrDef.name, xmlAttributes[k] as string[]);
					continue;
				}
				// put nested arrays back to xml notation
				// maybe later all kinds of nested arrays will be supported
				// and this will become obsolete
				function arraysToXmlNotation(a: string[] | string): string {
					if (typeof a === 'string') return a; // removes " "
					return (
						'{ ' +
						a
							.map((t) => {
								if (Array.isArray(t)) return arraysToXmlNotation(t);
								return t; // removes " "
							})
							.join(', ') +
						' }'
					);
				}
				const array1d = candidate.map(arraysToXmlNotation);
				xmlAttributes[k] = array1d;
				arrayAttrs.set(attrDef.name, array1d);
			}

			const node = new XmlNode({
				factory,
				initialValues: xmlAttributes,
				schema,
				xmlConfig: {complex}
			});
			for (const k of Object.keys(xmlAttributes)) {
				if (node.optionalXmlAttributes.has(k))
					node.addOptionalAttribute(k);	
			}
			nodes.push(node);
			// Automatically select output of root types like Solvers, Mesh...
			if (rootTypes.includes(complex.name.trim())) {
				node.selectOutput('value');
			}

			if (hasNameAttribute) {
				const name = xmlAttributes['name'] as string;
				if (!nameToXmlNode.has(name)) {
					nameToXmlNode.set(name, node);
				}
			}
			for (const [k, a] of arrayAttrs.entries()) {
				const attrDef = complex.attributes.get(k);
				if (!attrDef) throw new ErrorWNotif("Couldn't find simple type for array attribute");
				const initialValues: Record<string, unknown> = {};
				for (const [i, t] of a.entries()) {
					initialValues[`data-${i}`] = t;
				}
				// const makeArrayNode = new MakeArrayNode({
				// 	factory,
				// 	initialValues,
				// 	numPins: a.length
				// });
				// nodes.push(makeArrayNode as Node);

				// Gather array group name links

				if (attrDef.type === 'groupNameRef_array') {
					for (const [inputKey, t] of Object.entries(initialValues)) {
						if (typeof t !== 'string') {
							console.error(
								'Value of type groupNameRef should be of string type, type :',
								typeof t
							);
							continue;
						}
						groupNameLinks.push({
							source: t,
							target: {
								node: node,
								key: k
							}
						});
					}
				}
				// connections.push(new Connection(makeArrayNode, 'array', node, k) as Connection);
			}

			// Gather group name links
			for (const [k, v] of Object.entries(xmlAttributes)) {
				const attrDef = complex.attributes.get(k);
				if (!attrDef) {
					console.warn('Attribute type not found', k, v);
					continue;
				}
				if (attrDef.type.startsWith('groupNameRef')) {
					const isArray = attrDef.type.endsWith('array');
					if (!isArray) {
						if (typeof v !== 'string') {
							console.error(
								'Value of type groupNameRef should be of string type, type :',
								typeof v
							);
							continue;
						}
						groupNameLinks.push({
							source: v,
							target: { node, key: k }
						});
					}
				}
			}

			if (parent) {
				const target = parent.childrenSockets.get(complex.name);
				if (target) {
					connections.push(new Connection(node, 'value', parent, target) as Connection);
				} else {
					console.warn('Parent has no socket for child', { parent: $state.snapshot(parent.inputs), node, type: complex.name });
				}
			}
			rec({ xml: (xmlNode as Record<string, ParsedXmlNodes>)[xmlTag], parent: node });
		}
	}
	rec({ xml });
	console.debug("links", groupNameLinks);
	for (const { source, target } of groupNameLinks) {
		const sourceNode = nameToXmlNode.get(source);
		if (!sourceNode) {
			console.warn('Source node not found', source);
			continue;
		}
		if (source === "sink") {
			console.debug('source')

		}
		connections.push(new Connection(sourceNode, 'name', target.node, target.key) as Connection);
	}
	return { nodes, connections };
}
