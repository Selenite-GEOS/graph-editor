import { ClassicPreset } from 'rete';

export class ButtonControl extends ClassicPreset.Control {
	constructor(
		public label: string,
		public onClick: () => void
	) {
		super();
	}
}
