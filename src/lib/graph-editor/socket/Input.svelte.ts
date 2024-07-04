import { ClassicPreset } from 'rete';
import type { Socket } from './Socket';
import type { Control } from './control';

export class Input<S extends Socket = Socket>
	extends ClassicPreset.Port<S>
	implements ClassicPreset.Input<S>
{
	public readonly isRequired: boolean;
	public readonly index?: number;
	// showControl: boolean = $state(true);
	/**
	 * Control instance
	 */
	control: Control | null = null;
	/**
	 * Whether the control is visible. Can be managed dynamically by extensions. Default is `true`
	 */
	showControl = $state(true);

	constructor({
		socket,
		multipleConnections,
		label,
		isRequired = false,
		index
	}: {
		socket: S;
		label?: string;
		multipleConnections?: boolean;
		isRequired?: boolean;
		index?: number;
	}) {
		super(socket, label, multipleConnections);
		$effect.root(() => {
			console.log('showcontrol', this.showControl);
		});
		this.index = index;
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
