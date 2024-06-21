import { GetGraphStore } from "$houdini";
import type { NodeEditorSaveData, NodeFactory } from "$rete";
import { MacroNode } from "$rete/node/MacroNode";
import type { EditorExample } from "./types";

export const macroNodeExample: EditorExample = async (factory: NodeFactory) => {
  const data = (
    await new GetGraphStore().fetch({
      variables: { id: "ed68d84f-3feb-443c-b288-4d9110ab1edb" },
    })
  ).data?.graph.data;
  if (data === undefined) throw new Error("No save data");

  const saveData: NodeEditorSaveData = JSON.parse(data);
  await factory.addNode(MacroNode, {
    saveData,
    graphId: "ed68d84f-3feb-443c-b288-4d9110ab1edb",
  });

  return factory.getNodes();
};
