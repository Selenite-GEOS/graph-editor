import { BaseComponent, type ComponentParams } from '$graph-editor/components';
import type { NodeFactory } from './NodeFactory.svelte';
import { Connection, Node } from '$graph-editor/nodes';
import { SvelteSet } from 'svelte/reactivity';
import wu from 'wu';
import { Comment } from 'rete-comment-plugin';
import { Rect, type Position } from '@selenite/commons';

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
	ranging = $state(false);

	modifierActive = $derived(this.accumulating || this.ranging);
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
					this.ranging = e.shiftKey;
				};
				const onkeyup = (e: KeyboardEvent) => {
					this.accumulating = e.ctrlKey;
					this.ranging = e.shiftKey;
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
					if (ctx.type === 'nodepicked' && this.modifierActive) {
						const node = factory.getNode(ctx.data.id);
						if (node && this.isSelected(node) && !this.isPicked(node)) {
							this.pick(node);
						}
					}
					if (ctx.type === 'nodetranslated') {
						const { id, position, previous } = ctx.data;
						const node = factory.getNode(id);
						if (!node) {
							// console.error("Couldn't find node.");
							return ctx;
						}
						const dx = position.x - previous.x;
						const dy = position.y - previous.y;
						if (this.accumulating && selector.isPicked(node)) {
							selector.translate(dx, dy);
						}
					}
					if (this.accumulating || this.ranging) return ctx;

					if (ctx.type === 'pointerdown' || ctx.type === 'pointerup') {
						if (ctx.data.event.button !== 0) return ctx;
						const target = ctx.data.event.target;
						if (target instanceof Element && !this.owner.area?.container.contains(target)) {
							// console.debug('Not contained');
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
	pickedNode = $derived(this.picked instanceof Node ? this.picked : undefined);
	pickedConnection = $derived(this.picked instanceof Connection ? this.picked : undefined);

	entityElement(entity: SelectorEntity): HTMLElement | undefined {
		const area = this.owner.area;

		if (entity instanceof Node) {
			return area?.nodeViews.get(entity.id)?.element;
		}

		if (entity instanceof Connection) {
			return (
				area?.connectionViews.get(entity.id)?.element.querySelector('.visible-path') ?? undefined
			);
		}

		if (entity instanceof Comment) return entity.element;

		console.error("Can't get element, unknown entity");
		return;
	}

	isSelected(entity: SelectorEntity): boolean {
		return this.entities.has(entity);
	}

	invertSelection() {
		const nodes = new Set(this.owner.nodes);
		const selectedNodes = new Set(this.nodes);
		const toSelect = nodes.difference(selectedNodes);
		this.unselectAll();
		this.selectMultiple(toSelect);
	}

	/**
	 * Selects all entities between two entities.
	 *
	 * Selects only entities with 50% of their bounding box inside
	 * the bouding box formed by the two entities.
	 */
	selectRange(a: SelectorEntity, b: SelectorEntity) {
		const rectA = this.entityElement(a)?.getBoundingClientRect();
		const rectB = this.entityElement(b)?.getBoundingClientRect();

		if (!rectA || !rectB) return;

		const minX = Math.min(rectA.left, rectB.left);
		const minY = Math.min(rectA.top, rectB.top);
		const maxX = Math.max(rectA.right, rectB.right);
		const maxY = Math.max(rectA.bottom, rectB.bottom);

		const boudingRect = new Rect(minX, minY, maxX - minX, maxY - minY);

		for (const e of wu.chain<SelectorEntity>(this.owner.nodes, this.owner.connections)) {
			const rect = this.entityElement(e)?.getBoundingClientRect();
			if (!rect) continue;
			const rectArea = Rect.area(rect);
			if (rectArea === 0) continue;
			const intersection = Rect.intersection(boudingRect, rect);
			const proportion = Rect.area(intersection) / rectArea;
			if (proportion >= 0.5) {
				this.entities.add(e);
			}
		}
	}

	selectMultiple(entities: Iterable<SelectorEntity>) {
		for (const e of entities) {
			this.entities.add(e);
		}
	}

	select(
		entity: SelectorEntity,
		options: { accumulate?: boolean; pick?: boolean; range?: boolean } = {}
	): void {
		if ((options.range === undefined && this.ranging) || options.range) {
			if (this.picked) {
				this.selectRange(this.picked, entity);
			}
		} else if (
			!this.ranging &&
			(options.accumulate === undefined ? !this.accumulating : !options.accumulate)
		) {
			this.unselectAll();
		}
		if (
			(options.accumulate === undefined ? this.accumulating : options.accumulate) &&
			this.isSelected(entity)
		) {
			this.unselect(entity);
			return;
		}
		this.entities.add(entity);
		if (options.pick ?? true) {
			this.pick(entity);
		}
	}
	remove(entity: SelectorEntity): void {
		this.entities.delete(entity);
	}
	unselect(entity: SelectorEntity) {
		this.entities.delete(entity);
		if (this.picked === entity) {
			this.releasePicked();
		}
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
		this.selectMultiple(this.owner.nodes);
		// wu.chain<SelectorEntity>(editor.nodesArray, editor.connectionsArray).forEach((e) => this.entities.add(e));
		// this.comment?.comments.forEach((comment) => {
		// 	this.comment?.select(comment.id);
		// });
	}
}

export type SelectOptions = Parameters<NodeSelection['select']>[1];
