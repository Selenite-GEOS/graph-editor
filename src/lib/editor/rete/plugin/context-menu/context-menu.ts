import { ContextMenuPlugin, Presets } from "rete-context-menu-plugin";
import type { Schemes } from "../../node/Schemes";
import type { AreaPlugin } from "rete-area-plugin";
import type { AreaExtra } from "../../node/AreaExtra";
import { Node } from "../../node/Node";
import { capitalize } from "$utils/string";
import { Setup } from "../../setup/Setup";
import { _, type NewGeosContext } from "$lib/global";
import type { NodeEditor } from "../../NodeEditor";
import type { NodeFactory } from "../../node/NodeFactory";

import {
  GeosXmlSchemaStore as GetXmlSchemaStore,
  PendingValue,
} from "houdini";
import { XmlNode } from "$rete/node/XML/XmlNode";
import type { XmlAttributeDefinition } from "$rete/node/XML/types";
import {
  moonMenuItemsStore,
  type MoonMenuItem,
  moonMenuVisibleStore,
  moonMenuPositionStore,
  newMoonItemsStore,
  moonMenuFactoryStore,
  moonMenuSearchBarStore,
  spawnMoonMenu,
} from "$lib/menu/context-menu/moonContextMenu";
import { GetNameNode } from "$rete/node/XML/GetNameNode";
import { MakeArrayNode } from "$rete/node/data/MakeArrayNode";
import { StringNode } from "$rete/node/data/StringNode";
import { factory } from "typescript";
import { DownloadNode } from "$rete/node/io/DownloadNode";
import {
  createActionMenuItem,
  createNodeMenuItem,
  type IBaseMenuItem,
  type INodeMenuItem,
} from "$lib/menu/types";
import type { GeosDataContext } from "$lib/geos";
import { get } from "svelte/store";
import wu from "wu";
import { ErrorWNotif } from "$lib/global";
import type { SelectorEntity } from "rete-area-plugin/_types/extensions/selectable";
import { EditorType } from "$lib/editor";
import { VariableNode } from "$rete/node/XML/VariableNode";
import type { Variable } from "$lib/editor/overlay/variables-list";
import { newUuid } from "$utils";
import { stringify } from "uuid";

type Entry = Map<string, Entry | (() => Node | Promise<Node>)>;
function isClassConstructor(obj: unknown): boolean {
  return (
    typeof obj === "function" && !!obj.prototype && !!obj.prototype.constructor
  );
}

function pushMenuItem(
  items: Entry,
  prefix: string[],
  item: typeof Node | (() => Node | Promise<Node>),
  factory: NodeFactory,
): void {
  if (prefix.length == 1) {
    // check if item is a node class
    // if so, add it to the menu
    // otherwise, add it as a function

    items.set(
      prefix[0].split(".")[0],
      isClassConstructor(item)
        ? () => new (item as typeof Node)({ factory: factory })
        : (item as () => Node | Promise<Node>),
    );
  } else {
    const entry = prefix[0];
    if (!items.has(entry)) {
      items.set(entry, new Map<string, Entry>());
    }
    pushMenuItem(
      items.get(entry) as Map<string, Entry>,
      prefix.slice(1, prefix.length),
      item,
      factory,
    );
  }
}

function getMenuArray(items: Map<string, Entry>) {
  // console.log(items);

  return [...items.entries()].map(([key, value], i) => {
    const map = value as Map<string, Entry>;

    if (value instanceof Function) {
      return [capitalize(key.slice(0, -4)), value];
    } else return [capitalize(key), getMenuArray(map)];
  });
}

export class ContextMenuSetup extends Setup {
  selectedNodes: SelectorEntity[] = [];
  async setup(
    editor: NodeEditor,
    area: AreaPlugin<Schemes, AreaExtra>,
    __factory: NodeFactory,
    geos: GeosDataContext,
    geosContextV2: NewGeosContext,
  ): Promise<void> {
    const re = /[/\\]/i;

    // console.log(nodeFiles);
    const items = new Map<string, Entry>();
    console.log("Setting up context menu");
    const modules = import.meta.glob("../../node/**/*.ts");
    for (const [path, module] of Object.entries(modules)) {
      const objects = await module();
      const menuPath = path.slice("../../node/".length);

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
            ) &&
            !Object.prototype.hasOwnProperty.call(
              prototype.constructor,
              "hidden",
            )
          );
        },
      ) as (typeof Node)[];

      nodeClasses.forEach((node) =>
        pushMenuItem(items, menuPath.split(re), node, __factory),
      );

      // console.log(nodeClasses);

      // items.push([file, () => new node()]);
    }
    return;
    // const xmlSchema = (await new GetXmlSchemaStore().fetch()).data?.geos
    //   .xmlSchema;
    const xmlSchema: {
      complexTypes: ({ name: string, attributes: {name: string}[] } | typeof PendingValue)[];
    } = {
      complexTypes: []
    }

    const newMoonItems: IBaseMenuItem[] = [];

    if (xmlSchema) {
      const moonItems: MoonMenuItem[] = [];
      const complexTypesWithName: string[] = [];
      const complexTypes: string[] = [];

      for (const complexType of xmlSchema.complexTypes) {
        if (complexType === PendingValue) continue;
        const name = complexType.name.match(/^(.*)Type$/)?.at(1);
        if (!name)
          throw new Error(`Invalid complex type name: ${complexType.name}`);

        const hasNameAttribute = complexType.attributes.some(
          (attr) => attr.name === "name",
        );
        if (hasNameAttribute) complexTypesWithName.push(name);

        complexTypes.push(name);
        const xmlNodeAction: (factory: NodeFactory) => Node = (factory) =>
          new XmlNode({
            label: name,
            factory: factory,

            xmlConfig: {
              noName: !hasNameAttribute,
              childTypes: complexType.childTypes.map((childType) => {
                const childName = childType.match(/^(.*)Type$/)?.at(1);
                if (!childName) return childType;
                return childName;
              }),
              xmlTag: name,
              outData: {
                name: name,
                type: `xmlElement:${name}`,
                socketLabel: name,
              },

              xmlProperties: complexType.attributes.map<XmlAttributeDefinition>(
                (attr) => {
                  console.log(attr);

                  const simpleType = geosContextV2.geosSchema.simpleTypes.get(
                    attr.type,
                  );
                  if (!simpleType)
                    console.warn(`Simple type ${attr.type} not found`);

                  return {
                    name: attr.name,
                    required: attr.required,
                    options: simpleType?.enum ?? null,
                    pattern: simpleType?.pattern,
                    type: attr.type,
                    controlType: "text",
                  };
                },
              ),
            },
          });
        const typesPaths = geos.typesPaths;
        if (typesPaths)
          newMoonItems.push(
            createNodeMenuItem({
              label: name,
              menuPath: (get(typesPaths) as Record<string, string[]>)[name],
              addNode: xmlNodeAction,
              inTypes: complexType.childTypes.map((childType) => {
                const childName = childType.match(/^(.*)Type$/)?.at(1);
                if (!childName) return childType;
                return childName;
              }),
              outTypes: [name],
            }),
          );
        moonItems.push({
          label: name,
          outType: name,
          inChildrenTypes: complexType.childTypes.map((childType) => {
            const childName = childType.match(/^(.*)Type$/)?.at(1);
            if (!childName) return childType;
            return childName;
          }),
          action: xmlNodeAction,
        });
        pushMenuItem(
          items,
          ["XML", complexType.name],
          () => xmlNodeAction(__factory),
          __factory,
        );
      }
      const getNameNodeItem: MoonMenuItem = {
        action: (factory) => new GetNameNode({ factory }),
        inChildrenTypes: complexTypesWithName,
        label: "Get Name",
        outType: "string",
      };
      const makeArrayNodeItem: MoonMenuItem = {
        action: (factory) => new MakeArrayNode({ factory }),
        inChildrenTypes: [],
        label: "Make Array",
        outType: "array",
      };
      const stringNodeItem: MoonMenuItem = {
        action: (factory) => new StringNode({ factory }),
        inChildrenTypes: [],
        label: "String",
        outType: "string",
      };
      const downloadSchemaItem: MoonMenuItem = {
        action: (factory) => new DownloadNode({ factory }),
        inChildrenTypes: ["Problem"],
        label: "Download",
        outType: "",
      };
      moonMenuItemsStore.set([
        stringNodeItem,
        getNameNodeItem,
        makeArrayNodeItem,
        downloadSchemaItem,
        ...moonItems,
      ]);
      newMoonItems.push(
        createNodeMenuItem({
          label: "Get Name",
          addNode: getNameNodeItem.action,
          inTypes: complexTypesWithName,
          outTypes: ["groupNameRef"],
          description: "Get the name of the GEOS element",
          tags: ["name", "get"],
        }),
        createNodeMenuItem({
          label: "Make Array",
          addNode: makeArrayNodeItem.action,
          inTypes: ["*"],
          outTypes: ["array"],
          description: "Make an array from the input",
          tags: ["array", "make"],
        }),
        createNodeMenuItem({
          label: "Download",
          addNode: downloadSchemaItem.action,
          inTypes: [...geosContextV2.geosSchema.complexTypes.keys()],
          description: "Download the problem as xml",
          tags: ["download", "xml"],
        }),
      );

      newMoonItemsStore.set([...newMoonItems]);
    }

    const contextMenu = new ContextMenuPlugin<Schemes>({
      items: Presets.classic.setup(getMenuArray(items)),
    });

    area.addPipe((context) => {
      if (
        (
          ["pointermove", "render", "rendered"] as (typeof context.type)[]
        ).includes(context.type)
      )
        return context;
      const selector = __factory.selector;
      if (!selector) throw new ErrorWNotif("Selector doesn't exist");
      if (context.type === "pointerdown") {
        const event = context.data.event;
        const nodeDiv =
          event.target instanceof HTMLElement
            ? event.target.classList.contains("node")
              ? event.target
              : event.target.closest(".node")
            : null;
        if (
          event.target instanceof HTMLElement &&
          event.button === 2 &&
          (event.target.classList.contains("node") ||
            event.target.closest(".node")) !== null
        ) {
          const entries = Array(...area.nodeViews.entries());

          const nodeId = entries.find(
            (t) => t[1].element === nodeDiv?.parentElement,
          )?.[0];
          if (!nodeId) return context;
          __factory.selectableNodes?.select(nodeId, true);
          const selectedNodes = wu(selector.entities.values())
            .filter((t) => editor.getNode(t.id) !== undefined)
            .toArray();
          // console.log('remember selected', selectedNodes);
          if (selectedNodes.length > 0) {
            this.selectedNodes = selectedNodes;
          }
        }
      }
      if (context.type === "contextmenu") {
        // Context menu on node
        if (context.data.context !== "root") {
          if (!(context.data.context instanceof Node)) return context;

          context.data.event.preventDefault();
          context.data.event.stopImmediatePropagation();
          return;
        }
        // Context menu on editor
        context.data.event.preventDefault();
        const variables: INodeMenuItem[] = [];

        for (const v of Object.values(get(editor.variables))) {
          variables.push(
            createNodeMenuItem({
              label: v.name,
              outTypes: [v.type],
              menuPath: ["Variables"],
              editorType: EditorType.XML,
              addNode: ({ factory }) => {
                return new VariableNode({
                  factory: __factory,
                  variableId: v.id,
                });
              },
            }),
          );
        }

        spawnMoonMenu({
          items: [...variables, ...newMoonItems],
          searchbar: true,
          pos: { x: context.data.event.clientX, y: context.data.event.clientY },
        });
        moonMenuFactoryStore.set(__factory);
      }
      return context;
    });

    // area.use(contextMenu);
  }
}
