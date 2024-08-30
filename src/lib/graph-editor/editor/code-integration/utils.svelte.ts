import { Connection, Node } from '$graph-editor/nodes/Node.svelte';
import { XmlNode } from '$graph-editor/nodes/XML/XmlNode.svelte';
import { ErrorWNotif } from '$lib/global';
import {
	animationFrame,
	getElementFromParsedXml,
	getXmlAttributes,
	newLocalId,
	parseXml,
	XmlSchema,
	type ParsedXmlNodes,
	type SaveData
} from '@selenite/commons';
import type { NodeFactory } from '../NodeFactory.svelte';
import { FormatGroupNameNode } from '$graph-editor/nodes/io/FormatNode';
import { BreakArrayNode } from '$graph-editor/nodes/data/array';
import { lowerFirst } from 'lodash-es';

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
	const cellBlockMap = new Map<string, XmlNode>();
	function rec({ xml, parent }: { xml: ParsedXmlNodes; parent?: XmlNode }): void {
		for (const xmlNode of xml) {
			const xmlTag = getElementFromParsedXml(xmlNode);
			if (xmlTag === null) {
				continue;
			}
			if (xmlTag.startsWith('?')) continue;
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
					// console.log('candidate', candidate);
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
				xmlConfig: { complex }
			});
			for (const k of Object.keys(xmlAttributes)) {
				if (node.optionalXmlAttributes.has(k)) node.addOptionalAttribute(k);
			}
			// Register all cellblocks defined by the internal mesh
			if (complex.name === 'InternalMesh') {
				const cellblockNames = xmlAttributes['cellBlockNames'];
				if (cellblockNames) {
					if (
						Array.isArray(cellblockNames) &&
						cellblockNames.length > 0 &&
						typeof cellblockNames[0] === 'string'
					) {
						for (const cb of cellblockNames) {
							cellBlockMap.set(cb, node);
						}
					} else {
						console.error('Wrong types for cellblocks names of internal mesh.', cellblockNames);
					}
				}
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
				} else {
					const previousNode = nameToXmlNode.get(name)!;
					console.warn('Duplicate name:', name, { previous: previousNode.label, new: node.label });
					factory?.notifications.warn({
						message: `Duplicate name in XML : '${name}'.\nThe first one that is not an event will be kept.`,
						autoClose: 5000
					});
					if (previousNode.label.includes('Event')) {
						console.warn('Previous node is an event node, replacing it with the new one');
						nameToXmlNode.set(name, node);
					} else if (node.label.includes('Event')) {
						console.warn('New node is an event node, skipping it');
					} else {
						console.warn('Both nodes are not event nodes, skipping the new one');
					}
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
					console.warn('Parent has no socket for child', {
						parent: $state.snapshot(parent.inputs),
						node,
						type: complex.name
					});
				}
			}
			rec({ xml: (xmlNode as Record<string, ParsedXmlNodes>)[xmlTag], parent: node });
		}
	}
	rec({ xml });
	const objectPathFormatMap = new Map<string, FormatGroupNameNode>();
	const cellBlockBreakNodes = new Map<Node, BreakArrayNode>();

	function getCellBlockBreakNode(sourceNode: XmlNode): BreakArrayNode {
		if (!cellBlockBreakNodes.has(sourceNode)) {
			const breakNode = new BreakArrayNode({
				type: 'groupNameRef',
				name: 'cellBlocks',
				factory,
				initialValues: { array: [...(sourceNode.getData('cellBlockNames') as unknown[] | undefined) ?? []] }
			});
			nodes.push(breakNode);
			cellBlockBreakNodes.set(sourceNode, breakNode);
			connections.push(
				new Connection(sourceNode as Node, 'cellBlockNames', breakNode, 'array') as Connection
			);
		}
		return cellBlockBreakNodes.get(sourceNode)!;
	}
	// Process group name links
	for (const { source, target } of groupNameLinks) {
		if (cellBlockMap.has(source)) {
			const sourceNode = cellBlockMap.get(source)!;
			if (sourceNode === target.node) continue;
			const breakNode = getCellBlockBreakNode(sourceNode);
			connections.push(new Connection(breakNode, source, target.node, target.key) as Connection);
			continue;
		}
		// Object Paths links
		if (target.key === 'objectPath') {
			if (objectPathFormatMap.has(source)) {
				const sourceFormat = objectPathFormatMap.get(source)!;
				connections.push(new Connection(sourceFormat, 'result', target.node, target.key) as Connection);
				continue;
			}
			let formatString: string[] = [];
			let numVars = 0;
			let numCellblocks = 0;
			const vars: { node: Node; outKey: string; inKey: string }[] = [];
			const nodeVarCount = new Map<string, number>();
			for (const name of source.split('/')) {
				const node = nameToXmlNode.get(name);
				if (cellBlockMap.has(name)) {
					const key = numCellblocks === 0 ? 'cellBlock' : `cellBlock-${numCellblocks}`;
					const breakNode = getCellBlockBreakNode(cellBlockMap.get(name)!);
					formatString.push(`{${key}}`);
					vars.push({ node: breakNode, outKey: name, inKey: key });
					numCellblocks++;
					continue;
				}
				if (node) {
					let key = lowerFirst(node.outLabel);
					if (nodeVarCount.has(node.outLabel)) {
						key += `-${nodeVarCount.get(name)}`;
					}
					formatString.push(`{${key}}`);
					vars.push({ node: node as Node, outKey: 'name', inKey: key });
					numVars++;
					nodeVarCount.set(node.outLabel, (nodeVarCount.get(node.outLabel) ?? 0) + 1);
					continue;
				}
				formatString.push(name);
			}

			if (vars.length === 0) continue;
			const formatNode = new FormatGroupNameNode({
				name: 'objectPath',
				factory,
				initialValues: { format: formatString.join('/') }
			});
			// console.log(Object.keys(formatNode.inputs));
			nodes.push(formatNode);
			objectPathFormatMap.set(source, formatNode);
			for (const [i, { node, outKey, inKey }] of vars.entries()) {
				connections.push(new Connection(node, outKey, formatNode, `data-${inKey}`) as Connection);
			}
			connections.push(new Connection(formatNode, 'result', target.node, target.key) as Connection);

			continue;
		}
		const candidates = source
			.split('/')
			.map((s) => nameToXmlNode.get(s))
			.filter(Boolean) as XmlNode[];

		if (candidates.length === 0) {
			console.warn('Source node not found', source);
			continue;
		}
		const sourceNode = candidates[0];
		connections.push(
			new Connection(
				sourceNode,
				target.key === 'target' || target.key === 'sources' ? 'value' : 'name',
				target.node,
				target.key
			) as Connection
		);
	}
	return { nodes, connections };
}

export async function addGraphToEditor({
	factory,
	nodes,
	connections,
	t0
}: {
	factory: NodeFactory;
	nodes: (Node | SaveData<Node>)[];
	connections: (Connection | SaveData<Connection>)[];
	t0: number;
}) {
	if (nodes.length === 0 && connections.length === 0) return;

	let addedNodes: Node[] = $state([]);
	let addedConns: Connection[] = $state([]);
	const notifId = newLocalId('code-integration-progress');
	factory.notifications.show({
		id: notifId,
		title: 'Code Integration',
		autoClose: false,
		get message() {
			return `Progress: ${(((addedNodes.length + addedConns.length) / (nodes.length + connections.length)) * 100).toFixed(2)}%`;
		}
	});
	for (const [i, node] of nodes.entries()) {
		let n: Node;
		if (node instanceof Node) {
			n = node;
			n.factory = factory;
		} else {
			n = await Node.fromJSON(node, { factory });
		}
		n.visible = false;
		if (n) {
			await factory.editor.addNode(n);
		}
		addedNodes.push(n);
		if (i % 10 === 9) await animationFrame();
	}
	for (const [i, conn] of connections.entries()) {
		const addedConn = await factory.editor.addNewConnection(
			conn.source,
			conn.sourceOutput,
			conn.target,
			conn.targetInput
		);
		if (addedConn) {
			addedConns.push(addedConn);
		} else {
			console.warn('Failed to add connection', conn);
		}

		if (i % 10 === 9) await animationFrame();
	}

	await animationFrame(2);
	await factory.arrange?.layout();
	for (const node of addedNodes) {
		node.visible = true;
	}

	factory.focusNodes(addedNodes);
	setTimeout(() => {
		factory.notifications.hide(notifId);
	}, 1000);
	if (import.meta.env.MODE === 'development')
		factory.notifications.info({
			title: 'Graph Editor',
			message: 'It took ' + ((performance.now() - t0) / 1000).toFixed(2) + ' s to parse the xml'
		});
}
