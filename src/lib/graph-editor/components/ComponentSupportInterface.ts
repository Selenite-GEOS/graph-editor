import type { BaseComponent, ComponentParams } from './BaseComponent';

export interface ComponentSupportInterface {
	addComponentByClass<P>(componentClass: typeof BaseComponent, params: Omit<P, keyof ComponentParams>): void;
}
