// import { ReactRenderPlugin } from 'rete-react-render-plugin';
import type { Schemes } from '$graph-editor/schemes';
import type { AreaExtra } from '$graph-editor/area';
// import { Presets } from 'rete-react-render-plugin';
import type { Area2D, AreaPlugin } from 'rete-area-plugin';
// import { createRoot } from 'react-dom/client';
import type { NodeEditor } from 'rete';
import CustomNode from '$custom-components/Node.svelte';
// import { CustomArraySocket } from './presets/classic/components/CustomArraySocket';
import { ButtonControl } from '$graph-editor/socket';
import type { NodeFactory } from '$graph-editor/editor';
import CustomButton from '../../../graph-editor/render/svelte/presets/classic/components/Button.svelte';
import CustomConnection from '$custom-components/Connection.svelte';
import CustomExecSocket from '$custom-components/ExecSocket.svelte';
import CustomSocket from '$custom-components/Socket.svelte';
import type { SetupClass, SetupFunction } from '$graph-editor/setup/Setup';

import { InputControl } from '$graph-editor/socket';
import InputControlComponent from '$custom-components/InputControl.svelte';
import { Socket } from '$graph-editor/socket/Socket';
import AddXmlAttributeControlCmpnt from '$graph-editor/render/svelte/presets/classic/components/AddXmlAttributeControl.svelte';
// import { AddXmlAttributeControl } from '$graph-editor/nodes/XML/AddXmlAttributeControl';
// import { ReactPlugin, Presets } from 'rete-react-plugin';

import { ConnectionPathPlugin } from 'rete-connection-path-plugin';
// import { curveStep, type CurveFactory, curveBasis, curveLinear, curveMonotoneX } from 'd3-shape';
import { get } from 'svelte/store';
import { ErrorWNotif } from '$lib/global';
import { AddXmlAttributeControl, type Connection } from '$graph-editor';
import { assignConnectionPath } from '$graph-editor/connection-path';

export class RenderSetup implements SetupClass {
	// private render = new ReactPlugin<Schemes, AreaExtra>();

	setup(editor: NodeEditor<Schemes>, area: AreaPlugin<Schemes, AreaExtra>, factory: NodeFactory) {}
}

export const setupSvelteRender: SetupFunction = async (params) => {
	const isBrowser = typeof window !== 'undefined';
	if (!isBrowser) {
		console.warn(
			'Skipping setup of svelte render, svelte render plugin can only be used in browser'
		);
		return params;
	}

	const { editor, factory, area } = params;

	if (!area) {
		console.warn("AreaPlugin is not defined, can't setup svelte render plugin.");
		return params;
	}
	const { SveltePlugin, Presets } = await import('rete-svelte-plugin');
	const render = new SveltePlugin<Schemes, AreaExtra>();
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

	render.use(pathPlugin);
	render.addPreset(
		Presets.classic.setup({
			customize: {
				socket(context) {
					if (context.payload instanceof Socket) {
						if (context.payload.type === 'exec') return CustomExecSocket;
						return context.payload.isArray ? CustomSocket : CustomSocket;
					}

					return Presets.classic.Socket;
				},
				control(data) {
					if (data.payload instanceof InputControl) {
						return InputControlComponent;
					}
					if (data.payload instanceof ButtonControl) {
						return CustomButton;
					}
					if (data.payload instanceof AddXmlAttributeControl) return AddXmlAttributeControlCmpnt;

					return Presets.classic.Control;
				},
				connection(data) {
					return CustomConnection;
				},

				node(data) {
					return CustomNode;
				}
			}
		})
	);

	render.addPreset(Presets.contextMenu.setup({ delay: 50 }));
	render.addPreset(Presets.minimap.setup({ size: 200 }));
	// render.addPreset({})

	area.use(render);
	return params;
};
