import { NodeEditor, NodeFactory, type NodeEditorSaveData } from '$graph-editor/editor';
import type { Writable } from 'svelte/store';
import { isSetup, type Setup, type SetupAreaFunction, type SetupFunction } from './Setup';
import { setupConnections } from './ConnectionSetup';
import { setupArea } from './AreaSetup';
import { setupMinimap } from './MinimapSetup';
import { TypedSocketsPlugin } from '$graph-editor/plugins/typed-sockets';
import type { Schemes } from '$graph-editor/schemes';
import type { AreaExtra } from '$graph-editor/area';
import { tick } from 'svelte';
import {
	contextMenuSetup,
	showContextMenu,
	type NodeMenuItem,
	type ShowContextMenu
} from '$graph-editor/plugins/context-menu';
import { gridLinesSetup } from '$graph-editor/plugins/viewport-addons/gridlines';
import { notificationsSetup } from '$graph-editor/plugins/notifications';
import type { GraphNode } from '$graph-editor/nodes';
import { HistoryPlugin } from '$graph-editor/plugins/history';
import { setupSvelteRender } from '$graph-editor/render';

export type XmlContext = {};

export type ModalStore = {};

export type SetupGraphEditorParams = {
	container?: HTMLElement;
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
	if (params.saveData) factory.loadGraph(params.saveData);
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
	params: SetupGraphEditorParams & {
		showContextMenu?: ShowContextMenu;
		additionalNodeItems?: NodeMenuItem[];
	} = {}
): Promise<SetupGraphEditorResult> {
	params.showContextMenu = showContextMenu;
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
			notificationsSetup,
			// Temporary area
			{
				name: 'Test area',
				type: 'area',
				setup: ({ area }) => {
					let resizeObserver = new ResizeObserver((e) => {
						area.emit({ type: 'resized', data: { event: new Event('resize') } });
					});

					resizeObserver.observe(area.container);
					area.addPipe((ctx) => {
						if (ctx.type === 'pointerdown') {
							document.body.style.userSelect = 'none';
						} else if (ctx.type === 'pointerup') {
							document.body.style.userSelect = '';
						}

						// if (ctx.type === 'render') {
						// 	console.log(ctx.data)
						// }
						// console.log(area.elements)
						return ctx;
					});
				}
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
				AreaExtensions.showInputControl(area);
			},
			// Gridlines
			gridLinesSetup,
			// History
			async ({ area, factory }) => {
				if (!area) {
					console.warn("AreaPlugin is not defined, can't setup history plugin.");
					return;
				}
				console.log('Setting up history');
				const { Presets: HistoryPresets } = await import('rete-history-plugin');
				const history = new HistoryPlugin<Schemes>();
				history.addPreset(HistoryPresets.classic.setup());
				area.use(history);
				factory.history = history;
			},
			// {
			// 	name: 'comments',
			// 	type: 'area',
			// 	setup: async ({ factory, area }) => {
			// 		const { CommentPlugin, CommentExtensions } = await import(
			// 			'$graph-editor/plugins/CommentPlugin'
			// 		);
			// 		const comment = new CommentPlugin<Schemes, AreaExtra>({ factory });
			// 		if (!factory.selector) {
			// 			console.warn('Missing selector');
			// 			return;
			// 		}
			// 		if (!factory.accumulating) {
			// 			console.warn('Missing accumulating');
			// 			return;
			// 		}
			// 		CommentExtensions.selectable<Schemes, AreaExtra>(
			// 			comment,
			// 			factory.selector,
			// 			factory.accumulating
			// 		);
			// 		factory.comment = comment;
			// 		area.use(comment);
			// 	}
			// },
			contextMenuSetup({
				additionalNodeItems: params.additionalNodeItems,
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

export async function setupSvelteGraphEditor(
	params: SetupGraphEditorParams & {
		showContextMenu?: ShowContextMenu;
		additionalNodeItems?: NodeMenuItem[];
	} = {}
): Promise<SetupGraphEditorResult> {
	return setupFullGraphEditor({...params, setups: [
		...params.setups ?? [],
		setupSvelteRender
	]
	});
}