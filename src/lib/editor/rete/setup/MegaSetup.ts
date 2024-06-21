import type { AreaPlugin } from "rete-area-plugin";
import type { NodeEditor } from "../NodeEditor";
import type { AreaExtra } from "../node/AreaExtra";
import type { Schemes } from "../node/Schemes";
import { Setup } from "./Setup";
// import { MinimapSetup } from "./MinimapSetup";
import type { NodeFactory } from "../node/NodeFactory";
// import { ContextMenuSetup } from "../plugin/context-menu/context-menu";
import { AreaSetup } from "./AreaSetup";
import { ConnectionSetup } from "./ConnectionSetup";
import type { GeosDataContext } from "$lib/geos";
import type { NewGeosContext } from "$lib/global";

export class MegaSetup extends Setup {
  render: boolean;
  toSetup: Setup[] = [
    new ConnectionSetup(),
    new AreaSetup(),
    // new MinimapSetup(),
    // new ContextMenuSetup(),
  ];

  constructor({render=false}: {render?: boolean}) {
    super()
    this.render = render
    
  }

  async setup(
    editor: NodeEditor,
    area: AreaPlugin<Schemes, AreaExtra> | undefined,
    factory: NodeFactory,
    geos: GeosDataContext,
    geosContextV2: NewGeosContext,
  ) {
    // if (this.render) {
    //   const { RenderSetup } = await import("../customization/render");
    //   this.toSetup.push(new RenderSetup());
    // }
    for (const setup of this.toSetup) {
      setup.setup(editor, area, factory, geos, geosContextV2);
    }
  }
}
