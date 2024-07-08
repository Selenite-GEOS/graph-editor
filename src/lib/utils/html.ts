import type { NodeFactory, Node } from '$graph-editor';
import type { Position } from '$graph-editor/common';

export function getTranslateValues(element: HTMLElement): {
	translateX: number;
	translateY: number;
} {
	throw new Error('Not implemented');
	// const style = window.getComputedStyle(element);
	// const transform = style.transform;

	// if (transform && transform !== 'none') {
	// 	const matrix = transform
	// 		.match(/matrix.*\((.+)\)/)![1]
	// 		.split(',')
	// 		.map(Number);
	// 	const translateX = matrix[4];
	// 	const translateY = matrix[5];
	// 	return { translateX, translateY };
	// }

	// return { translateX: 0, translateY: 0 };
}

export function getScale(element: HTMLElement): {
	scaleX: number;
	scaleY: number;
} {
	const style = window.getComputedStyle(element);
	const transform = style.transform;

	let scaleX = 1;
	let scaleY = 1;
	if (transform && transform !== 'none') {
		const matrix = transform
			.match(/matrix\(([^\)]+)\)/)![1]
			.split(',')
			.map(Number);
		scaleX = matrix[0];
		scaleY = matrix[3];
	}

	return { scaleX, scaleY };
}

export function oldClientToSurfacePos({
	x,
	y,
	factory
}: {
	x: number;
	y: number;
	factory: NodeFactory;
}): [number, number] {
	const area = factory.getArea();
	if (!area) throw new Error('No area');
	const surface = area.container.children[0] as HTMLElement;
	const surfaceRect = surface.getBoundingClientRect();
	const surfacePos = { x: surfaceRect.left, y: surfaceRect.top };

	// Calculate scaled position
	const zoomScale = getScale(surface); // Implement this function to retrieve the zoom scale
	const scaledX = (x - surfacePos.x) / zoomScale.scaleX;
	const scaledY = (y - surfacePos.y) / zoomScale.scaleY;

	return [scaledX, scaledY];
}

export function clientToSurfacePos({
	pos,
	factory
}: {
	pos: Position;
	factory: NodeFactory;
}): Position {
	const [x, y] = oldClientToSurfacePos({ ...pos, factory });
	return { x, y };
}

export function translateNodeFromGlobal({
	globalPos,
	node,
	factory,
	center = false
}: {
	globalPos: { x: number; y: number };
	node: Node;
	factory: NodeFactory;
	center?: boolean;
}) {
	const area = factory.getArea();
	if (!area) throw new Error('No area');
	const nodeView = area.nodeViews.get(node.id);
	if (!nodeView) throw new Error('Node view not found');
	const rect = nodeView.element.getBoundingClientRect();
	nodeView.translate(
		...oldClientToSurfacePos({
			x: globalPos.x - (center ? rect.width / 2 : 0),
			y: globalPos.y - (center ? rect.height / 2 : 0),
			factory: factory
		})
	);
}
