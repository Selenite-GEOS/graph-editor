import type { ComponentSupportInterface } from './ComponentSupportInterface';

export class BaseComponent {
	// static id: string;
	protected owner: ComponentSupportInterface;

	constructor({ id, owner }: { id?: string; owner: ComponentSupportInterface }) {
		// (this.constructor as typeof BaseComponent).id = id;
		this.owner = owner;
	}
}
