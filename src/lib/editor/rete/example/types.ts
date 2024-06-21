import { NodeEditor } from "../NodeEditor";
import type { Node } from "../node/Node";
import type { NodeFactory } from "../node/NodeFactory";

export interface EditorExample {
  (factory: NodeFactory): Promise<Node[]>;
}
