import { BaseComponent } from '$graph-editor/components';
import { GraphNode } from '$graph-editor/nodes';
import type { NodeFactory } from './NodeFactory.svelte';

export class NodeSearch extends BaseComponent<NodeFactory> {
	#query = $state('');
	get query() {
		return this.#query;
	}
	set query(q: string) {
		this.#query = q;
	}
	trimmedQuery = $derived(this.query.trim());
	matchingNodes = $derived.by(() => {
		if (this.trimmedQuery === '') return [];
		return this.owner.nodes.filter((n) =>
			[
				n.label,
				n.name,
				...Object.values(n.inputs).map((i) => i?.label ?? ''),
				...Object.values(n.outputs).map((o) => o?.label ?? '')
			]
				.join(' ')
				.toLowerCase()
				.includes(this.query.toLowerCase())
		);
	});
	#focused = $state<GraphNode>();

	get focused() {
		return this.#focused;
	}

	set focused(n: GraphNode | undefined) {
		this.#focused = n;
		if (n) this.owner.focusNode(n);
	}

	next() {
		const nodes = this.matchingNodes;
		const index = this.focused === undefined ? 0 : nodes.indexOf(this.focused) + 1;
		this.focused = nodes[index % nodes.length];
	}

	previous() {
		const nodes = this.matchingNodes;
		const index = this.focused === undefined ? 0 : nodes.indexOf(this.focused) - 1;
		this.focused = nodes[(index + nodes.length) % nodes.length];
	}
}
