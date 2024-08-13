// import { SocketData } from './types'

import type { Node } from '$graph-editor/nodes';
import type { SocketType } from '$graph-editor/plugins/typed-sockets';
import type { SocketData } from 'rete-connection-plugin';
import type { SocketDatastructure } from './Socket.svelte';
import { zip } from 'lodash-es';

/**
 * @param elements list of Element returned by document.elementsFromPoint
 */
export function findSocket(socketsCache: WeakMap<Element, SocketData>, elements: Element[]) {
	for (const element of elements) {
		const found = socketsCache.get(element);

		if (found) {
			return found;
		}
	}
}