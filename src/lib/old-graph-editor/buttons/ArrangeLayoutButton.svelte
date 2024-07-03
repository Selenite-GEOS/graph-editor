<script lang="ts">
	import { EditorButton, type ButtonExec } from '.';
	import { _, getContext, keyboardShortcut } from '$lib/global';
	import { faGem } from '@fortawesome/free-solid-svg-icons';
	import { AreaExtensions } from 'rete-area-plugin';
	import wu from 'wu';
	import { ArrangeAppliers } from 'rete-auto-arrange-plugin';
	import type { Schemes } from '$graph-editor/node/Schemes';
	import type { AreaExtra } from '$graph-editor/node/AreaExtra';
	import { cubicInOut } from 'svelte/easing';

	const exec: ButtonExec = async ({ factory }) => {
		const selectedNodesIds = factory.getSelectedNodesIds();
		if (selectedNodesIds) console.log('arranging nodes', selectedNodesIds);
		const area = factory.getArea();
		if (!area) return;
		let firstTick = true;
		const applier = new ArrangeAppliers.TransitionApplier<Schemes, AreaExtra>({
			onTick(t) {
				if (firstTick) {
					firstTick = true;
					AreaExtensions.zoomAt(area, factory.getEditor().getNodes());
				}
			},
			duration: 500,
			timingFunction: cubicInOut,
			needsLayout(id) {
				// if (factory.getSelectedNodesIds()?.size !== 0)
				// 	console.warn(
				// 		"laying out a subset doesn't work, should try reaching out to the author of the plugin"
				// 	);
				return !selectedNodesIds || selectedNodesIds.has(id);
			}
		});

		await factory.arrange.layout({ applier });
	};
</script>

<EditorButton shortcut="a" {exec} icon={faGem} tooltip={$_('editor.button.layout')} />
