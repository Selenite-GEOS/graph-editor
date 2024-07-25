<script lang="ts">
	import type { Socket, SocketDatastructure } from '$graph-editor/socket/Socket.svelte';
	import { assignColor } from '$graph-editor/render/utils';
	import { capitalize } from 'lodash-es';
	import cssVars from 'svelte-css-vars';
	import ExecSocketCmpnt from './ExecSocket.svelte';
	import { variant } from '$utils';
	import { ExecSocket } from '$graph-editor/socket/ExecSocket';
	let { data }: { data: Socket } = $props();
	const socket = $derived(data);
	const node = $derived(data.node);
	const arrayBackgroundColor = $derived(node.isLastSelected ? "var(--p)" : node.selected ? "var(--s)": "var(--b3)");
	let socketVars = $derived({ background: assignColor(data), arrayBackgroundColor });
	const type = $derived(data.type);
	const datastructureClasses: Record<SocketDatastructure, string> = {
		array: 'array',
		scalar: ''
	};
	if (!(data.datastructure in datastructureClasses)) {
		console.error('Unsupported datastructure type for socket component :', data.datastructure);
	}

	const datastructureClass = $derived(datastructureClasses[data.datastructure]);
	const title = $derived(
		data.datastructure === 'scalar' ? data.type : `${capitalize(data.datastructure)}<${data.type}>`
	);

	// setInterval(() => {
	// 	socketVars = { background: assignColor(data) };
	// }, 200);
</script>

{#if type === 'exec'}
<ExecSocketCmpnt data={data as ExecSocket} />
{:else}
	<!-- svelte-ignore event_directive_deprecated -->
	<div
		class="socket outline-4 outline outline-primary-400 border-white border-1 hover:border-4 {datastructureClass}
		"
		role="button"
		tabindex="0"
		class:outline={data.selected}
		{title}
		use:cssVars={socketVars}
		on:contextmenu|stopPropagation|preventDefault
	></div>
{/if}

<style lang="scss" scoped>
	@use 'sass:math';
	@import '../vars';

	.socket {
		display: inline-block;
		cursor: pointer;
		border-style: solid;
		border-radius: math.div($socket-size, 2);
		width: $socket-size;
		height: $socket-size;
		margin: $socket-margin 0;
		vertical-align: middle;
		background: var(--background);
		z-index: 2;
		box-sizing: border-box;

		&:hover {
			border-width: 4px;
		}

		/* &.multiple {
			border-color: yellow;
		} */

		/* &.rete-output {
			margin-right: -1 * math.div($socket-size, 2);
		}

		&.rete-input {
			margin-left: -1 * math.div($socket-size, 2);
		} */
	}
	.array {
		border: 4px dashed var(--background);
		background-color: oklch(var(--arrayBackgroundColor) / var(--tw-bg-opacity));
		border-radius: 0%;

		&:hover {
			background-color: oklch(var(--b1) / var(--tw-bg-opacity));
		}
	}
</style>
