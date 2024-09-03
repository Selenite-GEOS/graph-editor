import type { ClassicPreset } from 'rete';
import type { Socket } from './Socket.svelte';
import type { Control } from '../control';
import { Port, type PortParams } from './port.svelte';

export class Input<S extends Socket = Socket> extends Port<S> implements ClassicPreset.Input<S> {
	public readonly isRequired: boolean;
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
	hideLabel = $state(false);
	constructor(
		params: PortParams<S> & {
			alwaysShowLabel?: boolean;
			hideLabel?: boolean;
			isRequired?: boolean;
		}
	) {
		super(params);
		this.alwaysShowLabel = params.alwaysShowLabel ?? false;
		this.hideLabel = params.hideLabel ?? false;
		this.isRequired = params.isRequired ?? false;
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
