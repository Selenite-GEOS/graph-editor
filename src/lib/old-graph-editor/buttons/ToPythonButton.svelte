<script lang="ts">
	import type { NodeFactory } from '$graph-editor/node/NodeFactory';
	import { faPython } from '@fortawesome/free-brands-svg-icons';
	import EditorButton from './EditorButton.svelte';
	import { notifications } from '@mantine/notifications';
	import { ErrorWNotif, _, getContext } from '$lib/global';
	import type { Root } from 'rete';
	import type { Area2D } from 'rete-area-plugin';
	import type { AreaExtra } from '$graph-editor/node/AreaExtra';
	import type { Schemes } from '$graph-editor/node/Schemes';
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	import { moonMenuVisibleStore } from '$lib/oldMenu/context-menu/moonContextMenu';

	let factory: NodeFactory;
	let editorViewport: HTMLElement;
	let active = false;

	const editorContext = getContext('editor');

	function onKeyDown(e: KeyboardEvent) {
		if ($moonMenuVisibleStore) return;
		// Check if the event target is an input, textarea, or has contenteditable attribute
		const ignoreElements = ['INPUT', 'TEXTAREA'];
		if (ignoreElements.includes(e.target?.tagName) || e.target.contentEditable === 'true') {
			return;
		}

		if (
			e.key.toLowerCase() === 'p' &&
			e.ctrlKey === false &&
			e.altKey === false &&
			e.shiftKey === false
		) {
			const factory = editorContext.getActiveFactory();
			if (!factory) throw new ErrorWNotif('No active factory supplied');
			const editorViewport = editorContext.getEditorViewport();
			if (!editorViewport) throw new ErrorWNotif('No editor viewport supplied');

			setData({ factory, editorViewport });
			togglePythonMode();
		}
	}
	if (browser) {
		document.addEventListener('keydown', onKeyDown);
	}
	onDestroy(() => {
		document.removeEventListener('keydown', onKeyDown);
	});

	// $: window.factory = factory;

	$: if (browser) {
		if (active) {
			notifications.show({
				title: $_('python-mode.notification.title'),
				message: $_('python-mode.notification.description'),
				color: 'blue',
				id: 'python-mode',
				autoClose: false,
				withCloseButton: false
			});
		} else {
			notifications.hide('python-mode');
		}
	}

	$: if (factory) {
		const editor = factory.getEditor();
		const pipe = async (context: AreaExtra | Area2D<Schemes> | Root<Schemes>) => {
			if (active && context.type === 'nodepicked') {
				const nodeId = context.data.id;
				const node = editor.getNode(nodeId);
				const res = await node.pythonComponent.toPython();
				console.log(res);
				// Download res as file
				const blob = new Blob([res], { type: 'text/plain' });
				const url = URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = 'script.py';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);

				notifications.show({
					title: $_('python-mode.notification.title'),
					message: $_('python-mode.generation.success.message'),
					color: 'green'
				});
				togglePythonMode();
			}
		};

		factory.setState('toPythonBtn', 'pipeFunction', pipe);
		// console.log(import.meta)

		if (!factory.getState('toPythonBtn', 'pipeAdded', false)) {
			factory.setState('toPythonBtn', 'pipeAdded', true);

			const area = factory.getArea();
			const editor = factory.getEditor();
			console.log('adding area pipe');

			if (area === undefined) {
				notifications.show({
					title: $_('python-mode.notification.title'),
					message: $_('python-mode.generation.failure.message'),
					color: 'red'
				});
				throw new Error('area is undefined');
			}

			area.addPipe(async (context) => {
				factory.getState<(context: AreaExtra | Area2D<Schemes> | Root<Schemes>) => void>(
					'toPythonBtn',
					'pipeFunction'
				)(context);
				return context;
			});
		}
	}
	function setData(params: { factory: NodeFactory; editorViewport: HTMLElement }) {
		editorViewport = params.editorViewport;
		factory = params.factory;
	}

	function togglePythonMode() {
		editorViewport.classList.toggle('python-cursor');
		active = !active;
	}
</script>

<EditorButton
	icon={faPython}
	exec={({ factory, editorViewport }) => {
		factory = factory;
		setData({ editorViewport, factory });
		togglePythonMode();
	}}
	{active}
	tooltip={$_('editor.button.python-mode.tooltip')}
/>
