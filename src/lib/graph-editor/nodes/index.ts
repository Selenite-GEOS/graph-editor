/**
 * This file is the entry point for all the nodes in the graph editor.
 *
 * Nodes autoregister themselves.
 * @module
 */
export * as Data from './data';
export {MakeArray} from './data'
export * from './data';
export * as IO from './io';
export * as Control from './control';
export * as XML from './XML';
export * from './XML'
export * as Macro from './MacroNode';
export * from './MacroNode'

// import * as API from './ObjectAPINode';
// import * as API from './APINode';
// export * from './makutu';
export * as Math from './math';
export * from './Node.svelte';

export { Node as GraphNode } from './Node.svelte';
