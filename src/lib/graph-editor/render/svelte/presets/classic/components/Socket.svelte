<script lang="ts">
	import type { Socket, SocketDatastructure } from '$graph-editor/socket/Socket.svelte';
	import { assignColor } from '$rete/customization/utils';
	import { capitalize } from 'lodash-es';
	import cssVars from 'svelte-css-vars';
	let { data }: { data: Socket } = $props();
	let socketVars = $derived({ background: assignColor(data) });

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

<div
	class="socket outline-4 outline outline-primary-400 border-white border-1 hover:border-4 {datastructureClass}"
	role="button"
	tabindex="0"
	class:outline={data.selected}
	{title}
	use:cssVars={socketVars}
	on:contextmenu|stopPropagation|preventDefault
></div>

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
		background: none;
		border-radius: 0%;
	}
</style>
