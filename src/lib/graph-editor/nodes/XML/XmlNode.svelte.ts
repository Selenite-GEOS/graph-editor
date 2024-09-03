import {
	Node,
	path,
	registerConverter,
	registerNode,
	type NodeParams,
	type SocketsValues
} from '$graph-editor/nodes/Node.svelte';
import type { XmlAttributeDefinition } from './types';
import type { DataType, SocketType } from '$graph-editor/plugins/typed-sockets';
import { XMLData } from './XMLData';
import {
	type InputControl,
	type InputControlType,
	type Scalar,
	type Socket,
	assignControl,
	Control
} from '$graph-editor/socket';
import 'regenerator-runtime/runtime';
import wu from 'wu';
import { formatXml } from '$utils';
import {
	camlelcaseize,
	ComplexType,
	getSharedString,
	singular,
	splitCamelCase,
	XmlSchema,
	type Attribute,
	type SaveData
} from '@selenite/commons';
import { SvelteSet } from 'svelte/reactivity';

export class AddXmlAttributeControl extends Control {
	constructor(public readonly xmlNode: XmlNode) {
		super();
	}
}

export type XmlConfig = {
	complex: ComplexType | SaveData<ComplexType>;
	typePaths: string[][] | 'infinite';
	priorities?: Record<string, Record<string, number>>;
	// xmlTag: string;
	// outData?: OutDataParams;
	outLabel?: string;
	// childTypes?: string[];
	// childProps?: ChildProps[];
};

export type XmlNodeParams = NodeParams & {
	xmlConfig: XmlConfig;
	schema?: XmlSchema;
	initialValues?: Record<string, unknown>;
};

@registerNode('xml.ToString')
// @ts-expect-error TODO: fix this type error
@registerConverter('xmlElement:*', 'string')
@path('XML')
export class XmlToString extends Node<
	{ xml: Scalar<'xmlElement:*'> },
	{ value: Scalar<'string'> }
> {
	constructor(params: NodeParams = {}) {
		super({ label: '', ...params });
		this.addInData('xml', {
			type: 'xmlElement:*'
		});
		this.addOutData('value', {
			label: 'string',
			type: 'string'
		});
	}
	data(
		inputs?: SocketsValues<{ xml: Scalar<'xmlElement:*'> }> | undefined
	): SocketsValues<{ value: Scalar<'string'> }> {
		const xml = this.getData('xml', inputs) as unknown as XMLData;
		return { value: xml ? formatXml({ xml: xml.toXml() }) : '' };
	}
}

@registerNode('xml.XML', 'abstract')
export class XmlNode extends Node<
	Record<string, Socket<DataType>>,
	{ value: Scalar; name: Scalar<'groupNameRef'> },
	{ addXmlAttr: AddXmlAttributeControl },
	{ attributeValues: Record<string, unknown>; usedOptionalAttrs: string[] }
> {
	addOptionalAttribute(name: string) {
		this.usedOptionalAttrs.add(name);
		this.state.usedOptionalAttrs = Array.from(this.usedOptionalAttrs);
		const attr = this.complex.attributes.get(name);
		if (attr === undefined) throw new Error(`Property ${name} not found`);
		this.addInAttribute(attr);
		this.processDataflow();
	}

	addAllOptionalAttributes() {
		for (const name of this.optionalXmlAttributes) {
			this.addOptionalAttribute(name);
		}
	}
	removeOptionalAttribute(name: string) {
		this.usedOptionalAttrs.delete(name);
		this.state.usedOptionalAttrs = Array.from(this.usedOptionalAttrs);
		this.removeInput(name);
		this.processDataflow();
	}
	removeAllOptionalAttributes() {
		for (const name of this.usedOptionalAttrs) {
			this.removeOptionalAttribute(name);
		}
	}
	static counts: Record<string, number> = {};

	xmlTag: string;
	xmlInputs: Record<string, { tag?: string }> = {};
	xmlProperties: Set<string> = new Set();
	optionalXmlAttributes: Set<string> = new SvelteSet<string>();
	usedOptionalAttrs = new SvelteSet<string>();
	xmlVectorProperties: Set<string> = new SvelteSet<string>();

	hasName = $state(false);

	geosSchema = $derived(this.factory?.xmlSchemas.get('geos'));

	set name(n: string) {
		super.name =
			!this.hasName || (typeof n === 'string' && n.trim() !== '')
				? n
				: camlelcaseize(this.xmlTag) + XmlNode.counts[this.xmlTag]++;
		// Run dataflow in timeout to avoid running at setup
		this.processDataflow();
	}

	get name(): string | undefined {
		return super.name;
	}

	toJSON(): SaveData<Node> {
		const json = super.toJSON() as SaveData<Node> & { params: XmlNodeParams };
		const complex = json.params.xmlConfig.complex as ComplexType | SaveData<ComplexType>;
		return {
			...json,
			params: {
				...json.params,
				xmlConfig: {
					...json.params.xmlConfig,
					complex: complex instanceof ComplexType ? complex.toJSON() : complex
				}
			}
		};
	}

	childrenSockets = new Map<string, string>();
	complex: ComplexType;
	outLabel: string;
	typePaths: string[][] | 'infinite' | undefined = $state();
	// isMesh = $derived(
	// 	this.typePaths &&
	// 		this.typePaths !== 'infinite' &&
	// 		this.typePaths.length > 0 &&
	// 		this.typePaths.at(0)?.at(-1) === 'Mesh'
	// );
	constructor(xmlNodeParams: XmlNodeParams) {
		let { initialValues = {} } = xmlNodeParams;
		const xmlConfig = xmlNodeParams.xmlConfig;
		const schema = xmlNodeParams.schema;
		if (schema) {
			const typePath = schema.typePaths.get(xmlConfig.complex.name);
			if (typePath) {
				xmlConfig.typePaths = typePath;
			}
		}
		xmlNodeParams.params = {
			...xmlNodeParams.params,
			xmlConfig,
			initialValues
		};

		const { priorities: indices = {} } = xmlConfig;
		let complex = xmlConfig.complex;

		if (!complex) {
			throw new Error('Complex type is missing.');
		}
		super({ label: complex.name, ...xmlNodeParams });
		this.typePaths = xmlConfig.typePaths;

		if (!(complex instanceof ComplexType)) {
			complex = ComplexType.fromObject(complex);
		}
		this.complex = complex;

		if (this.state.usedOptionalAttrs) {
			this.usedOptionalAttrs = new SvelteSet(this.state.usedOptionalAttrs);
		}

		if (!this.state.usedOptionalAttrs) {
			this.state.usedOptionalAttrs = [];
		}
		this.xmlTag = complex.name;

		initialValues = initialValues ?? {};
		// this.initialValues = {inputs: initialValues};
		for (const attr of complex.attributes.values()) {
			const { name, required } = attr;

			if (name === 'name') {
				this.hasName = true;
				continue;
			}
			if (required) {
				this.addInAttribute({ ...attr, initialValues });
			}

			// if (!(name in this.initialValues.inputs!)) {
			// 	this.initialValues.inputs![name] = attr.default;
			// }
			if (!required) this.optionalXmlAttributes.add(name);
		}

		if (this.optionalXmlAttributes.size > 0) {
			this.addControl('addXmlAttr', new AddXmlAttributeControl(this));
		}
		for (const name of this.usedOptionalAttrs) {
			this.addOptionalAttribute(name);
		}

		// Add XML element inputs
		const requiredChildren = complex.requiredChildren;
		const isOnlyOptChildren = requiredChildren.length === 0;
		for (const child of requiredChildren) {
			const isArray = child.maxOccurs === undefined || child.maxOccurs > 1;
			const key = `child:${child.type}`;
			this.addXmlInData({
				index: -2 - (xmlConfig.priorities?.[this.xmlTag]?.[child.type] ?? 0),
				description: 'Required child.',
				name: key,
				type: `xmlElement:${child.type}`,
				isArray
			});
			this.childrenSockets.set(child.type, key);
		}
		const optChildTypes = complex.optionalChildTypes;
		if (optChildTypes.length > 0) {
			const sharedChildType = getSharedString(optChildTypes, { pluralize: true });
			const key = `child:${
				sharedChildType.length > 0 ? sharedChildType : isOnlyOptChildren ? this.xmlTag : 'optional'
			}`;
			this.addXmlInData({
				index: -1,
				name: key,
				description: 'Optional children of this node.',
				isArray: true,
				type: `xmlElement:${optChildTypes.join('|')}`
			});
			for (const childType of optChildTypes) {
				this.childrenSockets.set(childType, key);
			}
		}

		// Compute label of XML output
		// Computations are a bit complex in order to provide a meaningful label
		if (!xmlConfig.outLabel && schema) {
			xmlConfig.outLabel = complex.name;
			const parents = schema.parentsMap.get(complex.name);
			if (parents && parents.length > 0) {
				const sharedParent = getSharedString(parents);

				if (parents.length > 1 && sharedParent.length > 0) {
					xmlConfig.outLabel = sharedParent;
				} else if (parents.length === 1) {
					const parent = parents[0];
					const parentComplex = schema.complexTypes.get(parent);
					if (parentComplex && parentComplex.requiredChildren.length === 0) {
						xmlConfig.outLabel = singular(parent);
					}
				} else {
					const parentsChildren = wu(parents)
						.map((p) => schema.complexTypes.get(p)?.childTypes)
						.filter((s) => s !== undefined)
						.map(getSharedString)
						.filter((s) => s.length > 0)
						.toArray();

					const sharedParentChildren = getSharedString(parentsChildren);

					if (sharedParentChildren.length > 0) {
						xmlConfig.outLabel = sharedParentChildren;
					}
				}
			}
		}
		this.outLabel = xmlConfig.outLabel ?? complex.name;

		// Add XML output
		this.addOutData('value', {
			showLabel: true,
			label: xmlConfig.outLabel,
			description:
				'XML representation of this element.\n\nIt can be downloaded with a `Download` node, or connected to other elements.',
			type: `xmlElement:${this.xmlTag}`
		});
		this.description =
			(xmlConfig.outLabel !== complex.name ? `${xmlConfig.outLabel}: ` : '') +
			`${complex.name}\n\n` +
			(complex.requiredChildren.length > 0
				? `Required children: \n${complex.requiredChildren.map((s) => `- ${s.type}`).join('\n')}\n\n`
				: '') +
			(complex.optionalChildTypes.length > 0
				? `Optional children:\n${complex.optionalChildTypes.map((s) => `- ${s}`).join('\n')}`
				: '');

		if (this.hasName) {
			this.addOutData('name', {
				type: 'groupNameRef',
				description: 'Name of the element.\n\nIt can be used as a reference in other nodes.'
			});
			XmlNode.counts[this.xmlTag] = XmlNode.counts[this.xmlTag]
				? XmlNode.counts[this.xmlTag] + 1
				: 1;
			if (!this.state.name) {
				if ('name' in initialValues) this.name = initialValues['name'] as string;
				else {
					let name = this.xmlTag;
					this.name = camlelcaseize(name) + XmlNode.counts[name];
				}
			}
		}

		if (complex.name === 'InternalMesh') {
			this.addOutData('cellBlockNames', {
				type: 'groupNameRef',
				datastructure: 'array',
				label: 'Cell Block Names',
				description: 'The cell blocks defined by this internal mesh.'
			});
			// console.log(" INTERNAL MESH")
		}
	}

	async getXml(): Promise<string> {
		const inputs = await this.fetchInputs();
		const data = this.data(inputs).value as XMLData;
		return data.toXml();
	}

	setName(name: string) {
		this.name = name;
	}

	addInAttribute({
		name,
		type,
		default: default_,
		required,
		doc,
		initialValues = {}
	}: Attribute & { initialValues?: Record<string, unknown> }) {
		this.xmlProperties.add(name);
		let options: string[] | undefined = undefined;
		let controlType: InputControlType | undefined;
		const simpleType = this.geosSchema?.simpleTypeMap.get(type);
		const xmlTypePattern = /([^\W_]+)(?:_([^\W_]+))?/gm;
		const [, xmlType, xmlSubType] = xmlTypePattern.exec(type) || [];
		// console.log('xmlType', xmlType, xmlSubType);
		if (simpleType?.options) {
			console.log('simpleType', simpleType);
			options = simpleType.options;
		} else if (
			(name === 'target' && this.complex.name.includes('Event')) ||
			(name === 'sources' && this.complex.name.includes('History'))
		) {
			type = 'xmlElement:*';
		} else if (options) {
			controlType = 'select';
		} else if (xmlType === 'integer' && doc && doc.startsWith('Set to 1 to')) {
			doc = doc.replace('Set to 1 to', 'Set to true to');
			type = 'boolean';
			controlType = 'checkbox';
		} else if (assignControl(xmlType as SocketType) !== undefined) {
			type = xmlType as DataType;
			controlType = assignControl(xmlType as SocketType);
		} else if (xmlType.startsWith('real') || xmlType.startsWith('integer')) {
			type = xmlSubType && xmlSubType.endsWith('2d') ? 'vector' : 'number';
			controlType = assignControl(type as SocketType);
		} else if (xmlType.startsWith('R1Tensor')) {
			type = 'vector';
			controlType = assignControl(type as SocketType);
			if (default_) {
				const a = default_ as Array<number>;
				default_ = { x: a[0], y: a[1], z: a[2] };
			}
		} else if (xmlType === 'string') {
			type = 'string';
		} else {
			type = xmlType as DataType;
		}
		const isArray = xmlSubType && xmlSubType.startsWith('array');

		if (type === 'vector') this.xmlVectorProperties.add(name);

		this.addInData(name, {
			label: splitCamelCase(name).join(' '),
			description: doc?.replaceAll(':ref:', ''),
			initial: initialValues[name] ?? default_,
			isRequired: required,
			alwaysShowLabel: true,
			type: type as DataType,
			options,
			datastructure: isArray ? 'array' : 'scalar',
			control: {
				canChangeType: false
			}
		});
	}

	// @ts-expect-error TODO: fix this type error
	override data(inputs?: Record<string, unknown>): { value: XMLData; name?: string } {
		let children: XMLData[] = [];
		for (const [key, { tag }] of Object.entries(this.xmlInputs)) {
			const data = this.getData(key, inputs) as XMLData;
			if (data) {
				// if (tag) {
				// 	const childChildren: Array<XMLData> = data instanceof Array ? data : [data];

				// 	children.push(
				// 		new XMLData({
				// 			tag,
				// 			children: childChildren,
				// 			properties: {}
				// 		})
				// 	);
				// } else {
				children = [...children, ...(data instanceof Array ? data : [data])];
				// }
			}
		}

		const xmlData = new XMLData({
			node: this,
			tag: this.xmlTag,
			children: children,
			name: this.hasName ? this.name : undefined,
			properties: this.getProperties(inputs)
		});
		const res = { value: xmlData, name: this.name };
		if (this.complex.name === 'InternalMesh') {
			res.cellBlockNames = xmlData.properties['cellBlockNames'];
		}
		return res;
	}

	getProperties(inputs?: Record<string, unknown>): Record<string, unknown> {
		const properties: Record<string, unknown> = {};
		const isArray = (key: string) => (this.inputs[key]?.socket as Socket).datastructure === 'array';
		function prepData(data: unknown, type: DataType) {
			if (typeof data === 'boolean' && type === 'integer') {
				return data ? 1 : 0;
			}
			return data;
		}
		for (const key of this.xmlProperties) {
			let data = this.getData(key, inputs) as unknown | unknown[];
			if (data === undefined) continue;

			if (isArray(key) && !(data instanceof Array)) {
				data = [data];
			}
			if (isArray(key))
				data = (data as unknown[]).filter(v => typeof v === "boolean" ? true : Boolean(v))

			if (key === 'target' && this.complex.name.endsWith('Event')) {
				const target = data as XMLData | string;
				if (typeof target === 'object') {
					const node = target.node;
					// Only named nodes are valid targets (or so I think)
					if (!node.hasName) continue;
					const paths = node.typePaths;
					if (Array.isArray(paths)) {
						const path = paths[0];
						if (path.at(0) === 'Problem') path.splice(0, 1);
						data = '/' + path.join('/') + '/' + node.name;
					}
				}
			} else if (key === 'sources' && this.complex.name.endsWith('History')) {
				const sources = data as (XMLData | string)[];
				data = sources.map((source) => {
					if (typeof source === 'object') {
						const node = source.node;
						if (!node.hasName) return '';
						const paths = node.typePaths;
						if (Array.isArray(paths)) {
							const path = paths[0];
							if (path.at(0) === 'Problem') path.splice(0, 1);
							return '/' + path.join('/') + '/' + node.name;
						}
					}
					return '';
				});
			}

			// Ensure that integer properties are not booleans
			const type = this.complex.attributes.get(key)?.type;
			if (type === 'integer') {
				if (isArray(key)) {
					data = (data as number[]).map((v) => prepData(v, type));
				} else {
					data = prepData(data as number, type);
				}
			}

			if (this.xmlVectorProperties.has(key)) {
				if (isArray(key)) {
					properties[key] = (data as Array<Record<string, number>>).map((value) =>
						Object.values(value)
					);
				} else properties[key] = Object.values(data as Record<string, number>);
			} else {
				properties[key] = data;
			}
		}
		return properties;
	}

	addXmlInData({
		name,
		tag,
		type = 'any',
		isArray = false,
		index,
		required,
		description
	}: {
		name: string;
		tag?: string;
		type?: DataType;
		isArray?: boolean;
		index?: number;
		required?: boolean;
		description?: string;
	}) {
		this.xmlInputs[name] = { tag: tag };
		this.addInData(name, {
			label: name.startsWith('child:') ? name.split(':')[1] : name,
			type: type,
			description,
			datastructure: isArray ? 'array' : 'scalar',
			index,
			isRequired: required
		});
	}
}
