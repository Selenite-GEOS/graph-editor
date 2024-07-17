import type { ComponentSupportInterface } from './ComponentSupportInterface';

export type ComponentParams = ConstructorParameters<typeof BaseComponent>[0]
export class BaseComponent {
	// static id: string;
	protected owner: ComponentSupportInterface;

	constructor({ owner }: { owner: ComponentSupportInterface }) {
		// (this.constructor as typeof BaseComponent).id = id;
		this.owner = owner;
	}
}
