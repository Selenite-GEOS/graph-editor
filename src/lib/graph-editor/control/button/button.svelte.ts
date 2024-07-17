import { Control, type ControlParams } from '../control.svelte';

type ButtonControlParams = Partial<{
	label: string;
	onClick: () => void;
}> & Partial<ControlParams>
export class ButtonControl extends Control {
	onClick = $state<() => void>();
	label = $state<string>();

	constructor(params: ButtonControlParams = {}) {
		super({ ...params });
		this.label = params.label
		this.onClick = params.onClick
	}
}
