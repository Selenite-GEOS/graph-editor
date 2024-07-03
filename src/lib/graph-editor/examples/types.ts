import type { NodeFactory } from '$graph-editor/editor';
import type { Node } from '$graph-editor/nodes';

export interface EditorExample {
	(factory: NodeFactory): Promise<Node[]>;
}
