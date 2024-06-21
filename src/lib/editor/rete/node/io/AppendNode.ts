import { Node, type NodeParams } from "../Node";

interface AppendNodeParams extends NodeParams {
  a?: string;
  b?: string;
  sep?: string;
}

export class AppendNode extends Node {
  constructor({ a = "", sep = " ", b = "", factory }: AppendNodeParams) {
    // super('Append', { height: 220, factory });
    super({ label: "Append", height: 220, factory, params: { a, b, sep } });
    this.addInData({
      name: "a",
      displayName: "A",
      type: "any",
      control: {
        type: "text",
        options: {
          initial: a,
        },
      },
    });
    this.addInData({
      name: "sep",
      displayName: "Separator",
      type: "string",
      control: {
        type: "text",
        options: {
          initial: sep,
          label: "Separator",
        },
      },
    });
    this.addInData({
      name: "b",
      displayName: "B",
      type: "any",
      control: {
        type: "text",
        options: {
          initial: sep,
        },
      },
      initial: b,
    });
    this.addOutData({
      name: "result",
      type: "string",
    });

    this.pythonComponent.setDataCodeGetter(
      "result",
      () => "$(a) + $(sep) + $(b)",
    );
  }
  override data(
    inputs?: Record<string, unknown[]> | undefined,
  ): Record<string, unknown> | Promise<Record<string, unknown>> {
    const res = { result: "" };
    if (!inputs) return { ...super.data(inputs), res };
    const a = this.getData<"text">("a", inputs);
    const b = this.getData<"text">("b", inputs);
    const sep = this.getData<"text">("sep", inputs);

    // console.log("" + aValue + sepValue + bValue);

    return {
      ...super.data(inputs),
      result: "" + a + sep + b,
    };
  }
}
