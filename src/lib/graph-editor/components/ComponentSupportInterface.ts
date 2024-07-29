import type { BaseComponent, ComponentParams } from './BaseComponent';

export interface ComponentSupportInterface {
	addComponentByClass<P extends Record<string, unknown>, C extends BaseComponent>(componentClass: new (params: P) => C, params: Omit<P, keyof ComponentParams>): C;
}
