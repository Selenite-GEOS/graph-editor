<script lang="ts">
	import type { Socket } from '$graph-editor/socket/Socket';
	export let data: Socket;
	import { assignColor } from '$graph-editor/customization/utils';
	import cssVars from 'svelte-css-vars';

	let socketVars = { background: assignColor(data) };
	$: {
		socketVars = { background: assignColor(data) };
		// console.log("move to ", data.type)
	}
	// setInterval(() => {
	// 	socketVars = { background: assignColor(data) };
	// }, 200);
</script>

<div
	class="socket outline-4 outline outline-primary-400 border-white border-1 hover:border-4"
	class:array={data.isArray}
	role="button"
	tabindex="0"
	class:outline={data.selected}
	title={data.type}
	use:cssVars={socketVars}
	on:contextmenu|stopPropagation|preventDefault
/>

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
		margin: $socket-margin;
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
