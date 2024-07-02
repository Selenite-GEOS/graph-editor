import { Node, type NodeParams, type OutDataParams } from '../Node';
import type { XmlAttribute, XmlAttributeDefinition } from './types';
import { camlelcaseize, titlelize } from '$lib/utils/string';
import type { Socket } from '../../socket/Socket';
import type { SocketType, XMLAttrType } from '$rete/plugin/typed-sockets';
import { XMLData } from './XMLData';
import type { InputControl } from '$rete/control/Control';
import { assignControl } from '$rete/customization/utils';
import { AddXmlAttributeControl } from './AddXmlAttributeControl';
import { ErrorWNotif } from '$lib/global';
import type { GeosSchema } from '$lib/geos';
import type { NodeFactory } from '$rete';
import 'regenerator-runtime/runtime';
import wu from 'wu';

export type XmlConfig = {
	noName?: boolean;
	xmlTag: string;
	outData?: OutDataParams;
	xmlProperties?: XmlAttributeDefinition[];
	childTypes?: string[];
};

export type XmlNodeParams = NodeParams & {
	xmlConfig: XmlConfig;
	initialValues?: Record<string, unknown>;
};

export class XmlNode extends Node<Record<string, Socket>, { value: Socket }> {
	// static __isAbstract = true;
	static hidden = true;
	static counts: Record<string, bigint> = {};
	name?: string;
	xmlTag: string;
	xmlInputs: Record<string, { tag?: string }> = {};
	xmlProperties: Set<string> = new Set();
	optionalXmlAttributes: Set<string> = new Set();
	xmlVectorProperties: Set<string> = new Set();
	params: { xmlConfig: XmlConfig } = { ...this.params };
	state: {
		attributeValues: Record<string, unknown>;
		usedOptionalAttrs: string[];
		name?: string;
	} = {
		...this.state,
		attributeValues: {},
		usedOptionalAttrs: []
	};

	constructor(xmlNodeParams: XmlNodeParams) {
		let { initialValues = {} } = xmlNodeParams;
		const xmlConfig = xmlNodeParams.xmlConfig;
		xmlNodeParams.params = {
			...xmlNodeParams.params,
			xmlConfig,
			initialValues,
			label: xmlNodeParams.label,
			noName: xmlConfig.noName
		};

		console.log('xmlNodeParams', xmlNodeParams);
		const { outData, xmlProperties, childTypes = [] } = xmlConfig;
		const { noName = false } = xmlConfig;
		super({ ...xmlNodeParams, width: 220, height: 40 });

		const { get, set } = this.factory.useState('XmlNode', 'pipeSetup', false);
		if (!get()) {
			set(true);
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

		if (!noName) {
			this.height += 15;
			if ('name' in initialValues) this.name = initialValues['name'] as string;
			else {
				let name = xmlNodeParams.label;
				name = name !== undefined ? name : '';
				XmlNode.counts[name] = XmlNode.counts[name] ? XmlNode.counts[name] + BigInt(1) : BigInt(1);
				this.name = camlelcaseize(name) + XmlNode.counts[name];
			}
			this.state.name = this.name;
		}
		this.xmlTag = xmlConfig.xmlTag;
		// console.log(this.name);

		// this.name = name + XmlNode.count;
		initialValues = initialValues !== undefined ? initialValues : {};

		if (xmlProperties)
			xmlProperties.forEach(({ name, type, isArray, controlType, required, pattern }) => {
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
			this.addControl('addXmlAttr', new AddXmlAttributeControl(this));
			this.height += 53;
		}

		// Add XML element inputs
		if (childTypes.length > 0)
			this.addXmlInData({
				index: -1,
				name: 'children',
				isArray: true,
				type: `xmlElement:${childTypes.join('|')}`
			});

		// Add XML output
		if (outData) {
			this.addOutData({
				name: 'value',
				displayName: noName ? undefined : this.name,
				displayLabel: false,
				socketLabel: outData.socketLabel,
				type: outData.type
			});
			this.height += 45;
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
		for (const name of this.state.usedOptionalAttrs) {
			this.addOptionalAttribute(name);
		}
		const { attributeValues } = this.state;
		for (const [key, value] of Object.entries(attributeValues)) {
			(this.inputs[key]?.control as InputControl)?.setValue(value);
		}
	}

	setName(name: string) {
		this.name = name;
		this.state.name = name;
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
		if (name.toLowerCase() === 'name') return;

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

		const { control: attrInputControl } = this.addInData({
			name: name,
			displayName: titlelize(name),
			socketLabel: titlelize(name),
			isRequired: required,
			type: type as SocketType,
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
								this.state.attributeValues[name] = value;
								this.getDataflowEngine().reset(this.id);
							}
						}
				  }
		});
		if (attrInputControl) {
			// console.log('attrInputControl', attrInputControl);
			const val = (attrInputControl as InputControl).value;
			if (val !== undefined) {
				this.state.attributeValues[name] = val;
				setTimeout(() => {
					this.getDataflowEngine().reset(this.id);
				});
			}
		} else {
			this.state.attributeValues[name] = initialValues[name];
		}

		this.height += isArray ? 58 : 65.5;
	}

	override data(inputs?: Record<string, unknown>): { value: XMLData } {
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
			name: this.name,
			properties: this.getProperties(inputs)
		});
		// console.log(xmlData);

		return { value: xmlData };
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
		index
	}: {
		name: string;
		tag?: string;
		type?: SocketType;
		isArray?: boolean;
		index?: number;
	}) {
		this.xmlInputs[name] = { tag: tag };
		this.addInData({
			name: name,
			displayName: titlelize(name),
			socketLabel: titlelize(name),
			type: type,
			isArray: isArray,
			index
		});
		this.height += 37;
	}
}

export function makeXmlNodeAction({
	complexType
}: {
	complexType: ReturnType<GeosSchema['complexTypes']['get']>;
}) {
	if (!complexType) throw new ErrorWNotif('Complex type is not valid');
	const name = complexType.name.match(/^(.*)Type$/)?.at(1);
	if (!name) throw new Error(`Invalid complex type name: ${complexType.name}`);

	const hasNameAttribute = complexType.attributes.has('name');
	// if (hasNameAttribute) complexTypesWithName.push(name);
	// complexTypes.push(name);

	const xmlNodeAction: (factory: NodeFactory) => Node = (factory) =>
		new XmlNode({
			label: name,
			factory: factory,

			xmlConfig: {
				noName: !hasNameAttribute,
				childTypes: complexType.childTypes.map((childType) => {
					const childName = childType.match(/^(.*)Type$/)?.at(1);
					if (!childName) return childType;
					return childName;
				}),
				xmlTag: name,
				outData: {
					name: name,
					type: `xmlElement:${name}`,
					socketLabel: name
				},

				xmlProperties: wu(complexType.attributes.values())
					.map((attr) => {
						return {
							name: attr.name,
							required: attr.required,
							// pattern: attr.pattern,
							type: attr.type,
							controlType: 'text'
						};
					})
					.toArray()
			}
		});
	return xmlNodeAction;
}
