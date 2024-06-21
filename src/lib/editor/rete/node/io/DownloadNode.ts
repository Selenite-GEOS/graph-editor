import  {ButtonControl}  from "../../control/button/button";

import { formatXml } from "$utils";
import { Node } from "../Node";
import type { NodeFactory } from "../NodeFactory";
import type { XMLData } from "../XML/XMLData";

export class DownloadNode extends Node {
  constructor({ factory }: { factory: NodeFactory }) {
    super({ label: "Download", factory, height: 160 });
    this.addInData({
      name: "data",
      displayName: "Data",
      socketLabel: "Data",
      type: "xmlElement:*",
    });
    this.addControl(
      "downloadBtn",
      new ButtonControl("Download", async () => {
        const inputs = await this.fetchInputs();
        const data = this.getData("data", inputs) as XMLData;
        console.log("data to convert to xml", data);
        console.log(formatXml({ xml: data.toXml() }));

        // download to computer
        const element = document.createElement("a");

        element.setAttribute(
          "href",
          "data:text/plain;charset=utf-8," +
            encodeURIComponent(formatXml({ xml: data.toXml() })),
        );
        element.setAttribute(
          "download",
          `${data.name ?? (data.tag === "Problem" ? factory.getEditor().name : data.tag)}.xml`,
        );

        element.style.display = "none";
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
      }),
    );
  }
}
