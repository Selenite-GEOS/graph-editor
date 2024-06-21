import type { NodeFactory } from "../../NodeFactory";
import { SolverAPINode } from "./SolverAPINode";

export class ApplyInitialConditionsNode extends SolverAPINode {
  constructor({ factory }: { factory: NodeFactory }) {
    // super('Apply Initial Conditions', '/apply_initial_conditions', { factory });
    super({
      label: "Apply Initial Conditions",
      url: "/apply_initial_conditions",
      factory,
    });
    this.pythonComponent.addCode("$(solver).applyInitialConditions()");
  }
}
