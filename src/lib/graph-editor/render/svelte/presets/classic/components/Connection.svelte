<script lang="ts">
	import { ErrorWNotif, _ } from '$lib/global/index.svelte';
	import type { Connection, NodeFactory } from '$graph-editor';
	import { showContextMenu } from '$graph-editor/plugins/context-menu';
	import { stopPropagation } from '@selenite/commons';
	import type { SocketType } from '$graph-editor/plugins/typed-sockets';
	import { assignColor } from '$graph-editor/render/utils';
	import type { Output, Socket } from '$graph-editor/socket';
	// svelte-ignore unused-export-let
	type Props = {
		//  data: Schemes['Connection'] & { isLoop?: boolean };
		id: string;
		selected: boolean;
		source: Output;
		factory: NodeFactory | undefined;
		path: string;
		type?: SocketType;
		picked: boolean;
	};
	let { id, selected, factory, path, picked, source }: Props = $props();

	const color = $derived(source ? assignColor(source.socket) : '');
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
						if (selected) {
							factory.deleteSelectedElements();
						} else {
							factory.editor.removeConnection(id);
						}
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
	on:dblclick={stopPropagation}
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
		class:!stroke-primary={picked}
		class:!stroke-secondary={selected && !picked}
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
