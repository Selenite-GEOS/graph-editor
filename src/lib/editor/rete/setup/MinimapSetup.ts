import type { AreaPlugin } from "rete-area-plugin";
import type { NodeEditor } from "../NodeEditor";
import type { AreaExtra } from "../node/AreaExtra";
import type { Schemes } from "../node/Schemes";
import { Setup } from "./Setup";
import { MinimapPlugin } from "rete-minimap-plugin";
import type { NodeFactory } from "../node/NodeFactory";

export class MinimapSetup extends Setup {
  private minimap = new MinimapPlugin<Schemes>();
  setup(
    editor: NodeEditor,
    area: AreaPlugin<Schemes, AreaExtra>,
    factory: NodeFactory,
  ): void {
    area.use(this.minimap);
  }
}
