<script lang="ts">
	import type { ExecSocket } from '$graph-editor/socket/ExecSocket';

	let { data }: { data: ExecSocket } = $props();
	const socket = $derived(data);
	// $inspect('exec', {...socket}, socket.type)
</script>

<div
	id="outerTriangle"
	class=" socket outline-4 outline outline-primary-400"
	class:outline={data.selected}
	title={'exec'}
>
	<div id="innerTriangle" class="socket" title={'exec'} ></div>
</div>

<style lang="scss">
	@import '../vars.sass';
	/* .required {
		border-color: red;
	} */

	#innerTriangle {
		position: relative;
		height: 0;
		width: 0;
		top: -13px;
		left: -24px;
		border-top: 14px solid transparent;
		border-bottom: 14px solid transparent;
		border-left: $socket-size solid $exec-color;
		/* display: inline-block; */
		cursor: pointer;
		/*width: ${$socketsize}px;
	height: ${$socketsize}px;*/
		vertical-align: middle;

		/* background: ${$socketcolor}; */
		z-index: 2;
		box-sizing: border-box;
		&:hover {
			top: -10px;
			left: -22px;
			border-top: 10px solid transparent;
			border-bottom: 10px solid transparent;
			border-left: 17px solid $exec-color;
		}
		&:multiple {
			border-color: yellow;
		}
	}

	#outerTriangle {
		height: 0;
		width: 0;
		/* margin-left: 10px; */
		display: inline-block;
		border-top: 14px solid transparent;
		border-bottom: 14px solid transparent;
		padding-left: -10px;
		border-left: $socket-size solid white;
		box-sizing: border-box;
		/* z-index: 1; */
		&:hover #innerTriangle {
			top: -10px;
			left: -22px;
			border-top: 10px solid transparent;
			border-bottom: 10px solid transparent;
			border-left: 17px solid $exec-color;
		}
	}
</style>
