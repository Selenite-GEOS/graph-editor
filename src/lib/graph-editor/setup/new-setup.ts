import { NodeEditor, NodeFactory, type NodeEditorSaveData } from '$graph-editor/editor';
import type { EditorExample } from '$graph-editor/examples';
import type { Writable } from 'svelte/store';
import { isSetup, type Setup, type SetupAreaFunction, type SetupFunction } from './Setup';
import { setupConnections } from './ConnectionSetup';
import { setupArea } from './AreaSetup';
import { setupMinimap } from './MinimapSetup';
import { TypedSocketsPlugin } from '$graph-editor/plugins';
import type { Schemes } from '$graph-editor/schemes';
import type { AreaExtra } from '$graph-editor/area';
import { tick } from 'svelte';
import { contextMenuSetup, type ShowContextMenu } from '$graph-editor/plugins/context-menu';

export type XmlContext = {};

export type ModalStore = {};

export type SetupGraphEditorParams = {
	container?: HTMLElement;
	loadExample?: EditorExample;
	saveData?: NodeEditorSaveData;
	xmlContext?: Writable<XmlContext>;
	modalStore?: ModalStore;
	setups?: (SetupFunction | Setup)[];
};

export type SetupGraphEditorResult = {
	editor: NodeEditor;
	factory: NodeFactory;
};

export async function setupGraphEditor(
	params: SetupGraphEditorParams = {}
): Promise<SetupGraphEditorResult> {
	const editor = new NodeEditor();

	const factory = new NodeFactory({
		editor
	});
	if (params.container) {
		params = (await setupArea({ editor, factory, ...params })) ?? params;
	}

	const areaSetups: SetupAreaFunction[] = [];
	for (const setup of params.setups ?? []) {
		// Handle the case where setup is a function
		if (!isSetup(setup)) {
			params = (await setup({ editor, factory, ...params })) ?? params;
			continue;
		}
		console.log(`Setting up ${setup.name}`);
		if (setup.type === undefined || setup.type === 'editor') {
			params = (await setup.setup({ editor, factory, ...params })) ?? params;
		} else if (setup.type === 'area') {
			areaSetups.push(setup.setup);
		} else {
			console.error(`Unknown setup type: ${setup.type}`);
		}
	}
	for (const areaSetup of areaSetups) {
		await areaSetup({ editor, factory, area: factory.getArea()! });
	}
	const { AreaExtensions } = await import('rete-area-plugin');
	await tick();
	setTimeout(async () => {
		if (factory.getArea()) await AreaExtensions.zoomAt(factory.getArea()!, editor.getNodes());
	}, 0);
	return {
		editor,
		factory
	};
}

export async function setupFullGraphEditor(
	params: SetupGraphEditorParams & { showContextMenu?: ShowContextMenu } = {}
): Promise<SetupGraphEditorResult> {
	return setupGraphEditor({
		...params,
		setups: [
			...(params.setups ?? []),
			setupConnections,
			setupMinimap,
			({ editor }) => {
				console.log('Setting up typed sockets plugin');
				const typedSocketsPlugin = new TypedSocketsPlugin<Schemes>();
				editor.use(typedSocketsPlugin);
			},
			// Arrange
			async ({ editor, area, factory }) => {
				if (!area) {
					console.warn("AreaPlugin is not defined, can't setup auto arrange plugin.");
					return;
				}
				console.log('Setting up auto arrange');
				const { AutoArrangePlugin, Presets: ArrangePresets } = await import(
					'rete-auto-arrange-plugin'
				);
				const arrange = new AutoArrangePlugin<Schemes>();
				arrange.addPreset(ArrangePresets.classic.setup());
				area.use(arrange);
				factory.arrange = arrange;
			},
			// Area extensions
			async ({ factory, area }) => {
				if (!area) {
					console.warn("AreaPlugin is not defined, can't setup area extensions.");
					return;
				}
				console.log('Setting up area extensions');
				const { AreaExtensions } = await import('rete-area-plugin');
				const selector = AreaExtensions.selector();
				const accumulating = AreaExtensions.accumulateOnCtrl();
				AreaExtensions.showInputControl(area);
				AreaExtensions.selectableNodes(area, selector, { accumulating });
				factory.accumulating = accumulating;
				factory.selector = selector;
			},
			// History
			async ({ area, factory }) => {
				if (!area) {
					console.warn("AreaPlugin is not defined, can't setup history plugin.");
					return;
				}
				console.log('Setting up history');
				const { HistoryPlugin, Presets: HistoryPresets } = await import('rete-history-plugin');
				const history = new HistoryPlugin<Schemes>();
				history.addPreset(HistoryPresets.classic.setup());
				area.use(history);
				factory.history = history;
			},
			{
				name: 'comments',
				type: 'area',
				setup: async ({ factory, area }) => {
					const { CommentPlugin, CommentExtensions } = await import(
						'$graph-editor/plugins/CommentPlugin'
					);
					const comment = new CommentPlugin<Schemes, AreaExtra>({ factory });
					CommentExtensions.selectable<Schemes, AreaExtra>(
						comment,
						factory.selector,
						factory.accumulating
					);
					factory.comment = comment;
					area.use(comment);
				}
			},
			contextMenuSetup({
				showContextMenu: (params_) => {
					console.debug('showContextMenu', params_);
					if (!params.showContextMenu) {
						console.warn('Missing show context menu function');
						return;
					}
					params.showContextMenu(params_);
				}
			})

			// new RenderSetup(),
			// new ContextMenuSetup()
		]
	});
}
