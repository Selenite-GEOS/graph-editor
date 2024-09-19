/**
 * A graph editor for visual programming.
 *
 * This module contains the main editor class and related types.
 * The most important classes are the NodeEditor and the NodeFactory.
 * Both are used to create and manage nodes in the graph editor. However,
 * the NodeFactory is designed as a higher level abstraction that allows
 * more advanced features.
 * @module
 */

export * from './NodeEditor.svelte';
export * from './types';
export * from './NodeFactory.svelte';
export * as Variables from './variables';
export * from './variables';
