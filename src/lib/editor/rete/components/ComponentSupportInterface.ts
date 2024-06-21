import type { BaseComponent } from "./BaseComponent";

export interface ComponentSupportInterface {
  addComponentByClass(componentClass: typeof BaseComponent): void;
}
