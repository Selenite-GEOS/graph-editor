<script lang="ts">
	import { ErrorWNotif, _ } from '$lib/global/index.svelte';
	import type { NodeFactory } from '$graph-editor';
	import { showContextMenu } from '$graph-editor/plugins/context-menu';
	import { stopPropagation } from '@selenite/commons';
	import type { SocketType } from '$graph-editor/plugins/typed-sockets';
	import { assignColor } from '$rete/customization/utils';
	// svelte-ignore unused-export-let
	type Props = {
		//  data: Schemes['Connection'] & { isLoop?: boolean };
		id: string;
		selected: boolean | undefined;
		factory: NodeFactory | undefined;
		path: string;
		type?: SocketType;
	};
	let { id, selected, factory, path, type }: Props = $props();

	const color = $derived(type ? assignColor(type) : '');
	// // svelte-ignore unused-export-let
	// export let start: Position;
	// // svelte-ignore unused-export-let
	// export let end: Position;
	// // svelte-ignore unused-export-let
	// export let targetInput: string;
	// // svelte-ignore unused-export-let
	// export let target: string;
	// // svelte-ignore unused-export-let
	// export let source: string;
	// // svelte-ignore unused-export-let
	// export let sourceOutput: string;
	// // svelte-ignore unused-export-let
	// export let isPseudo = undefined;
	// // svelte-ignore unused-export-let
	// export let id: string;
	// // svelte-ignore unused-export-let
	// export let path: string;

	function onClick() {
		if (!factory) throw new ErrorWNotif('No factory');
		factory.selectConnection(id);
	}

	function openContextMenu(event: MouseEvent) {
		showContextMenu({
			pos: { x: event.clientX, y: event.clientY },
			searchbar: false,
			items: [
				{
					label: 'Delete',
					description: 'Delete the connection',
					action() {
						if (!factory) {
							throw new Error("Can't delete connection, no factory");
						}
						factory.selectConnection(id);
						factory.deleteSelectedElements();
					}
				}
			]
		});
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore event_directive_deprecated -->
<svg
	data-testid="connection"
	class="group hover:cursor-pointer -z-10"
	on:pointerdown={stopPropagation}
	on:click|stopPropagation={() => onClick()}
	on:keypress={(e) => {
		if (e.key === 'Enter') {
			e.stopPropagation();
			onClick();
		}
	}}
	on:contextmenu|preventDefault|stopPropagation={openContextMenu}
>
	<path class="stroke-transparent pointer-events-auto" d={path} fill="none" stroke-width={'20px'} />
	<path
		class="visible-path pointers-events-none"
		style="stroke: {color};"
		class:group-hover:brightness-125={!selected}
		d={path}
		class:!stroke-primary-400={selected}
	/>
</svg>

<style lang="scss">
	@import '../vars';
	/*! https://github.com/retejs/connection-plugin/commit/206ca0fd7fb82801ac45a0f7180ae05dff9ed901 */
	svg {
		overflow: visible !important;
		position: absolute;
		pointer-events: none;
		width: 9999px;
		height: 9999px;
	}

	svg path.visible-path {
		fill: none;
		stroke-width: $connection-width;
		stroke: steelblue;
		pointer-events: none;
	}
</style>
