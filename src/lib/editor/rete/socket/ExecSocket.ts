import type { Node } from "$rete/node/Node";
import { Socket } from "./Socket";

export class ExecSocket extends Socket {
  constructor({ name, node }: { name?: string; node: Node }) {
    super({ name: name, type: "exec", node, displayLabel: true });
  }
}
