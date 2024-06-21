// import { SocketData } from './types'

import type { SocketData } from "rete-connection-plugin";

/**
 * @param elements list of Element returned by document.elementsFromPoint
 */
export function findSocket(
  socketsCache: WeakMap<Element, SocketData>,
  elements: Element[],
) {
  for (const element of elements) {
    const found = socketsCache.get(element);

    if (found) {
      return found;
    }
  }
}
