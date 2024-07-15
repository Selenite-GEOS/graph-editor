import { ErrorWNotif, type resolveContext } from '$lib/global/index.svelte';
import {
	type X2jOptionsOptional,
	XMLParser,
	type XmlBuilderOptionsOptional
} from 'fast-xml-parser';
import 'regenerator-runtime/runtime';
import { get } from 'svelte/store';
import wu from 'wu';
import * as __ from 'lodash-es';

const fxpSettings: X2jOptionsOptional & XmlBuilderOptionsOptional = {
	preserveOrder: true,
	attributeNamePrefix: '',
	ignoreAttributes: false,
	commentPropName: '#comment',
	parseAttributeValue: false,
	trimValues: true,
	format: true,
	ignoreDeclaration: false
};

function parseXml(xml: string): ParsedXmlNodes {
	const parser = new XMLParser({
		...fxpSettings
	});
	const parsed = parser.parse(xml) as ParsedXmlNodes;
	return parsed;
}

export function buildXml({
	parsedXml,
	indent = 2,
	baseSpace = '',
	cursorTag
}: {
	parsedXml: ParsedXmlNodes;
	indent?: number;
	baseSpace?: string;
	cursorTag?: string;
}): string {
	const space = ' '.repeat(indent);
	const res: { xml: string; newLine?: boolean }[] = [];
	for (const element of parsedXml) {
		const attrs: string[] = [];
		let tag = '';
		let childXml = '';
		for (const [key, props] of Object.entries(element)) {
			if (key === cursorTag) continue;
			switch (key) {
				case cursorTag:
					break;
				case '#comment':
					res.push({ xml: `${baseSpace}<!--${props[0]['#text']}-->` });
					break;
				case ':@':
					for (const [attr, value] of Object.entries(props as ParsedXmlAttribute)) {
						attrs.push(`${baseSpace}${space}${attr}="${value}"`);
					}
					break;
				case '#text':
					break;
				default:
					tag = key;
					const children = props as ParsedXmlNodes;
					childXml = buildXml({
						parsedXml: children,
						indent,
						baseSpace: baseSpace + space,
						cursorTag
					});
					break;
			}
		}
		const preppedAttrs =
			attrs.length > 1 ? `\n${attrs.join('\n')}` : attrs.length === 1 ? ` ${attrs[0].trim()}` : '';
		if (tag)
			if (childXml.length === 0)
				res.push({
					xml:
						baseSpace +
						`<${tag}${preppedAttrs}${tag === '?xml' ? '?' : ' /'}>${tag === '?xml' ? '\n' : ''}`,
					newLine: attrs.length > 1
				});
			else
				res.push({
					xml: `${baseSpace}<${tag}${preppedAttrs}>\n${childXml}${
						childXml.at(-1) !== '\n' ? '\n' : ''
					}${baseSpace}</${tag}>`,
					newLine: true
				});
	}
	return wu(res)
		.map(({ xml, newLine }) => (newLine ? xml + '\n' : xml))
		.reduce((a, b) => a + (a ? '\n' : '') + b, '');
}

export function getElementFromParsedXml(xml: Record<string, unknown>): string | null {
	for (const key in xml) {
		if ([':@', '#text', '#comment'].includes(key)) continue;
		return key;
	}
	return null;
}

/**
 * Returns the different paths to the possible merge positions
 * @param param0
 * @returns
 */
export function findPossibleMergePositions({
	baseXml,
	element,
	typesPaths,
	cursorTag
}: {
	baseXml: ParsedXmlNodes;
	element: string;
	typesPaths: Record<string, string[]>;
	cursorTag?: string;
}): { path: { pos: number; key: string }[]; withCursor: boolean }[] {
	type T = ReturnType<typeof findPossibleMergePositions>[number];

	function rec(elementPath: string[], path: T, xml: ParsedXmlNodes): T[] {
		if (elementPath.length === 0)
			return [
				{
					...path,
					withCursor: cursorTag ? path.withCursor || cursorTag in xml : false
				}
			];

		const possiblePathsEntryPoints = xml.filter(
			(xmlNode) => getElementFromParsedXml(xmlNode) === elementPath[0]
		);
		if (possiblePathsEntryPoints.length === 0) {
			return [
				{
					...path,
					withCursor: cursorTag ? path.withCursor || cursorTag in xml : false
				}
			];
		}

		return wu(xml.entries())
			.filter(([i, xmlNode]) => getElementFromParsedXml(xmlNode) === elementPath[0])
			.map(([i, xmlNode]) =>
				rec(
					elementPath.slice(1),
					{
						path: [...path.path, { pos: i, key: getElementFromParsedXml(xmlNode) }],
						withCursor: cursorTag ? path.withCursor || cursorTag in xml[i] : false
					},
					(xml[i] as Record<string, ParsedXmlNodes>)[getElementFromParsedXml(xml[i])]
				)
			)
			.reduce((a, b) => [...a, ...b], []);
	}

	return rec(typesPaths[element], { path: [], withCursor: false }, baseXml);
}

export function getXmlAttributes(xml: {
	[key: string]: ParsedXmlNodes | ParsedXmlNode[] | ParsedXmlAttribute | undefined;
	':@'?: ParsedXmlAttribute | undefined;
}): Record<string, string> {
	return ':@' in xml ? (xml[':@'] as Record<string, string>) : {};
}

function mergeRec(base: Record<string, ParsedXmlNodes>[], toAdd: Record<string, ParsedXmlNodes>[]) {
	wu(toAdd).forEach((xmlNode) => {
		const key = getElementFromParsedXml(xmlNode);
		const elementMergeCandidate = wu(base)
			.filter((base_xmlNode) => getElementFromParsedXml(base_xmlNode) == key)
			.take(1)
			.toArray()
			.at(0);

		if (
			elementMergeCandidate &&
			!('name' in getXmlAttributes(elementMergeCandidate)) &&
			__.isEqual(getXmlAttributes(elementMergeCandidate), getXmlAttributes(xmlNode))
		)
			mergeRec(
				elementMergeCandidate[key] as Record<string, ParsedXmlNodes>[],
				xmlNode[key] as Record<string, ParsedXmlNodes>[]
			);
		else return base.push(xmlNode);
	});
}
export function mergeParsedXml({
	baseXml,
	newXml,
	geosContext,
	cursorTag
}: {
	baseXml: ParsedXmlNodes;
	newXml: ParsedXmlNodes;
	cursorTag?: string;
	geosContext: resolveContext<'geos'>;
}): ParsedXmlNodes {
	const typesPaths = get(geosContext.typesPaths);
	if (!typesPaths) throw new ErrorWNotif('No typesPaths in geosContext');

	const res = JSON.parse(JSON.stringify(baseXml)) as ParsedXmlNodes;
	wu(newXml).forEach((newXmlNode) => {
		const element = getElementFromParsedXml(newXmlNode);

		const mergePositions = findPossibleMergePositions({
			baseXml,
			element,
			typesPaths,
			cursorTag
		});

		if (mergePositions.length === 0) throw new ErrorWNotif('No merge position found');
		let selectedMergePosition = mergePositions[0];

		if (mergePositions.length > 1) {
			selectedMergePosition = wu(mergePositions)
				.filter(({ withCursor }) => withCursor)
				.reduce((a, b) => {
					if (a !== undefined) throw new ErrorWNotif('Too many selected merge positions');
					return b;
				}, undefined);
		}

		const elementPath = typesPaths[element];
		const mergePath = selectedMergePosition.path;
		const target = wu(mergePath).reduce(
			({ ePath, base }, mergePathStep) => {
				return {
					base: (base[mergePathStep.pos] as Record<string, ParsedXmlNodes>)[mergePathStep.key],
					ePath: ePath.slice(1)
				};
			},
			{ ePath: elementPath, base: res }
		);
		let toGlue = newXmlNode;
		for (const step of target.ePath.toReversed()) {
			toGlue = {
				[step]: [toGlue]
			};
		}
		// Now we have a glue path ready, we can merge
		// We have to find the elements that can be merged like identic tags and attributes,
		// without names

		mergeRec(target.base as Record<string, ParsedXmlNodes>[], [
			toGlue as Record<string, ParsedXmlNodes>
		]);
	});
	return res;
}

function formatXml({ xml, indent = 2 }: { xml: string; indent?: number }): string {
	const parsedXml = parseXml(xml);
	return buildXml({ parsedXml, indent });
}

function formatComment(comment: string): string {
	return `<!-- ${comment.trim()} -->`;
}

type ParsedXmlAttribute = Record<string, string>;

type ParsedXmlNode = {
	'#text'?: string;
	[key: string]: ParsedXmlAttribute | Array<ParsedXmlNode> | string | undefined;
};

type parsedXmlComment = {
	'#comment': string;
};

type ParsedXmlNodes = Array<
	| parsedXmlComment
	| {
			':@'?: ParsedXmlAttribute;
			[key: string]: ParsedXmlNodes | Array<ParsedXmlNode> | ParsedXmlAttribute | undefined;
	  }
>;

export type { ParsedXmlNodes, ParsedXmlNode, parsedXmlComment, ParsedXmlAttribute };
export { parseXml, formatXml, formatComment };
