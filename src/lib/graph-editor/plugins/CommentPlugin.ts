import type { NodeFactory } from '$graph-editor/editor';
import type { Scope } from 'rete';
import type { BaseArea } from 'rete-area-plugin';
export { CommentExtensions } from 'rete-comment-plugin';
import {
	CommentPlugin as BaseCommentPlugin,
	FrameComment,
	type ExpectedSchemes,
	type Props,
	Comment
} from 'rete-comment-plugin';
import { get } from 'svelte/store';
import { _ } from '$lib/global';
import wu from 'wu';

export class CommentPlugin<
	Schemes extends ExpectedSchemes,
	K = BaseArea<Schemes>
> extends BaseCommentPlugin<Schemes, K> {
	lastPointerEvent?: PointerEvent;
	protected readonly factory: NodeFactory;

	constructor(props: { factory: NodeFactory } & Props) {
		super(props);
		this.factory = props.factory;
		_.subscribe((f) => {
			wu(this.comments.values()).asyncEach((comment) => {
				if (comment.text.trim() === '') {
					comment.text = '';
					comment.nested.textContent = f('graph-editor.comment.default-text');
				}
			});
		});
	}
	override setParent(scope: Scope<K | BaseArea<Schemes>, []>): void {
		super.setParent(scope);
		this.area.area.content.holder.addEventListener(
			'pointerdown',
			(e: PointerEvent) => (this.lastPointerEvent = e)
		);
	}

	private makeComment(params: { text: string; id?: string }): FrameComment {
		const comment = new FrameComment(params.text, this.area, this.editor, {
			contextMenu: ({ id }) => {
				const comment = this.comments.get(id);
				if (!comment) {
					console.warn('ContextMenu: Comment not found');
					return;
				}
				// spawnMoonMenu({
				// 	searchbar: false,
				// 	pos: { x: this.lastPointerEvent?.clientX ?? 0, y: this.lastPointerEvent?.clientY ?? 0 },
				// 	items: [
				// 		createActionMenuItem({
				// 			label: get(_)('menu.comment.edit.label'),

				// 			description: get(_)('menu.comment.edit.description'),
				// 			executeAction: () => {
				// 				this.openEditPrompt(comment);
				// 			}
				// 		}),
				// 		createActionMenuItem({
				// 			label: get(_)('menu.comment.delete.label'),
				// 			description: get(_)('menu.comment.delete.description'),
				// 			executeAction: () => {
				// 				const comment = this.comments.get(id);
				// 				if (!comment) {
				// 					console.warn('Comment to delete not found');
				// 					return;
				// 				}
				// 				this.factory.history?.add({
				// 					redo: () => this.delete(id),
				// 					undo: () => this.addFrame(comment.text, comment?.links, { id })
				// 				});
				// 				this.delete(id);
				// 			}
				// 		})
				// 	]
				// });
			},
			pick: async (data) => {
				this.area.area.content.reorder(comment.element, this.area.area.content.holder.firstChild);
				await this.emit({ type: 'commentselected', data });
				// comment.nested.classList.add('!rounded-container-token truncate')
			},
			translate: async ({ id }, dx, dy, sources) => {
				await this.emit({ type: 'commenttranslated', data: { id, dx, dy, sources } });
				const comment = this.comments.get(id) as Comment;
				if (comment.text === '') {
					comment.nested.textContent = get(_)('graph-editor.comment.default-text');
				}
				comment.nested.title = comment.text;
				// comment.nested.classList.add('!rounded-container-token truncate')
			}
		});
		comment.id = params.id ?? comment.id;
		console.debug('makeComment: ', comment.id, params.id, comment);
		return comment;
	}

	override addFrame(
		text?: string,
		links?: string[] | undefined,
		params: { id?: string; editPrompt?: boolean } = {}
	): void {
		const { editPrompt = false } = params;
		console.debug('addFrame: ', text, links, params?.id);
		const comment = this.makeComment({ text: text ?? '', id: params?.id });
		const commentId = comment.id;
		this.factory.history?.add({
			redo: () => {
				const comment = this.makeComment({ text: text ?? '', id: commentId });
				comment.linkTo(links);
				this.add(comment);
				this.area.area.content.reorder(comment.element, this.area.area.content.holder.firstChild);
			},
			undo: () => {
				this.delete([...this.comments.keys()].pop() as string);
			}
		});

		comment.linkTo(links);
		this.add(comment);
		this.area.area.content.reorder(comment.element, this.area.area.content.holder.firstChild);
		if (editPrompt) this.openEditPrompt(comment);
	}

	openEditPrompt(comment: Comment) {
		console.log('editComment: ', this.factory.modalStore);
		this.factory.modalStore?.trigger({
			type: 'prompt',
			title:
				comment.text.trim() === ''
					? get(_)('prompt.comment.edit.title-when-empty')
					: get(_)('prompt.comment.edit.title'),
			valueAttr: {
				placeholder: get(_)('prompt.comment.edit.placeholder')
				// 'onfocus': 'this.select()'
			},
			buttonTextCancel: get(_)('button.cancel'),
			buttonTextSubmit: get(_)('button.confirm'),
			value: comment.text,
			response: (r) => {
				if (r === false) return;
				if (typeof r !== 'string') {
					console.warn('Comment edit: Invalid response', r);
				}
				r = r.trim();
				const oldText = comment.text;
				const redo = () => {
					const comm = this.comments.get(comment.id);
					if (!comm) {
						throw new Error('Comment not found');
					}
					comm.text = r;
					comm.nested.textContent = r !== '' ? r : get(_)('graph-editor.comment.default-text');
					comment.nested.title = comm.text;
				};

				this.factory.history?.add({
					redo,
					undo: () => {
						const comm = this.comments.get(comment.id);
						if (!comm) throw new Error('Comment not found');
						comm.text = oldText;
						comm.nested.textContent =
							oldText !== '' ? oldText : get(_)('graph-editor.comment.default-text');
					}
				});
				redo();
			}
		});
	}

	add(comment: Comment): void {
		super.add(comment);
		if (comment.text.trim() === '') {
			comment.nested.textContent = get(_)('graph-editor.comment.default-text');
			comment.text = '';
		}
		// comment.element.classList.add('pointer-events-none');
		comment.nested.classList.add('!rounded-container-token', 'truncate', 'select-none');
		comment.nested.title = comment.text;
		comment.element.addEventListener('dblclick', () => {
			console.log('hey');
			this.openEditPrompt(comment);
		});
	}
}
