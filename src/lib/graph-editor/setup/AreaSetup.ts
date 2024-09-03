import type { NodeEditor, NodeFactory } from '$graph-editor/editor';
import type { AreaExtra } from '$graph-editor/area';
import type { Schemes } from '$graph-editor/schemes';
import { AreaPlugin, type Area2D } from 'rete-area-plugin';
import { SetupClass, type Setup, type SetupFunction } from './Setup';
import type { Root } from 'rete';
import {
	getDraggedGraph,
	getDraggedVariableId,
	isDraggedGraph,
	isDraggedVariable
} from '$graph-editor/utils';
import { animationFrame, posFromClient } from '@selenite/commons';
import { GraphNode, MacroNode, VariableNode } from '$graph-editor';
import { clientToSurfacePos } from '$utils/html';
import { tick } from 'svelte';

export class AreaSetup extends SetupClass {
	private lastClicked: HTMLElement | null = null;
	setup(editor: NodeEditor, area: AreaPlugin<Schemes, AreaExtra>, factory: NodeFactory): void {
		area.addPipe((ctx) => {
			const ignored: (AreaExtra | Area2D<Schemes> | Root<Schemes>)['type'][] = [
				'unmount',
				'pointermove',
				'render',
				'rendered',
				'zoom',
				'zoomed',
				'translate',
				'translated'
			];
			if (ignored.includes(ctx.type)) {
				return ctx;
			}

			return ctx;
		});
	}
}

export const setupArea: SetupFunction = (params) => {
	console.log('Setting up area plugin');
	const { factory, editor } = params;
	const container = params.container;
	if (!container) {
		console.warn("Container is not defined, can't setup area plugin.");
		return params;
	}
	const area = new AreaPlugin<Schemes, AreaExtra>(container);

	function dragHandler(e: DragEvent) {
		if (isDraggedGraph(e) || isDraggedVariable(e)) e.preventDefault();
	}
	container.addEventListener('dragover', dragHandler);
	container.addEventListener('dragenter', dragHandler);
	container.addEventListener('drop', async (e) => {
		const pos = posFromClient(e);
		const surfacePos = clientToSurfacePos({ pos, factory });
		let addedNode: GraphNode | undefined;
		if (isDraggedVariable(e)) {
			const vId = getDraggedVariableId(e);
			if (vId) {
				addedNode = new VariableNode({ factory, variableId: vId });
			}
		} else if (isDraggedGraph(e)) {
			const graph = getDraggedGraph(e);
			if (!graph) return;
			console.log('Adding macro block', graph);
			addedNode = new MacroNode({ factory, graph });
		}
		if (!addedNode) return;
		addedNode.visible = false;
		await editor.addNode(addedNode);
		await tick();
		await animationFrame(2);
		if (addedNode instanceof VariableNode) {
			surfacePos.x = surfacePos.x - addedNode.width;
		} else if (addedNode instanceof MacroNode) {
			surfacePos.x = surfacePos.x - addedNode.width / 2;
		}
		surfacePos.y = surfacePos.y - addedNode.height / 2;
		area.translate(addedNode.id, surfacePos);
		addedNode.visible = true;
		e.preventDefault();
	});

	factory.area = area;
	params.editor.use(area);
	return {
		...params,
		area
	};
};

export const arrangeSetup: Setup = {
	name: 'Arrange',
	type: 'area',
	setup: async ({ area, factory }) => {
		const { AutoArrangePlugin, Presets: ArrangePresets } = await import('rete-auto-arrange-plugin');
		const arrange = new AutoArrangePlugin<Schemes>();
		arrange.addPreset(ArrangePresets.classic.setup());
		area.use(arrange);
		factory.arrange = arrange;
	}
};
