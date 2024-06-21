import { Node } from "../node/Node";
import { NodeFactory } from "../node/NodeFactory";

export {};

const areclassesSetup = false;
async function setupClasses() {
  console.log("Setting up classes");

  const modules = import.meta.glob("../node/**/*.ts");
  for (const [path, module] of Object.entries(modules)) {
    const objects = await module();
    const menuPath = path.slice("../node/".length);

    // for (const file of nodeFiles) {
    // 	const objects = await import(/* @vite-ignore */ `../../node/${file}`);

    const nodeClasses: (typeof Node)[] = Object.values(objects).filter(
      (value: unknown) => {
        const prototype = (value as { prototype }).prototype;

        return (
          prototype instanceof Node &&
          prototype.constructor &&
          !Object.prototype.hasOwnProperty.call(
            prototype.constructor,
            "__isAbstract",
          )
        );
      },
    ) as (typeof Node)[];

    // TODO: Move somewhere else or rename file
    nodeClasses.forEach((nodeClass) => {
      nodeClass.id = menuPath.slice(0, -3);
      NodeFactory.registerClass(nodeClass.id, nodeClass);
    });
    // console.log(nodeClasses);

    // items.push([file, () => new node()]);
  }
}

// await setupClasses();
