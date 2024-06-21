import type{ NodeFactory } from "$rete";
import { Node} from '../Node'
import { InputControl } from "$rete/control/Control";

export class StringNode extends Node {
  state: { current: string } = { ...this.state, current: "" };
  constructor({ factory }: { factory: NodeFactory }) {
    super({ factory, label: "String", height: 138 });

    this.addControl(
      "string",
      new InputControl("text", {
        debouncedOnChange: (val) => {
          this.state.current = val;
          this.factory.dataflowEngine.reset(this.id);
        },
      }),
    );

    this.addOutData({
      name: "data",
      type: "string",
      socketLabel: "String",
    });
  }

  override applyState(): void {
    super.applyState();
    (this.controls["string"] as InputControl<"text">)?.setValue(
      this.state.current,
    );
  }

  data(
    inputs?: Record<string, unknown> | undefined,
  ): Record<string, unknown> | Promise<Record<string, unknown>> {
    return { data: this.state.current };
  }
}
