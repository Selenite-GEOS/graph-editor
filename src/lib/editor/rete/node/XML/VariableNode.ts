import type { NodeEditor, Output, Socket } from "$rete";
import { get } from "svelte/store";
import { Node } from "../Node";
import type { NodeFactory } from "../NodeFactory";

export class VariableNode extends Node {
  private editor: NodeEditor;
  public readonly variableId: string;

  constructor({
    factory,
    variableId,
  }: {
    factory: NodeFactory;
    variableId: string;
  }) {
    super({ factory, params: { variableId }, height: 40, width: 150 });
    this.variableId = variableId;
    this.editor = factory.getEditor();
    const variable = get(this.editor.variables)[variableId];
    this.addOutData({
      name: "value",
      type: variable.type,
      socketLabel: variable.type,
    });
    this.editor.variables.subscribe(async (variables) => {
      if (variableId in variables) {
        this.label = variables[variableId].name;
        (this.outputs["value"] as Output).socket.type =
          variables[variableId].type;
      } else {
        for (const conns of Object.values(this.outgoingDataConnections))
          for (const conn of Object.values(conns))
            await this.editor.removeConnection(conn.id);

        await this.editor.removeNode(this.id);
        return;
      }
      this.updateElement();
      try {
        this.factory.dataflowEngine.reset(this.id);
      } catch (e) {}
    });
  }

  data(inputs?: Record<string, unknown> | undefined): Record<string, unknown> {
    return {
      value: get(this.editor.variables)[this.variableId].value,
    };
  }
}
