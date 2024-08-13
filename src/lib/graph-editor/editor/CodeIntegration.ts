import { BaseComponent } from "$graph-editor/components";
import wu from "wu";
import type { NodeFactory } from "./NodeFactory.svelte";
import { XmlNode } from "$graph-editor/nodes";
import { buildXml, getElementFromParsedXml, getXmlAttributes, mergeParsedXml, parseXml, type ParsedXmlNodes, type XmlSchema } from "@selenite/commons";
import type { Schemes, AreaExtra } from "$graph-editor";
import { ErrorWNotif } from "$lib/global";
import type { XmlAttributeDefinition } from "$graph-editor/nodes/XML/types";

export class CodeIntegration extends BaseComponent<NodeFactory> {
	/**
	 * Pulls the selected nodes from the graph editor to the code editor
	 */
	async toCode({text ='', schema}: {text?: string, schema: XmlSchema}): Promise<string> {
        const factory = this.owner;
		const editor = factory.editor;
		const selectedXmlNodes = wu(factory.selector.entities.values())
			.map((selected) => editor.getNode(selected.id))
			.filter((node) => node instanceof XmlNode)
			.reduce<Set<XmlNode>>((acc, node) => acc.add(node as XmlNode), new Set());

		let preppedText = text;
		// if (cursorOffset !== null)
		// 	preppedText = text.slice(0, cursorOffset) + `<${cursorTag}/>` + text.slice(cursorOffset);

		const baseXml = parseXml(preppedText);
		let res: ParsedXmlNodes = baseXml;
        const cursorTag = 'cursorPositioooon';

        const {structures} = await import("rete-structures")
		const xmlMergingPromises = wu(factory.selector.entities.values())
			.map((selected) => editor.getNode(selected.id))
			.filter((node) => node instanceof XmlNode)
			// Take only the selected nodes that are not predecessors
			// of other selected nodes because they are redundant
			.filter((node) =>
				wu(structures(editor).successors(node!.id).nodes().values())
					.filter((node) => node instanceof XmlNode)
					.every((node) => !selectedXmlNodes.has(node as XmlNode))
			)
			.map(async (node) => {
				const xml = parseXml(await (node as XmlNode).getXml());
				res = mergeParsedXml({
					baseXml: res,
					newXml: xml,
					cursorTag,
					typesPaths: schema.typePaths
				});
			});
		await Promise.all(xmlMergingPromises);
        return buildXml({parsedXml: res, cursorTag})
	}

	/**
	 * Pushes the selected text from the code editor to the graph editor
	 */
	async toGraph({selectedText, schema}: {schema: XmlSchema, selectedText: string}) {
		const { NodeEditor } = await import('./NodeEditor.svelte');
        const {NodeFactory} = await import('./NodeFactory.svelte');
        
		const rootTypes = schema.roots;
		const factory = this.owner;
		const editor = factory.editor;
		const full_xml = parseXml(selectedText);
		console.debug('full xml', full_xml);
		const tmp_editor = new NodeEditor();
		const tmp_container = document.createElement('div');
        const {AreaPlugin} = await import('rete-area-plugin')
		const tmp_area = new AreaPlugin<Schemes, AreaExtra>(tmp_container);
		tmp_editor.use(tmp_area);
        const {AutoArrangePlugin, Presets: ArrangePresets} = await import('rete-auto-arrange-plugin')
		const arrange = new AutoArrangePlugin<Schemes>();
		arrange.addPreset(ArrangePresets.classic.setup());
		tmp_area.use(arrange);

		const tmp_factory = new NodeFactory({
			editor: tmp_editor,
			area: tmp_area
		});
		const nameToXmlNode = new Map<string, XmlNode>();
		const groupNameLinks: {
			source: string;
			target: { node: Node; key: string };
		}[] = [];

		/**
		 * Recursively converts the parsed xml to editor nodes
		 */
		async function xmlToEditor(xml: ParsedXmlNodes, schema: XmlSchema, parent?: Node) {
			for (const xmlNode of xml) {
				const xmlTag = getElementFromParsedXml(xmlNode);

				const complex = schema.complexTypes.get(xmlTag ?? '');
				if (!complex) {
					console.warn('Complex type not found');
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
						console.warn('Attribute type not found', k, v);
						continue;
					}

					if (attrDef.type === 'R1Tensor') {
						const a = v
							.slice(1, -1)
							.split(',')
							.map((t) => t.trim());
						console.log('R1Tensor', a, { x: a[0], y: a[1], z: a[2] });
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
								console.log('t', t);
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
				console.log('arrayAttrs', arrayAttrs);
				const node = await tmp_factory.addNode(XmlNode, {
					label: xmlTag,
					initialValues: xmlAttributes,
					xmlConfig: {
                        complex,
						noName: !hasNameAttribute,
						xmlTag: xmlTag,
						outData: {
							name: xmlTag,
							type: `xmlElement:${xmlTag}`,
							socketLabel: xmlTag
						},

						xmlProperties: wu(complex.attributes.values())
							.map((attr) => {
								return {
									name: attr.name,
									required: attr.required,
									// pattern: attr.pattern,
									type: attr.type,
									controlType: 'text'
								} as XmlAttributeDefinition;
							})
							.toArray()
					}
				}) as XmlNode;

				// Automatically select output of root types like Solvers, Mesh...
				if (rootTypes.includes(complex.name.trim())) {
					console.log('good pizza', complex.name, rootTypes);
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
					const makeArrayNode = await tmp_factory.addNode(MakeArrayNode, {
						initialValues,
						numPins: a.length
					});

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
									node: makeArrayNode,
									key: inputKey
								}
							});
						}
					}

					await tmp_editor.addNewConnection(makeArrayNode, 'array', node, k);
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
					console.log('node', node, 'parent', parent);
					const conn = await tmp_editor.addNewConnection(node, 'value', parent, 'children');
					console.log('temp conn', conn);
				}
				await xmlToEditor((xmlNode as Record<string, ParsedXmlNodes>)[xmlTag], schema, node);
			}
		}
		console.log('Download: full_xml', full_xml);
		await xmlToEditor(full_xml, schema);
		// TODO: name connections

		const getNameNodes = new Map<string, GetNameNode>();
		for (const { source, target } of groupNameLinks) {
			const sourceNode = nameToXmlNode.get(source);
			if (!sourceNode) {
				console.warn('Source node not found', source);
				continue;
			}
			if (!getNameNodes.has(source)) {
				const getNameNode = await tmp_factory.addNode(GetNameNode, {});
				getNameNodes.set(source, getNameNode);
				await tmp_editor.addNewConnection(sourceNode, 'value', getNameNode, 'xml');
			}
			const getNameNode = getNameNodes.get(source)!;
			await tmp_editor.addNewConnection(getNameNode, 'name', target.node, target.key);
		}
		console.log(await arrange.layout());
		const area = factory.getArea();
		let leftBound = 0;
		if (area) {
			wu(area.nodeViews.values()).forEach((nodeView) => {
				leftBound = Math.min(leftBound, nodeView.position.x - nodeView.element.offsetWidth * 1.4);
			});
		}
		const nodesSaveData: NodeSaveData[] = [];
		for (const node of tmp_editor.getNodes()) {
			nodesSaveData.push(node.toJSON());
		}

		for (const [i, nodeSaveData] of nodesSaveData.entries()) {
			console.log(nodeSaveData);
			const node = await factory.loadNode(nodeSaveData);
			const tmp_nodeView = tmp_area.nodeViews.get(node.id) as NodeView;
			const nodeView = factory.getArea()?.nodeViews.get(node.id);
			factory.selectableNodes?.select(node.id, i !== 0);
			if (nodeView)
				await nodeView.translate(tmp_nodeView.position.x + leftBound, tmp_nodeView.position.y);
			await factory.getArea()?.update('node', node.id);
		}
		if (tmp_editor.getNodes().length > 0)
			notifications.show({
				title: get(_)('graph-editor.notification.title'),
				message: get(_)('code-editor-integration.push-to-graph.selected-node-dragging.message'),
				autoClose: 7000
			});

		for (const conn of tmp_editor.getConnections()) {
			await editor.addConnection(conn);
		}
		if (area) await AreaExtensions.zoomAt(area, editor.getNodes(), {});
	}
}