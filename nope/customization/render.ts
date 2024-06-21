// import { ReactRenderPlugin } from 'rete-react-render-plugin';
import type { Schemes } from "../node/Schemes";
import type { AreaExtra } from "../node/AreaExtra";
// import { Presets } from 'rete-react-render-plugin';
import type { Area2D, AreaPlugin } from "rete-area-plugin";
// import { createRoot } from 'react-dom/client';
import type { NodeEditor } from "rete";
import CustomNode from "$custom-components/Node.svelte";
// import { CustomArraySocket } from './presets/classic/components/CustomArraySocket';
import { ButtonControl } from "../control/button/button";
import type { NodeFactory } from "../node/NodeFactory";
import CustomButton from "../control/button/CustomButton.svelte";
import CustomConnection from "$custom-components/Connection.svelte";
import CustomExecSocket from "$custom-components/ExecSocket.svelte";
import CustomSocket from "$custom-components/Socket.svelte";
import type { Setup } from "../setup/Setup";
import { SveltePlugin, Presets } from "rete-svelte-plugin";
import { InputControl } from "$rete/control/Control";
import InputControlComponent from "$rete/customization/presets/classic/components/InputControl.svelte";
import { Socket } from "$rete/socket/Socket";
import AddXmlAttributeControlCmpnt from "$rete/node/XML/AddXmlAttributeControl.svelte";
import { AddXmlAttributeControl } from "$rete/node/XML/AddXmlAttributeControl";
// import { ReactPlugin, Presets } from 'rete-react-plugin';

import { ConnectionPathPlugin } from "rete-connection-path-plugin";
import {
  curveStep,
  type CurveFactory,
  curveBasis,
  curveLinear,
  curveMonotoneX,
} from "d3-shape";
import { get } from "svelte/store";
import { ErrorWNotif } from "$lib/global";
import type { Connection } from "$rete";
import { assignConnectionPath } from "$lib/editor/connection-path";

export class RenderSetup implements Setup {
  private render = new SveltePlugin<Schemes, AreaExtra>();
  // private render = new ReactPlugin<Schemes, AreaExtra>();

  setup(
    editor: NodeEditor<Schemes>,
    area: AreaPlugin<Schemes, AreaExtra>,
    factory: NodeFactory,
  ) {
    const pathPlugin = new ConnectionPathPlugin<Schemes, Area2D<Schemes>>({
      curve: (conn: Connection) =>
        assignConnectionPath(get(factory.connectionPathType)),
    });

    factory.connectionPathType.subscribe(() => {
      const area = factory.getArea();
      if (!area) {
        console.warn("Area not found");
        return;
      }
      for (const conn of editor.getConnections()) {
        area.update("connection", conn.id);
      }
    });

    this.render.use(pathPlugin);
    this.render.addPreset(
      Presets.classic.setup({
        customize: {
          socket(context) {
            if (context.payload instanceof Socket) {
              if (context.payload.type === "exec") return CustomExecSocket;
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
            if (data.payload instanceof AddXmlAttributeControl)
              return AddXmlAttributeControlCmpnt;

            return Presets.classic.Control;
          },
          connection(data) {
            return CustomConnection;
          },

          node(data) {
            return CustomNode;
          },
        },
      }),
    );

    this.render.addPreset(Presets.contextMenu.setup({ delay: 50 }));
    this.render.addPreset(Presets.minimap.setup({ size: 200 }));
    // this.render.addPreset({})

    area.use(this.render);
  }
}
