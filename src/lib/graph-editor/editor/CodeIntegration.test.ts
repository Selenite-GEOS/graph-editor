import { Node, XmlNode } from '$graph-editor/nodes';
import { setupGraphEditor } from '$graph-editor/setup';
import { ChildProps, ComplexType, XmlSchema } from '@selenite/commons';
import { describe, it, expect } from 'vitest';
import type { NodeFactory } from './NodeFactory.svelte';

function getSchema(): XmlSchema {
	const schema = new XmlSchema();
	schema.addComplexType(
		new ComplexType({
			name: 'Test',
			children: [
				new ChildProps({
					type: 'TestA',
				}),
				new ChildProps({
					type: 'TestB'
				})
			]
		}),
		new ComplexType({
			name: 'TestA',
			attributes: [
				{
					name: 'a',
					default: null,
					type: 'string',
					required: true
				}
			]
		}),
		new ComplexType({
			name: 'TestB',
			attributes: [
				{
					name: 'b',
					default: null,
					type: 'string',
					required: false
				}
			]
		})
	);
	return schema;
}

/**
 * 
 * Graph Editor Schema:
 * <Test>
 *   <TestA a="string" />
 *   <TestB b="string" />
 * </Test>
 * <Test />
 */
type TestNodes = Record<'TestA' | 'TestB' | 'Test' | 'LonerTest', Node>;
async function getGraph({toSelect}: {toSelect: string[]}): Promise<{factory: NodeFactory, schema: XmlSchema} & TestNodes> {
	const { factory, editor } = await setupGraphEditor();
	const schema = getSchema();
    const nodes: Partial<TestNodes> = {}
    nodes["Test"] = await factory.addNode(XmlNode, {
        xmlConfig: {
            complex: schema.complexTypes.get('Test')!,
        }
    })
    nodes['LonerTest'] = await factory.addNode(XmlNode, {
        xmlConfig: {
            complex: schema.complexTypes.get('Test')!,
        }
    })
    nodes["TestA"] = await factory.addNode(XmlNode, {
        xmlConfig: {
            complex: schema.complexTypes.get('TestA')!,
        }
    })
    await editor.addNewConnection(nodes["TestA"], "value", nodes["Test"], "Tests");
    nodes["TestB"] = await factory.addNode(XmlNode, {
        xmlConfig: {
            complex: schema.complexTypes.get('TestB')!,
        }
    })
    await editor.addNewConnection(nodes["TestB"], "value", nodes["Test"], "Tests");
    for (const key of toSelect) {
        if (!(key in nodes)) throw new Error(`Node ${key} not found`);
        factory.select(nodes[key as keyof TestNodes]!);
    }
    return {
        factory,
        schema,
        ...nodes as TestNodes
    }
}

describe('CodeIntegration', () => {
	describe('toCode', () => {
		it('should return the xml of a selected node in a graph', async () => {
            const {factory, schema} = await getGraph({toSelect: ['TestA']});
			const res = await factory.codeIntegration.toCode({ schema });
			expect(res).toBe('<Test>\n  <TestA />\n</Test>\n');
		});
        it('should return the xml of a selected node including its children', async () => {
            const {factory, schema} = await getGraph({toSelect: ['Test']});
            const res = await factory.codeIntegration.toCode({ schema });
            expect(res).toBe('<Test>\n  <TestA />\n  <TestB />\n</Test>\n');
        });
        it('should return the xml of a selected node with no type path and no children', async () => {
            const {factory, schema} = await getGraph({toSelect: ['LonerTest']});
            const res = await factory.codeIntegration.toCode({ schema });
            expect(res).toBe('<Test />\n');
        });
	});
});
