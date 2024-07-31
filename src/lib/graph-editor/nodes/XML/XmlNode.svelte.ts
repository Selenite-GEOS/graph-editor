import {
	hidden,
	Node,
	path,
	registerConverter,
	registerNode,
	type NodeParams,
	type OutDataParams,
	type SocketsValues
} from '$graph-editor/nodes/Node.svelte';
import type { XmlAttributeDefinition } from './types';
import { camlelcaseize, titlelize } from '$lib/utils/string';
import type { DataType, SocketType } from '$graph-editor/plugins/typed-sockets';
import { XMLData } from './XMLData';
import {
	type InputControl,
	type Scalar,
	type Socket,
	assignControl,
	Control
} from '$graph-editor/socket';
import { ErrorWNotif } from '$lib/global/index.svelte';
import type { GeosSchema } from '$lib/geos';
import type { NodeFactory } from '$graph-editor/editor';
import 'regenerator-runtime/runtime';
import wu from 'wu';
import { formatXml } from '$utils';
import {
	ComplexType,
	getSharedString,
	singular,
	splitCamelCase,
	type ChildProps,
	type SaveData
} from '@selenite/commons';

export class AddXmlAttributeControl extends Control {
	constructor(public readonly xmlNode: XmlNode) {
		super();
	}
}

export type XmlConfig = {
	complex?: ComplexType | SaveData<ComplexType>;
	priorities?: Record<string, Record<string, number>>;
	xmlTag: string;
	// outData?: OutDataParams;
	outLabel?: string;
	xmlProperties?: XmlAttributeDefinition[];
	childTypes?: string[];
	childProps?: ChildProps[];
};

export type XmlNodeParams = NodeParams & {
	xmlConfig: XmlConfig;
	initialValues?: Record<string, unknown>;
};

@registerNode('xml.ToString')
@registerConverter('xmlElement:*', 'string')
@path('XML')
export class XmlToString extends Node<
	{ xml: Scalar<'xmlElement:*'> },
	{ value: Scalar<'string'> }
> {
	constructor(params: NodeParams = {}) {
		super({ label: 'To String', ...params });
		this.addInData('xml', {
			type: 'xmlElement:*'
		});
		this.addOutData('value', {
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
	{ value: Scalar; name?: Scalar<'groupNameRef'> },
	{ addXmlAttr: AddXmlAttributeControl },
	{ attributeValues: Record<string, unknown>; usedOptionalAttrs: string[] }
> {
	static counts: Record<string, number> = {};

	xmlTag: string;
	xmlInputs: Record<string, { tag?: string }> = {};
	xmlProperties: Set<string> = new Set();
	optionalXmlAttributes: Set<string> = new Set();
	xmlVectorProperties: Set<string> = new Set();

	hasName = $state(false);

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

	constructor(xmlNodeParams: XmlNodeParams) {
		let { initialValues = {} } = xmlNodeParams;
		const xmlConfig = xmlNodeParams.xmlConfig;
		xmlNodeParams.params = {
			...xmlNodeParams.params,
			xmlConfig,
			initialValues
		};

		console.debug('xmlNodeParams', xmlNodeParams);
		const { xmlProperties, priorities: indices = {} } = xmlConfig;
		let complex = xmlConfig.complex;
		super({ label: xmlConfig.xmlTag, ...xmlNodeParams });
		if (!complex) {
			throw new Error('Complex type is missing.');
		}

		if (!(complex instanceof ComplexType)) {
			complex = ComplexType.fromObject(complex);
		}

		if (!this.state.usedOptionalAttrs) {
			this.state.usedOptionalAttrs = [];
		}
		this.xmlTag = xmlConfig.xmlTag;
		// console.log(this.name);

		// this.name = name + XmlNode.count;
		initialValues = initialValues !== undefined ? initialValues : {};
		if (xmlProperties)
			xmlProperties.forEach(({ name, type, isArray, controlType, required, pattern }) => {
				if (name === 'name') {
					this.hasName = true;
					return;
				}
				if (required || name in initialValues) {
					this.addInAttribute({
						name,
						type,
						isArray,
						controlType,
						required,
						pattern,
						initialValues
					});
				} else {
					this.optionalXmlAttributes.add(name);
				}
			});

		if (this.optionalXmlAttributes.size > 0) {
			// this.addControl('addXmlAttr', new AddXmlAttributeControl(this));
		}

		// Add XML element inputs
		const requiredChildren = complex.requiredChildren;
		const isOnlyOptChildren = requiredChildren.length === 0;
		for (const child of requiredChildren) {
			const isArray = child.maxOccurs === undefined || child.maxOccurs > 1;
			this.addXmlInData({
				index: -2 - (xmlConfig.priorities?.[xmlConfig.xmlTag]?.[child.type] ?? 0),
				name: child.type,
				type: `xmlElement:${child.type}`,
				isArray
			});
		}
		const optChildTypes = complex.optionalChildTypes;
		if (optChildTypes.length > 0) {
			const sharedChildType = getSharedString(optChildTypes, { pluralize: true });
			this.addXmlInData({
				index: -1,
				name:
					sharedChildType.length > 0
						? sharedChildType
						: isOnlyOptChildren
							? this.xmlTag
							: 'optional',
				isArray: true,
				type: `xmlElement:${optChildTypes.join('|')}`
			});
		}

		// Add XML output
		this.addOutData('value', {
			showLabel: true,
			label: xmlConfig.outLabel,
			type: `xmlElement:${xmlConfig.xmlTag}`
		});

		if (this.hasName) {
			this.addOutData('name', {
				type: 'groupNameRef'
			});
			XmlNode.counts[xmlConfig.xmlTag] = XmlNode.counts[xmlConfig.xmlTag]
				? XmlNode.counts[xmlConfig.xmlTag] + 1
				: 1;
			if (!this.state.name) {
				if ('name' in initialValues) this.name = initialValues['name'] as string;
				else {
					let name = xmlConfig.xmlTag;
					this.name = camlelcaseize(name) + XmlNode.counts[name];
				}
			}
		}

		if (!this.factory) return;
		const pipeSetup = this.factory.useState('XmlNode', 'pipeSetup', false);
		if (!pipeSetup.value) {
			pipeSetup.value = true;
			this.factory.getArea()?.addPipe((ctx) => {
				if (ctx.type === 'contextmenu') {
					const { context, event } = ctx.data;
					if (!(context instanceof XmlNode)) return ctx;
					const node = context;
					if (!(event.target instanceof HTMLSpanElement)) return ctx;
					const input = event.target.closest('.rete-input');
					if (!(input instanceof HTMLElement)) return ctx;
					const testid = input.dataset.testid;
					if (!testid) return ctx;
					const key = testid.split('-')[1];
					node.removeOptionalAttribute(key);
					return ctx;
				}
				return ctx;
			});
		}
	}

	async getXml(): Promise<string> {
		const inputs = await this.fetchInputs();
		const data = this.data(inputs).value as XMLData;
		return data.toXml();
	}

	addOptionalAttribute(name: string) {
		const prop = this.params.xmlConfig.xmlProperties?.find((prop) => prop.name === name);
		if (prop === undefined) throw new Error(`Property ${name} not found`);
		if (!this.state.usedOptionalAttrs.includes(name)) this.state.usedOptionalAttrs.push(name);
		this.addInAttribute(prop);
		this.updateElement();
		console.log('updateElement', this.controls['addXmlAttr'].id);
		this.updateElement('control', this.controls['addXmlAttr'].id);
	}

	removeOptionalAttribute(name: string) {
		console.log('removeOptionalAttribute', name);
		const prop = this.params.xmlConfig.xmlProperties?.find((prop) => prop.name === name);
		if (prop?.required === true) {
			throw new ErrorWNotif(`Property ${name} is required and cannot be removed`);
		}
		if (prop === undefined) throw new Error(`Property ${name} not found`);
		const index = this.state.usedOptionalAttrs.indexOf(name);
		if (index !== -1) this.state.usedOptionalAttrs.splice(index, 1);
		console.log('index', index);
		this.removeInput(name);
		this.height -= prop.isArray ? 58 : 65.5;
		this.updateElement();
		this.updateElement('control', this.controls['addXmlAttr'].id);
	}

	override applyState(): void {
		if (this.state.name) this.name = this.state.name;
		// console.log(this.state);
		for (const name of this.state.usedOptionalAttrs ?? []) {
			this.addOptionalAttribute(name);
		}
		const { attributeValues } = this.state;
		for (const [key, value] of Object.entries(attributeValues ?? {})) {
			(this.inputs[key]?.control as InputControl)?.setValue(value);
		}
	}

	setName(name: string) {
		this.name = name;
	}

	addInAttribute({
		name,
		type,
		isArray,
		controlType,
		required,
		options,
		pattern,
		initialValues = {}
	}: XmlAttributeDefinition & { initialValues?: Record<string, unknown> }) {
		this.xmlProperties.add(name);

		const xmlTypePattern = /([^\W_]+)(?:_([^\W_]+))?/gm;
		const [, xmlType, xmlSubType] = xmlTypePattern.exec(type) || [];
		console.log('xmlType', xmlType, xmlSubType);
		if (options) {
			controlType = 'select';
		} else if (assignControl(xmlType as SocketType) !== undefined) {
			type = xmlType as SocketType;
			controlType = assignControl(xmlType as SocketType);
		} else if (xmlType.startsWith('real') || xmlType.startsWith('integer')) {
			type = xmlSubType && xmlSubType.endsWith('2d') ? 'vector' : 'number';
			controlType = assignControl(type as SocketType);
		} else if (xmlType.startsWith('R1Tensor')) {
			type = 'vector';
			controlType = assignControl(type as SocketType);
		} else if (xmlType === 'string') {
			type = 'string';
		} else {
			type = xmlType;
		}
		isArray = (xmlSubType && xmlSubType.startsWith('array')) || isArray;

		if (type === 'vector') this.xmlVectorProperties.add(name);

		const { control: attrInputControl } = this.addInData(name, {
			label: splitCamelCase(name).join(' '),
			isRequired: required,
			isLabelDisplayed: true,
			type: type as DataType,
			isArray: isArray,
			control: isArray
				? undefined
				: controlType && {
						type: controlType,
						options: {
							options,
							label: titlelize(name),
							initial: initialValues[name],
							pattern: pattern,
							debouncedOnChange: (value) => {
								console.log('debouncedOnChange', value);
								// this.state.attributeValues[name] = value;
								this.getDataflowEngine().reset(this.id);
							}
						}
					}
		});
		if (attrInputControl) {
			// console.log('attrInputControl', attrInputControl);
			const val = (attrInputControl as InputControl).value;
			if (val !== undefined) {
				// this.state.attributeValues[name] = val;
				setTimeout(() => {
					this.getDataflowEngine().reset(this.id);
				});
			}
		} else {
			// this.state.attributeValues[name] = initialValues[name];
		}

		this.height += isArray ? 58 : 65.5;
	}

	override data(inputs?: Record<string, unknown>): { value: XMLData; name?: string } {
		let children: XMLData[] = [];
		for (const [key, { tag }] of Object.entries(this.xmlInputs)) {
			const data = this.getData(key, inputs) as XMLData;
			if (data) {
				if (tag) {
					const childChildren: Array<XMLData> = data instanceof Array ? data : [data];

					children.push(
						new XMLData({
							tag: tag,
							children: childChildren,
							properties: {}
						})
					);
				} else {
					children = [...children, ...(data instanceof Array ? data : [data])];
				}
			}
		}

		const xmlData = new XMLData({
			tag: this.xmlTag,
			children: children,
			name: this.hasName ? this.name : undefined,
			properties: this.getProperties(inputs)
		});
		// console.log(xmlData);

		return { value: xmlData, name: this.name };
	}

	getProperties(inputs?: Record<string, unknown>): Record<string, unknown> {
		const properties: Record<string, unknown> = {};
		// console.log(this.xmlProperties);
		const isArray = (key: string) => (this.inputs[key]?.socket as Socket).isArray;
		for (const key of this.xmlProperties) {
			// console.log(key);
			let data = this.getData(key, inputs) as
				| Record<string, unknown>
				| Array<Record<string, unknown>>;
			if (data !== undefined) {
				if (isArray(key) && !(data instanceof Array)) {
					data = [data];
				}
				if (this.xmlVectorProperties.has(key)) {
					if (isArray(key)) {
						properties[key] = (data as Array<Record<string, number>>).map((value) =>
							Object.values(value)
						);
					} else properties[key] = Object.values(data);
				} else {
					properties[key] = data;
				}
			}
		}
		// console.log(properties);
		return properties;
	}

	addXmlInData({
		name,
		tag,
		type = 'any',
		isArray = false,
		index,
		required
	}: {
		name: string;
		tag?: string;
		type?: DataType;
		isArray?: boolean;
		index?: number;
		required?: boolean;
	}) {
		this.xmlInputs[name] = { tag: tag };
		this.addInData(name, {
			label: name,
			type: type,
			datastructure: isArray ? 'array' : 'scalar',
			index,
			isRequired: required
		});
		this.height += 37;
	}
}

// export function makeXmlNodeAction({
// 	complexType
// }: {
// 	complexType: ReturnType<GeosSchema['complexTypes']['get']>;
// }) {
// 	if (!complexType) throw new ErrorWNotif('Complex type is not valid');
// 	const name = complexType.name.match(/^(.*)Type$/)?.at(1);
// 	if (!name) throw new Error(`Invalid complex type name: ${complexType.name}`);

// 	const hasNameAttribute = complexType.attributes.has('name');
// 	// if (hasNameAttribute) complexTypesWithName.push(name);
// 	// complexTypes.push(name);

// 	const xmlNodeAction: (factory: NodeFactory) => Node = (factory) =>
// 		new XmlNode({
// 			label: name,
// 			factory: factory,

// 			xmlConfig: {
// 				noName: !hasNameAttribute,
// 				childTypes: complexType.childTypes.map((childType) => {
// 					const childName = childType.match(/^(.*)Type$/)?.at(1);
// 					if (!childName) return childType;
// 					return childName;
// 				}),
// 				xmlTag: name,
// 				outData: {
// 					name: name,
// 					type: `xmlElement:${name}`,
// 					socketLabel: name
// 				},

// 				xmlProperties: wu(complexType.attributes.values())
// 					.map((attr) => {
// 						return {
// 							name: attr.name,
// 							required: attr.required,
// 							// pattern: attr.pattern,
// 							type: attr.type,
// 							controlType: 'text'
// 						};
// 					})
// 					.toArray()
// 			}
// 		});
// 	return xmlNodeAction;
// }
