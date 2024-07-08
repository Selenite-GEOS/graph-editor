import { assignConnectionPath } from '$graph-editor/connection-path';
import type { Connection } from '$graph-editor/nodes';
import type { Schemes } from '$graph-editor/schemes';
import type { SetupFunction } from '$graph-editor/setup';
import { Scope, type BaseSchemes, type CanAssignSignal } from 'rete';
import type { Area2D, RenderSignal } from 'rete-area-plugin';
import type { Position } from 'rete-area-plugin/_types/types';
import { ConnectionPathPlugin } from 'rete-connection-path-plugin';
import { get } from 'svelte/store';
import type { Component } from 'svelte';
import { getSvelteRenderer, type SvelteRenderer } from './renderer.svelte';
import { ButtonControl, InputControl, Socket } from '$graph-editor/socket';

type ComponentProps = Record<string, any> | undefined | void | null;
type RenderResult = { component: Component; props: ComponentProps } | undefined | void | null;

export type RenderPreset = {
	attach?: (plugin: SveltePlugin) => void;
	update: (
		context: Extract<Requires<Schemes>, { type: 'render' }>,
		plugin: SveltePlugin<Requires<Schemes>>
	) => ComponentProps;
	render: (
		context: Extract<Requires<Schemes>, { type: 'render' }>,
		plugin: SveltePlugin<Requires<Schemes>>
	) => RenderResult;
};

type Requires<Schemes extends BaseSchemes> =
	| RenderSignal<'node', { payload: Schemes['Node'] }>
	| RenderSignal<'connection', { payload: Schemes['Connection']; start?: Position; end?: Position }>
	| { type: 'unmount'; data: { element: HTMLElement } };

class SveltePlugin<T = Requires<Schemes>> extends Scope<Schemes, [T | Requires<Schemes>]> {
	renderer: SvelteRenderer;
	readonly presets: RenderPreset[] = [];
	owners = new WeakMap<HTMLElement, RenderPreset>();
	constructor() {
		super('svelte-render');
		this.renderer = getSvelteRenderer();
		this.addPipe((context) => {
			if (!context || typeof context !== 'object' || !('type' in context)) return context;

			if (context.type === 'unmount') {
				this.unmount(context.data.element);
			} else if (context.type === 'render') {
				if ('filled' in context.data && context.data.filled) {
					return context;
				}
				if (this.mount(context.data.element, context as T)) {
					return {
						...context,
						data: {
							...context.data,
							filled: true
						}
					} as typeof context;
				}
			}

			return context;
		});
	}
	apps = new Map<HTMLElement, Node>();
	setParent(scope: Scope<Requires<Schemes>>): void {
		super.setParent(scope);

		this.presets.forEach((preset) => {
			if (preset.attach) preset.attach(this);
		});
	}

	private unmount(element: HTMLElement) {
		this.owners.delete(element);
		this.renderer.unmount(element);
	}

	// apps = new Map<HTMLElement, Node>();
	private mount(element: HTMLElement, context: T) {
		// console.log('mount', element);
		const existing = this.renderer.get(element);
		const parent = this.parentScope();

		if (existing) {
			this.presets.forEach((preset) => {
				if (this.owners.get(element) !== preset) return;
				const result = preset.update(context as Extract<T, { type: 'render' }>, this);

				if (result) {
					this.renderer.update(existing, result);
				}
			});
			return true;
		}

		for (const preset of this.presets) {
			const result = preset.render(context as Extract<T, { type: 'render' }>, this);

			if (!result) continue;

			this.renderer.mount(element, result.component, result.props, () =>
				parent?.emit({ type: 'rendered', data: (context as Requires<Schemes>).data } as T)
			);

			this.owners.set(element, preset);
			return true;
		}
		return false;
	}
	/**
	 * Adds a preset to the plugin.
	 * @param preset Preset that can render nodes, connections and other elements.
	 */
	public addPreset<K>(preset: RenderPreset) {
		const local = preset as RenderPreset;

		if (local.attach) local.attach(this);
		this.presets.push(local);
	}
}

export const setupSvelteRender: SetupFunction = async (params) => {
	const { area, factory, editor } = params;
	if (!area) {
		console.warn('Could not setup svelte render, area not found');
		return params;
	}
	console.log('Setting up svelte render');
	const sveltePlugin = new SveltePlugin();
	const pathPlugin = new ConnectionPathPlugin<Schemes, Area2D<Schemes>>({
		curve: (conn: Connection) => assignConnectionPath(get(factory.connectionPathType))
	});
	factory.connectionPathType.subscribe(() => {
		const area = factory.getArea();
		if (!area) {
			console.warn('Area not found');
			return;
		}
		for (const conn of editor.getConnections()) {
			area.update('connection', conn.id);
		}
	});
	// @ts-expect-error
	sveltePlugin.use(pathPlugin);
	const { setup: minimapPreset } = await import('rete-svelte-plugin/svelte/presets/minimap');
	const { AddXmlAttributeControl } = await import('$graph-editor/nodes/XML');
	const Presets = await import('./presets');
	sveltePlugin.addPreset(minimapPreset({ size: 200 }));
	// sveltePlugin.addPreset(Presets.contextMenu.setup())
	sveltePlugin.addPreset(
		Presets.classic.setup({
			customize: {
				socket(context) {
					if (context.payload instanceof Socket) {
						if (context.payload.type === 'exec') return Presets.classic.ExecSocket;
						return Presets.classic.Socket;
					}

					return Presets.classic.Socket;
				},
				control(data) {
					if (data.payload instanceof InputControl) {
						return Presets.classic.InputControl;
					}
					if (data.payload instanceof ButtonControl) {
						return Presets.classic.Button;
					}
					if (data.payload instanceof AddXmlAttributeControl)
						return Presets.classic.AddXmlAttributeControl;

					return Presets.classic.Control;
				}
			}
		})
	);
	area.use(sveltePlugin);

	return params;
};
