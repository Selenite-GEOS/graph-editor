import { BaseComponent } from '$graph-editor/components';
import wu from 'wu';
import type { NodeFactory } from './NodeFactory.svelte';
import { Connection, Node, XmlNode } from '$graph-editor/nodes';
import {
	animationFrame,
	browser,
	buildXml,
	mergeParsedXml,
	newLocalId,
	parseXml,
	type ParsedXmlNodes,
	type XmlSchema
} from '@selenite/commons';
import { ErrorWNotif } from '$lib/global';
import type { NodeView } from 'rete-area-plugin';
import type { WorkerMessage as WorkerMessage, WorkerResult } from './CodeIntegration.worker';
import { xmlToGraph } from './code-integration/utils.svelte';
import { tick } from 'svelte';

let worker: Worker | undefined;

function instantiateWorker() {
	if (!worker) {
		worker = new Worker(new URL('./CodeIntegration.worker.ts', import.meta.url), {
			type: 'module'
		});
		console.debug('Code Integration worker initiated.');
	}
}

if (browser)
requestIdleCallback(() => {
	instantiateWorker();
});

export class CodeIntegration extends BaseComponent<NodeFactory> {
	/**
	 * Pulls the selected nodes from the graph editor to the code editor
	 */
	async toCode({ text = '', schema }: { text?: string; schema: XmlSchema }): Promise<string> {
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

		const { structures } = await import('rete-structures');
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
		return buildXml({ parsedXml: res, cursorTag });
	}

	/**
	 * Pushes the selected text from the code editor to the graph editor
	 */
	async toGraph({ text, schema }: { schema: XmlSchema; text: string }) {
		const t0 = performance.now();
		const factory = this.owner;
		if (!browser) return;
		instantiateWorker();
		if (!worker) throw new ErrorWNotif('Worker not instantiated');
		const msg: WorkerMessage = { type: 'xmlToGraph', xml: text, schema: schema.toJSON() };
		worker.postMessage(msg);
		worker.onmessage = async (e: MessageEvent<WorkerResult>) => {
			const data = e.data;
			if (data.type !== 'xmlToGraph') return;
			const { nodes, connections } = data;
			console.log('nodes', nodes);
			console.debug('xmlToGraph took', performance.now() - t0, 'ms');
			let addedNodes: Node[] = $state([]);
			let addedConns: Connection[] = $state([]);
			const notifId = newLocalId("code-integration-progress");
			factory.notifications.show({
				id: notifId,
				title: 'Code Integration',
				autoClose: false,
				get message() {
					return `Progress: ${(((addedNodes.length + addedConns.length) / (nodes.length + connections.length)) * 100).toFixed(2)}%`;
				}
			});

			for (const [i, node] of nodes.entries()) {
				const n = await Node.fromJSON(node, { factory });
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
			await animationFrame(2)
			await factory.arrange?.layout();
			for (const node of addedNodes) {
				node.visible = true;
			}
			
			factory.focusNodes(addedNodes)
			setTimeout(() => {
				factory.notifications.hide(notifId);
			}, 1000);
			if (import.meta.env.MODE === 'development')
				factory.notifications.info({
					title: 'Graph Editor',
					message: 'It took ' + ((performance.now() - t0) / 1000).toFixed(2) + ' s to parse the xml'
				});
		};

		return;

		

		await factory.bulkOperation(async () => {
			const area = factory.getArea();
			let leftBound = 0;
			if (area) {
				wu(area.nodeViews.values()).forEach((nodeView) => {
					leftBound = Math.min(leftBound, nodeView.position.x - nodeView.element.offsetWidth * 1.4);
				});
			}
			const tmp_area = factory.area;
			if (tmp_area) {
				for (const [i, node] of nodesToAdd.entries()) {
					const tmp_nodeView = tmp_area.nodeViews.get(node.id) as NodeView;
					const nodeView = factory.getArea()?.nodeViews.get(node.id);
					factory.select(node, { accumulate: i !== 0 });
					// if (nodeView)
					// 	await nodeView.translate(tmp_nodeView.position.x + leftBound, tmp_nodeView.position.y);
					await factory.getArea()?.update('node', node.id);
				}
				factory.selector.releasePicked();
			}
			factory.notifications.hide('code-integration-progress');
			if (nodesToAdd.length > 0)
				factory.notifications.show({
					title: 'Graph editor',
					message: `${nodesToAdd.length} added nodes have been selected. They can be dragged using CTRL + Left mouse button.`,
					autoClose: 7000
				});

			if (area) {
				const { AreaExtensions } = await import('rete-area-plugin');
				await AreaExtensions.zoomAt(area, editor.getNodes(), {});
			}
		});
		
	}
}
