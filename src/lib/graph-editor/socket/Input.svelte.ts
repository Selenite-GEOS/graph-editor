import { ClassicPreset } from 'rete';
import type { Socket } from './Socket.svelte';
import type { Control } from '../control';

export class Input<S extends Socket = Socket>
	extends ClassicPreset.Port<S>
	implements ClassicPreset.Input<S>
{
	public readonly isRequired: boolean;
	public index = $state<number>();
	// showControl: boolean = $state(true);
	/**
	 * Control instance
	 */
	control: Control | null = null;
	/**
	 * Whether the control is visible. Can be managed dynamically by extensions. Default is `true`
	 */
	showControl = $state(true);

	alwaysShowLabel = $state(false);
	description?: string
	hideLabel = $state(false)
	constructor({
		socket,
		multipleConnections,
		alwaysShowLabel = false,
		hideLabel = false,
		label,
		isRequired = false,
		index,
		description
	}: {
		socket: S;
		label?: string;
		alwaysShowLabel?: boolean;
		hideLabel?: boolean
		multipleConnections?: boolean;
		isRequired?: boolean;
		index?: number;
		description?: string;
	}) {
		super(socket, label, multipleConnections);
		this.alwaysShowLabel = alwaysShowLabel;
		this.hideLabel = hideLabel
		this.description = description
		// $effect.root(() => {
		// 	console.log('showcontrol', this.showControl);
		// });
		this.index = index;
		this.socket.port = this;
		this.isRequired = isRequired;
	}

	/**
	 * Add control to the input port
	 * @param control Control instance
	 */
	addControl(control: Control) {
		if (this.control) throw new Error('control already added for this input');
		this.control = control;
	}

	/**
	 * Remove control from the input port
	 */
	removeControl() {
		this.control = null;
	}
}
