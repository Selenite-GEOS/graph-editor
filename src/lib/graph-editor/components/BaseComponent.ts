import type { ComponentSupportInterface } from './ComponentSupportInterface';

export type ComponentParams = ConstructorParameters<typeof BaseComponent>[0];
export class BaseComponent<T extends ComponentSupportInterface = ComponentSupportInterface> {
	// static id: string;
	protected owner: T;

	constructor({ owner }: { owner: T }) {
		// (this.constructor as typeof BaseComponent).id = id;
		this.owner = owner;
	}

	cleanup?: () => void;
}
