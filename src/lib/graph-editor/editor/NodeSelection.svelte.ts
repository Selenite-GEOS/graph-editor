import { BaseComponent, type ComponentParams } from '$graph-editor/components';
import type { NodeFactory } from './NodeFactory.svelte';
import { Connection, Node } from '$graph-editor/nodes';
import { SvelteSet } from 'svelte/reactivity';
import wu from 'wu';
import { Comment } from 'rete-comment-plugin';

const entityTypesMap = {
	node: Node,
	connection: Connection,
	comment: Comment
} as const;
type EntityType = keyof typeof entityTypesMap;
export type SelectorEntity = InstanceType<(typeof entityTypesMap)[EntityType]>;
type EntityWithType<K extends EntityType = EntityType> = {
	type: K;
	entity: InstanceType<(typeof entityTypesMap)[K]>;
};

export class NodeSelection extends BaseComponent<NodeFactory> {
	entities = new SvelteSet<SelectorEntity>();
	accumulating = $state(false);
	typedEntities: EntityWithType[] = $derived(
		wu(this.entities)
			.map((e) => {
				let type: EntityType;
				if (e instanceof Node) {
					type = 'node';
				} else if (e instanceof Connection) {
					type = 'connection';
				} else if (e instanceof Comment) {
					type = 'comment';
				} else {
					throw new Error('Unsupported entity.');
				}
				return { type, entity: e };
			})
			.toArray()
	);

	constructor(params: { owner: NodeFactory }) {
		super(params);
		this.cleanup = $effect.root(() => {
			$effect(() => {
				if (!this.owner.area) return;
				console.debug('Adding selection accumulation.');
				const onkeydown = (e: KeyboardEvent) => {
					this.accumulating = e.ctrlKey;
				};
				const onkeyup = (e: KeyboardEvent) => {
					this.accumulating = e.ctrlKey;
				};
				window.addEventListener('keydown', onkeydown);
				window.addEventListener('keyup', onkeyup);

				return () => {
					console.debug('Removing selection accumulation.');
					window.removeEventListener('keydown', onkeydown);
					window.removeEventListener('keyup', onkeyup);
				};
			});

			$effect(() => {
				if (!this.owner.area) return;
				const factory = this.owner;
				let twitch: number | null = null;
				this.owner.area.addPipe((ctx) => {
					const selector = factory.selector;
					if (ctx.type === 'nodetranslated') {
						const { id, position, previous } = ctx.data;
						const node = factory.getNode(id);
						if (!node) {
							console.error("Couldn't find node.");
							return ctx;
						}
						const dx = position.x - previous.x;
						const dy = position.y - previous.y;
						if (this.accumulating && selector.isPicked(node)) {
							selector.translate(dx, dy);
						}
					}
					if (this.accumulating) return ctx;

					if (
						ctx.type === 'pointerdown' ||
						ctx.type === 'pointermove' ||
						ctx.type === 'pointerup'
					) {
                        if (ctx.data.event.button !== 0) return ctx;
						const target = ctx.data.event.target;
						if (target instanceof Element && !this.owner.area?.container.contains(target)) {
                            console.debug("Not contained")
                            return ctx;
                        }
					}
					if (twitch === null) {
						if (ctx.type === 'pointerdown') twitch = 0;
					} else {
						if (ctx.type === 'pointermove') twitch++;
						else if (ctx.type === 'pointerup') {
							if (ctx.data.event.button !== 0) return ctx;

							if (twitch < 4) {
								factory.unselectAll();
							}
							twitch = null;
						}
					}
					return ctx;
				});
			});
		});
	}

	nodes = $derived(
		wu(this.entities)
			.filter((e) => e instanceof Node)
			.toArray()
	);

	connections = $derived(
		wu(this.entities)
			.filter((e) => e instanceof Connection)
			.toArray()
	);

	picked = $state<SelectorEntity>();
	pickedNode = $derived(this.picked instanceof Node ? Node : undefined);
	pickedConnection = $derived(this.picked instanceof Connection ? Connection : undefined);

	isSelected(entity: SelectorEntity): boolean {
		return this.entities.has(entity);
	}
	select(entity: SelectorEntity, options: { accumulate?: boolean; pick?: boolean } = {}): void {
		console.debug('select');
		if (options.accumulate === undefined ? !this.accumulating : !options.accumulate) {
			this.unselectAll();
		}
		this.entities.add(entity);
		if (options.pick ?? true) {
			this.pick(entity);
		}
	}
	remove(entity: SelectorEntity): void {
		this.entities.delete(entity);
	}
	unselectAll(): void {
		console.debug('Unselect all');
		this.picked = undefined;
		this.entities.clear();
	}
	translate(dx: number, dy: number): void {
		for (const { type, entity } of this.typedEntities) {
			if (entity === this.picked) continue;
			switch (type) {
				case 'node':
					if (!this.owner.area) return;
					const view = this.owner.area.nodeViews.get(entity.id);
					const current = view?.position;

					if (current) {
						view.translate(current.x + dx, current.y + dy);
					}
					break;
			}
		}
	}
	pick(entity: SelectorEntity): void {
		this.entities.add(entity);
		this.picked = entity;
	}
	releasePicked(): void {
		this.picked = undefined;
	}
	isPicked(entity: SelectorEntity | EntityWithType): boolean {
		return entity === this.picked;
	}

	selectAll() {
		const editor = this.owner.editor;
		wu.chain<SelectorEntity>(editor.nodes, editor.connections).forEach((e) => this.entities.add(e));
		// this.comment?.comments.forEach((comment) => {
		// 	this.comment?.select(comment.id);
		// });
	}
}

export type SelectOptions = Parameters<NodeSelection['select']>[1];
