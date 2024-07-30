import { BaseComponent } from "$graph-editor/components";
import { zip } from "wu";
import type { NodeFactory } from "./NodeFactory.svelte";
import { Layout, Vector2D } from "@selenite/commons";
import type { GraphNode } from "$graph-editor/nodes";


export class NodeLayout extends BaseComponent<NodeFactory> {
	async applyOffsets(nodes: GraphNode[], offsets: Vector2D[]) {
		if (!this.owner.area) {
			console.error("Can't apply offsets, no area.");
			return;
		}
		for (const [node, offset] of zip(nodes, offsets)) {
			const view = this.owner.area.nodeViews.get(node.id);
			if (!view) {
				console.error('Missing view for node.');
				continue;
			}
			const newPos = Vector2D.add(view.position, offset);
			await this.owner.area.translate(node.id, newPos);
		}
	}

	getLayoutRectsAndRefPos(): { rects: Layout.LayoutRect[]; refPos: number } {
		if (!this.owner.area) {
			console.error("Can't get layout rects, no area.");
			return { rects: [], refPos: 0 };
		}
		const selectedNodes = this.owner.selector.nodes;
		const pickedNode = this.owner.selector.pickedNode;
		const rects: Layout.LayoutRect[] = [];
		let refPos = 0;
		for (const [i, node] of selectedNodes.entries()) {
			const view = this.owner.area.nodeViews.get(node.id);
			if (!view) {
				console.error('Missing view for node.');
				continue;
			}
			const boundingRect = view.element.getBoundingClientRect();
			rects.push({
				x: view.position.x,
				y: view.position.y,
				h: node.height,
				w: node.width
			});
			// if (node === pickedNode) {
			// 	refPos = i;
			// }
		}
		return { rects, refPos };
	}

	getOffsets(
		offsetFunction: (rects: Layout.LayoutRect[], options: Layout.LayoutOptions) => Vector2D[]
	): Vector2D[] {
		const { rects, refPos } = this.getLayoutRectsAndRefPos();
		return offsetFunction(rects, { refPos });
	}
	
	applyLayout(
		offsetFunction: (rects: Layout.LayoutRect[], options: Layout.LayoutOptions) => Vector2D[]
	) {
        const offsets = this.getOffsets(offsetFunction)
        return this.applyOffsets(this.owner.selector.nodes, offsets)
    }

	justifyLeft() {
		return this.applyLayout(Layout.getJustifyLeftOffsets);
	}

    justifyRight() {
        return this.applyLayout(Layout.getJustifyRightOffsets);
    }

    justifyCenter() {
        return this.applyLayout(Layout.getJustifyCenterOffsets);
    }

    justifyBetween() {
        return this.applyLayout((rects: Layout.LayoutRect[]) => Layout.getJustifyBetweenOffsets(rects));
    }

    alignTop() {
        return this.applyLayout(Layout.getAlignTopOffsets);
    }

    alignMiddle() {
        return this.applyLayout(Layout.getAlignMiddleOffsets);
    }

    alignBottom() {
        return this.applyLayout(Layout.getAlignBottomOffsets);
    }

    spaceVertical() {
        return this.applyLayout((rects: Layout.LayoutRect[]) => Layout.getAlignBetweenOffsets(rects));
    }


}