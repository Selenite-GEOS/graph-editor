import { mount, unmount, type Component } from 'svelte';

import Root from './Root.svelte';
import { isEqual } from 'lodash-es';

type Payload = Record<string, unknown> | null | void | undefined;

export type SvelteRenderer<I = MountedComponent> = {
	get(element: Element): MountedComponent | undefined;
	mount(
		element: Element,
		Component: Component,
		payload: Payload,
		onRendered: () => void
	): MountedComponent;
	update(app: MountedComponent, payload: Payload): void;
	unmount(element: Element): void;
};

export type MountedComponent = ReturnType<typeof mount>;
export function getSvelteRenderer(): SvelteRenderer<Component> {
	const instances = new Map<Element, MountedComponent>();
	const appProps = new Map<MountedComponent, { props: Payload; onRendered: () => void }>();

	return {
		get(element) {
			return instances.get(element);
		},
		mount(element, Component, payload, onRendered) {
			const props = $state({ component: Component, props: payload || {}, onRendered });
			const app = mount(Root, { target: element, props });
			appProps.set(app, props);

			instances.set(element, app);

			return app;
		},
		update(app, payload) {
			const props = appProps.get(app);
			if (!props) {
				console.error('App props not found');
				console.log(app, payload);
				return;
			}
			if (!props.props || !payload) {
				return;
			}
			for (const [k, v] of Object.entries(payload)) {
				props.props[k] = v;
			}
		},
		unmount(element) {
			const app = instances.get(element);

			if (app) {
				unmount(app);
				instances.delete(element);
			}
		}
	};
}
