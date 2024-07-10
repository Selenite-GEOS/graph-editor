import { ButtonControl } from '$graph-editor/socket';
import { Node } from './Node.svelte';
import { type NodeParams } from './Node.svelte';

interface AddPinNodeParams extends NodeParams {
	numPins?: number;
}

export type AddPinNodeState = {
	numPins: number;
};

export abstract class AddPinNode extends Node {
	static __isAbstract = true;
	state: AddPinNodeState = { ...this.state, numPins: 0 };
	numPinsAdded = 0;

	constructor(params: AddPinNodeParams) {
		super(params);

		this.state.numPins = params.numPins || 0;

		this.updatePins();

		this.addControl('addPinBtn', new ButtonControl('+', () => this.addPin()));
	}

	private updatePins(): void {
		for (let i = this.numPinsAdded; i < this.state.numPins; i++) {
			this.onAddPin(i);
			this.numPinsAdded++;
		}
	}

	override applyState(): void {
		this.updatePins();
	}

	protected onAddPin(index: number) {
		throw new Error('Method not implemented.');
	}

	addPin() {
		this.onAddPin(this.state.numPins);
		this.state.numPins++;
	}
}
