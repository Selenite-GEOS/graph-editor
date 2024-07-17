import type { Node } from '$graph-editor/nodes/Node.svelte';
import type { Socket } from '$graph-editor/socket';
import { BaseComponent } from './BaseComponent';

type R = Record<string, Socket>
export type NodeComponentParams<Inputs extends R, Outputs extends R> = { owner: Node<Inputs, Outputs> };
export class NodeComponent<Inputs extends R, Outputs extends R> extends BaseComponent {
	protected node: Node<Inputs, Outputs>;
	constructor({ owner }: { owner: Node<Inputs, Outputs> }) {
		super({ owner: owner });
		this.node = owner;
	}
}
