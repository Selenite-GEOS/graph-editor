<script lang="ts">
	import { isBrowser } from '$houdini';
	import { EditMacroNodeChannel } from '$lib/broadcast-channels';
	import { Editor, EditorSharedOverlay } from '$lib/editor';
	import {
		setContext,
		notifications,
		getContext,
		_,
		ErrorWNotif,
		keyboardShortcut
	} from '$lib/global/index.svelte';
	import type { NodeEditor, NodeEditorSaveData, NodeFactory } from '$graph-editor';
	import { isNodeEditorSaveData } from '$graph-editor/utils';

	import { addContextFunction, newLocalId } from '$utils';
	import {
		modeCurrent,
		type ModalSettings,
		getModalStore,
		localStorageStore
	} from '@skeletonlabs/skeleton';
	import { onDestroy, onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import BoxSelection from './selection/BoxSelection.svelte';
	import type { Area, AreaPlugin } from 'rete-area-plugin';
	import type { Schemes } from '$graph-editor/node/Schemes';
	import { oldClientToSurfacePos } from '$utils/html';
	import type { Point } from '$lib/types/Point';
	import wu from 'wu';
	import { browser } from '$app/environment';

	const id = newLocalId('editor-switcher');
	let editors: Record<string, NodeFactory | undefined> = {};
	let container: HTMLElement;
	const savedEditors: Writable<NodeEditorSaveData[]> = localStorageStore('saveData', []);
	let firstLoading = true;

	$: activeFactory = activeId !== undefined ? editors[activeId] : undefined;
	let savesToLoad: (NodeEditorSaveData | undefined)[] = [];

	$: if (firstLoading && $savedEditors) {
		savesToLoad = $savedEditors;
		firstLoading = false;
	}

	const activeSaveEditorsId: Writable<number | null> = localStorageStore(
		'activeSaveEditorsId',
		null
	);
	function saveEditors() {
		const toSave: NodeEditorSaveData[] = [];
		let toSaveActiveId: null | number = null;
		const keys = $tabsContext?.getTabKeys();
		if (!keys) throw new ErrorWNotif({ emessage: 'No tabs found', title: 'Save' });
		for (const [i, key] of keys.entries()) {
			if (key === activeId) toSaveActiveId = i;
			const factory = editors[key];
			if (!factory) throw new ErrorWNotif({ emessage: 'An error occured', title: 'Save' });

			const editor = factory.getEditor();
			console.log(`Saving ${editor.name}...`);
			toSave.push(editor.toJSON());
		}
		$savedEditors = toSave;
		$activeSaveEditorsId = toSaveActiveId;
	}
	const activeEditor = writable<NodeEditor | undefined>(undefined);
	setContext('editor', {
		activeEditor,
		getEditorViewport: () => container,
		getActiveFactory: () => {
			if (!activeId) return undefined;
			const factory = editors[activeId];
			if (isNodeEditorSaveData(factory)) return undefined;
			return factory;
		}
	});
	$: if (activeId && activeId in editors) {
		$activeEditor = editors[activeId]?.getEditor();
	} else {
		$activeEditor = undefined;
	}
	const saveContext = getContext('save');

	// Setup Tabs
	const tabsContext = getContext('tabs');
	const modalStore = getModalStore();
	function openChangeTabNameModal(key: string) {
		if (editors[key] === undefined) return;
		const changeTabName: ModalSettings = {
			type: 'prompt',
			// Data
			title: $_('enter.name'),
			body: $_('prompt.provide.name.graph'),
			// Populates the input value and attributes
			value: editors[key]?.getEditor().name,
			valueAttr: { type: 'text', required: true },
			buttonTextCancel: $_('button.cancel'),
			buttonTextSubmit: $_('button.confirm'),

			// Returns the updated response value
			response: (r: string) => {
				if (r) {
					editors[key]?.getEditor().setName(r);
					$tabsContext?.renameTab(key, r);
				}
			}
		};
		modalStore.trigger(changeTabName);
	}
	if (browser) {
		const onKeyDown = (e: KeyboardEvent) => {
			// Check if the event target is an input, textarea, or has contenteditable attribute
			if (activeId === undefined) return;

			if (!(e.target instanceof HTMLElement)) return;

			const ignoreElements = ['INPUT', 'TEXTAREA'];
			if (ignoreElements.includes(e.target?.tagName) || e.target.contentEditable === 'true') {
				return;
			}

			if (e.key === 'R' && e.ctrlKey === false && e.altKey === false && e.shiftKey === true) {
				e.preventDefault();
				openChangeTabNameModal(activeId);
				return;
			}

			if (e.key === 'Escape') {
				if (activeId === undefined) return;
				const factory = editors[activeId];
				if (!factory) return;
				const editor = factory.getEditor();
				const selector = factory.selector;
				if (!selector) return;
				const area = factory.getArea();
				if (!area) return;
				const selectedNodesIds = wu(selector.entities.keys())
					.filter((id) => id.startsWith('node'))
					.map((id) => id.slice(5))
					.toArray();
				if (selectedNodesIds.length === 0) return;
				e.preventDefault();
				selector.unselectAll();
			}
		};

		document.addEventListener('keydown', onKeyDown);
		onDestroy(() => {
			document.removeEventListener('keydown', onKeyDown);
		});
	}

	let mounted = false;
	onMount(() => {
		for (const [i, savedEditor] of $savedEditors.entries()) {
			const id = addNewEditor(savedEditor);
			if (i === $activeSaveEditorsId) {
				console.log('selecting saved editor ', i);
				$tabsContext?.tabSet.set(id);
				activeId = id;
			}
		}
		setTimeout(() => {
			$saveContext.set(id, {
				save: saveEditors
			});
			$saveContext = $saveContext;
		}, 500);

		mounted = true;
	});

	/**
	 * Returns id of new editor
	 * @param savedData
	 */
	function addNewEditor(savedData?: NodeEditorSaveData, select?: boolean): string {
		const id = newLocalId('node-editor');
		savesToLoad[Object.keys(editors).length] = savedData;
		editors[id] = undefined;
		editors = editors;
		$tabsContext?.addTab({
			key: id,
			props: {
				select: savedData === undefined || select === true,
				id,
				name: savedData?.editorName ?? $_('editor.default-name'),
				onClose: () => {
					delete editors[id];
					editors = editors;
				},
				onDblClick: () => {
					console.log('onDblClick');
					openChangeTabNameModal(id);
				}
			}
		});
		return id;
	}
	$: $tabsContext?.setMainAddModel({
		addModel: addNewEditor,
		tooltip: 'Add Model',
		label: 'Add Model'
	});
	let activeId: string | undefined;
	$: $tabsContext?.tabSet.subscribe((value) => {
		activeId = value;
	});
	$: if (mounted && $tabsContext) {
		if (Object.keys(editors).length === 0) {
			addNewEditor();
		}
	}

	// Setup Cleanup
	const rightSidebar = getContext('mainRightSideBar');
	function onDestroyCleanup() {
		$tabsContext?.clearTabs();
		$rightSidebar = { component: undefined };
	}
	onDestroy(() => {
		onDestroyCleanup();
		$saveContext.delete(id);
	});

	const editMacroNodeChannel = new EditMacroNodeChannel();
	editMacroNodeChannel.onmessage = async (data) => {
		console.log('editMacroNodeChannel.onmessage', data);
		addNewEditor(data.graph, true);
	};
	let boxSelectionPointerDown: (event: MouseEvent) => void | undefined;

	function handleBoxSelection(e: BoxSelection['$$events_def']['selection']) {
		console.log('selection', e.detail);
		if (!activeId) return;
		const factory = editors[activeId];
		if (!factory) return;

		let { upperLeft, lowerRight, pointerEvent } = e.detail;
		// let [x, y] = clientToSurfacePos({ x: upperLeft.x, y: upperLeft.y, factory });
		// upperLeft = { x, y };
		// [x, y] = clientToSurfacePos({ x: lowerRight.x, y: lowerRight.y, factory });
		// lowerRight = { x, y };
		const area = factory.getArea();
		if (!area) return;
		// keep fully contained nodes

		nodesToSelect = wu(area.nodeViews.entries())
			.filter(([nodeId, nodeView]) => {
				const rect = nodeView.element.getBoundingClientRect();
				return (
					rect.left >= upperLeft.x &&
					rect.right <= lowerRight.x &&
					rect.top >= upperLeft.y &&
					rect.bottom <= lowerRight.y
				);
			})
			.map(([nodeId, _]) => {
				factory.getEditor().getNode(nodeId).selected = true;
				area.update('node', nodeId);
				// factory.selectableNodes?.select(nodeId, false);
				return nodeId;
			})
			.toArray();
		factoryToSelectWith = factory;
	}
	let nodesToSelect: string[] = [];
	let factoryToSelectWith: NodeFactory | undefined = undefined;
	const hideMinimap = localStorageStore('hideMinimap', false);
	$: if (browser) {
		if ($hideMinimap) {
			document.documentElement.classList.add('hide-minimap');
		} else {
			document.documentElement.classList.remove('hide-minimap');
		}
	}
	let lastSearch = '';
</script>

<BoxSelection
	target={container}
	bind:onPointerDown={boxSelectionPointerDown}
	on:selection={handleBoxSelection}
/>

<div
	bind:this={container}
	use:keyboardShortcut={{
		key: 'f',
		ctrl: true,
		action() {
			modalStore.trigger({
				type: 'prompt',
				title: $_('graph-editor.find-prompt.title'),
				value: '',
				buttonTextCancel: $_('button.cancel'),
				buttonTextSubmit: $_('button.search'),
				valueAttr: { required: true, placeholder: $_('graph-editor.find-prompt.placeholder') },
				response(r) {
					lastSearch = typeof r === 'string' ? r.trim() : '';
					if (typeof r === 'string' && r.trim()) {
						const node = activeFactory?.findNode(r);
						activeFactory?.focusNode(node);
					}
				}
			});
		}
	}}
	use:keyboardShortcut={{
		key: 'n',

		action() {
			const node = activeFactory?.findNode(lastSearch);
			activeFactory?.focusNode(node);
		}
	}}
	use:keyboardShortcut={{
		key: 'a',
		ctrl: true,
		action() {
			activeFactory?.selectAll();
		}
	}}
	use:keyboardShortcut={{
		key: 'delete',
		action() {
			activeFactory?.deleteSelectedElements();
		}
	}}
	use:keyboardShortcut={{
		key: 'm',
		action() {
			$hideMinimap = !$hideMinimap;
		}
	}}
	use:keyboardShortcut={{
		key: 'c',
		action() {
			activeFactory?.commentSelectedNodes();
		}
	}}
	on:pointerup={(e) => {
		if (nodesToSelect.length > 0) {
			const factory = factoryToSelectWith;
			if (!factory) throw new ErrorWNotif('No factory for selection');
			console.log('selecting', nodesToSelect);
			setTimeout(() => {
				for (const nodeId of nodesToSelect) factory.selectableNodes?.select(nodeId, true);
				nodesToSelect = [];
			}, 0);
		}
	}}
	class="h-full w-full"
	class:bg-surface-50-900-token={!$modeCurrent}
	class:bg-white={$modeCurrent}
	in:fade
	out:fade={{ duration: 200 }}
	on:outrostart={onDestroyCleanup}
>
	{#if activeId && activeId in editors}
		<EditorSharedOverlay />
	{/if}
	{#each Object.entries(editors) as [key], i (key)}
		<Editor
			bind:saveData={savesToLoad[i]}
			bind:factory={editors[key]}
			id={key}
			name={savesToLoad[i]?.editorName ?? $_('editor.default-name')}
			hidden={key !== activeId}
			on:pointerdown={(e) => {
				if (boxSelectionPointerDown) boxSelectionPointerDown(e.detail);
			}}
		/>
	{/each}
</div>
