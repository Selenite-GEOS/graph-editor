<script lang="ts">
	import type { ExecSocket } from '$rete/socket/ExecSocket';

	export let data: ExecSocket;
</script>

<div
	id="outerTriangle"
	class=" socket outline-4 outline outline-primary-400"
	class:outline={data.selected}
>
	<div id="innerTriangle" class="socket" title={data.value ? String(data.value) : data.name} />
</div>

<style>
	/* .required {
		border-color: red;
	} */

	#innerTriangle {
		position: relative;
		height: 0;
		width: 0;
		top: -14px;
		left: -27px;
		border-top: 14px solid transparent;
		border-bottom: 14px solid transparent;
		border-left: 24px solid #b479b6;
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
			left: -24px;
			border-top: 10px solid transparent;
			border-bottom: 10px solid transparent;
			border-left: 17px solid #b479b6;
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
		border-top: 16px solid transparent;
		border-bottom: 16px solid transparent;
		padding-left: -10px;
		border-left: 28px solid white;
		box-sizing: border-box;
		/* z-index: 1; */
		&:hover #innerTriangle {
			top: -10px;
			left: -24px;
			border-top: 10px solid transparent;
			border-bottom: 10px solid transparent;
			border-left: 17px solid #b479b6;
		}
	}
</style>
