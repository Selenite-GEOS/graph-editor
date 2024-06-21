import type { NodeFactory } from "../../NodeFactory";
import { SolverAPINode } from "./SolverAPINode";

export class UpdateVtkOutputNode extends SolverAPINode {
  constructor({ factory }: { factory: NodeFactory }) {
    // super('Update VTK Output', '/update_vtk_output', {
    // 	height: 300,
    // 	width: 180,
    // 	factory
    // });
    super({
      label: "Update VTK Output",
      url: "/update_vtk_output",
      factory,
      height: 300,
      width: 180,
    });

    this.addInData({
      name: "directory",
      displayName: "Directory",
      socketLabel: "Directory",
      type: "string",
      isRequired: true,
      control: {
        type: "text",
      },
    });

    this.pythonComponent.addCode(
      "$(solver).updateVtkOutputsName(directory=$(directory))",
    );
    // this.addInData({
    // 	name: 'filenames',
    // 	displayName: 'File Names',
    // 	socketLabel: 'Directory',
    // 	type: 'string',
    // 	isRequired: true,

    // });
  }
}
