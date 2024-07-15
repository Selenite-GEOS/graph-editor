
import type { Schemes } from '$graph-editor/schemes';
import { getElementCenter } from 'rete-render-utils';
// import { Side } from '../types';
import type { Position } from '@selenite/commons';
import { BaseSocketPosition } from './base-socket-position';
export type Side = 'input' | 'output'
/**
 * Props for `DOMSocketPosition` class.
 */
export type Props = {
	/**
	 * Allows to customize the position of the socket. By default, the position is shifted by 12px on the x-axis relative to the center of the socket.
	 * @param position Center position of the socket
	 * @param nodeId Node ID
	 * @param side Side of the socket, 'input' or 'output'
	 * @param key Socket key
	 * @returns Custom position of the socket
	 */
	offset?: (position: Position, nodeId: string, side: Side, key: string) => Position;
};

/**
 * Class for socket position calculation based on DOM elements. It uses `getElementCenter` function to calculate the position.
 */
export class DOMSocketPosition<K> extends BaseSocketPosition<
	Schemes,
	K
> {
	constructor(private props?: Props) {
		super();
	}

	async calculatePosition(nodeId: string, side: Side, key: string, element: HTMLElement) {
		const view = this.area?.nodeViews.get(nodeId);
        console.debug("calculate position")
		if (!view?.element) return null;
		const position = await getElementCenter(element, view.element);

		if (this.props?.offset) return this.props?.offset(position, nodeId, side, key);

		return {
			// x: position.x + 12 * (side === 'input' ? -1 : 1),
			x: position.x,
			y: position.y
		};
	}
}

/**
 * Wrapper function for `DOMSocketPosition` class.
 * @param props Props for `DOMSocketPosition` class
 */
export function getDOMSocketPosition<K>(props?: Props) {
	return new DOMSocketPosition<K>(props);
}
