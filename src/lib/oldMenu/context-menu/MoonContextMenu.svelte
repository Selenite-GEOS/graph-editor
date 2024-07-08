<script lang="ts">
	import {
		moonMenuPositionStore,
		moonMenuVisibleStore,
		moonMenuHideDelayStore,
		moonMenuDropConnectionStore,
		moonMenuConnDropEvent,
		moonMenuItemsStore,
		newMoonItemsStore,
		type MoonMenuItem,
		moonMenuFactoryStore,
		moonMenuSearchBarStore,
		moonMenuOnCloseStore
	} from './moonContextMenu';

	import intersection from 'lodash.intersection';
	import { translateNodeFromGlobal } from '$utils/html';
	import { XmlNode } from '$graph-editor/node/XML/XmlNode';
	import { GetNameNode } from '$graph-editor/node/XML/GetNameNode';
	import { MakeArrayNode } from '$graph-editor/node/data/MakeArrayNode';
	import { StringNode } from '$graph-editor/node/data/StringNode';
	import { focusTrap } from '@skeletonlabs/skeleton';
	import { isAlphaNumChar } from '$utils/string';
	import Menu from '../Menu.svelte';
	import { isNodeMenuItem, type IBaseMenuItem } from '../types';
	import { setContext } from '$lib/global';

	// setup width and height
	let width = 0;
	let height = 0;
	$: {
		if (moonMenuElement) {
			const rect = moonMenuElement.getBoundingClientRect();
			width = rect.width;
			height = rect.height;
		}
	}

	$: menuSpawnPaddingY = $moonMenuSearchBarStore ? 58 : 15;
	const menuSpawnPaddingX = 15;

	$: flipMenuH = false && $moonMenuConnDropEvent?.socketData.side === 'input';
	$: flipMenuV =
		$moonMenuConnDropEvent && $moonMenuConnDropEvent.pos.y + height > window.innerHeight;
	// $: console.log(flipMenuH, flipMenuV);
	$: x = $moonMenuPositionStore.x + (flipMenuH ? menuSpawnPaddingX : -menuSpawnPaddingX);
	$: y = $moonMenuPositionStore.y + (flipMenuV ? menuSpawnPaddingY + 5 : -menuSpawnPaddingY);

	let moonMenuElement: HTMLDivElement | undefined;

	// $moonMenuHideDelayStore = 10000;

	function hideMenu() {
		search = '';
		$moonMenuVisibleStore = false;
		$moonMenuDropConnectionStore();
		$moonMenuConnDropEvent = null;
		$moonMenuOnCloseStore();
	}

	// Setup autohide
	let isMouseOver = false;
	let hideTimeout: NodeJS.Timeout | undefined;
	$: {
		if (!isMouseOver) {
			hideTimeout = setTimeout(() => {
				hideMenu();
			}, $moonMenuHideDelayStore);
		} else {
			if (hideTimeout) {
				clearTimeout(hideTimeout);
			}
		}
	}

	// Spawn node on item click
	async function onItemClick(item: MoonMenuItem) {
		const factory = $moonMenuFactoryStore;
		if (!factory) throw new Error('No factory found');
		const area = factory.getArea();
		if (!area) throw new Error('No area found');
		const node = item.action(factory);
		await factory.getEditor().addNode(node);

		translateNodeFromGlobal({
			center: !!$moonMenuConnDropEvent && $moonMenuConnDropEvent.socketData.side === 'input',
			globalPos: $moonMenuConnDropEvent ? $moonMenuConnDropEvent.pos : $moonMenuPositionStore,
			factory,
			node
		});

		// if (!(node instanceof XmlNode) && !(node instanceof GetNameNode) && !(node instanceof MakeArrayNode) && !(node instanceof StringNode)) {
		// 	console.log(`Autoconnection non supporté vers ${node.label}`);
		// 	hideMenu();
		// 	return;
		// }
		if (!$moonMenuConnDropEvent) {
			hideMenu();
			return;
		}
		const socketData = $moonMenuConnDropEvent.socketData;
		const editor = factory.getEditor();
		console.log('socketDataSide', socketData.side);
		if (socketData.side === 'output') {
			const sourceNode = editor.getNode(socketData.nodeId);
			let target =
				node instanceof MakeArrayNode ? 'data-0' : node instanceof GetNameNode ? 'xml' : 'children';
			const newNodeInputs = Object.keys(node.inputs);

			if (newNodeInputs.length == 1) {
				target = newNodeInputs[0];
			}
			await editor.addNewConnection(sourceNode, socketData.key, node, target);
		} else {
			const targetNode = editor.getNode(socketData.nodeId);

			let origin =
				node instanceof MakeArrayNode
					? 'array'
					: node instanceof GetNameNode
						? 'name'
						: node instanceof XmlNode
							? 'value'
							: 'data';

			const newNodeOutputs = Object.keys(node.outputs);

			if (newNodeOutputs.length == 1) {
				origin = newNodeOutputs[0];
			}

			await editor.addNewConnection(node, origin, targetNode, socketData.key);
		}

		// nodeView.translate()
		// area.translate
		$moonMenuConnDropEvent = null;
		hideMenu();
	}

	setContext('moonMenuOnItemClick', onItemClick);

	let filteredItems: MoonMenuItem[] = [];
	let filteredNewMoonItems: IBaseMenuItem[] = [];

	$: if ($moonMenuConnDropEvent) {
		const socketData = $moonMenuConnDropEvent.socketData;
		const socket = $moonMenuConnDropEvent.socketData.payload;

		const baseType = socket.type.split(':')[0];
		console.log('base type', baseType, socket.type, socketData);
		const types = socket.type.split(':')[1]?.split('|') || [baseType];
		if (socket.isArray) {
			types.push('array');
		}
		if (!baseType) {
			hideMenu();
		} else {
			console.log('Filtering items, socketData', socketData);
			filteredItems = $moonMenuItemsStore.filter((item) => {
				// if (item.label === 'GetName') {
				// 	console.log(item.inChildrenTypes, types);
				// }
				if (
					socketData.side === 'output' ? item.inChildrenTypes.includes('*') : item.outType === '*'
				) {
					return true;
				}
				const res = intersection(
					socketData.side === 'output' ? item.inChildrenTypes : [item.outType],
					types
				);
				// console.log(item.inChildrenTypes, types)

				// console.log("intersection", res)
				return res.length > 0;
			});

			filteredNewMoonItems = $newMoonItemsStore.filter((item) => {
				if (!isNodeMenuItem(item)) return false;
				// if (item.label === 'GetName') {
				// 	console.log(item.inChildrenTypes, types);
				// }
				if (
					socketData.side === 'output'
						? item.getInTypes().includes('*')
						: item.getOutTypes().at(0) === '*'
				) {
					return socket.isArray === false;
				}

				const res = intersection(
					socketData.side === 'output' ? item.getInTypes() : item.getOutTypes(),
					types
				);
				// console.log(item.inChildrenTypes, types)

				// console.log("intersection", res)
				return res.length > 0;
			});

			if (filteredItems.length === 0 && filteredNewMoonItems.length === 0) {
				hideMenu();
			}
		}
	}
	let search = '';
	$: filteredItemsAfterSearch = filteredItems
		.filter((item) => {
			if (search === '') return true;
			return item.label.toLowerCase().includes(search.toLowerCase());
		})
		.map((item) => {
			return {
				item,
				score: item.label.toLowerCase().search(search.toLowerCase())
			};
		})
		.toSorted((x1, x2) => x1.score - x2.score)
		.map((item) => item.item);

	let searchInput: HTMLInputElement | undefined;
	let useFocusTrap = false;
	const listener = (event: KeyboardEvent) => {
		// event.stopImmediatePropagation();
		if (event.key === 'Escape') {
			hideMenu();
			return;
		}
		if (
			isAlphaNumChar(event.key) ||
			event.key === 'Backspace' ||
			event.key === ' ' ||
			event.key === 'Delete'
		) {
			searchInput?.focus();
			itemListDiv?.scrollTo({ top: 0 });
			useFocusTrap = true;
		}
	};
	$: if (!$moonMenuVisibleStore) {
		document.removeEventListener('keydown', listener);
		useFocusTrap = false;
	}
	$: if ($moonMenuVisibleStore) {
		document.addEventListener('keydown', listener);
	}

	let itemListDiv: HTMLDivElement | undefined;
	const useNewMoon = true;
</script>

{#if $moonMenuVisibleStore || false}
	<div
		use:focusTrap={useFocusTrap}
		bind:this={moonMenuElement}
		role="menu"
		tabindex="0"
		class="absolute text-token bg-surface-50 dark:bg-surface-800 z-50 h-2/5 overflow-hidden text-sm w-80 pb-0.5"
		style="position: absolute; border-radius: 5px; left: {x}px; top: {y}px; transform: translate({flipMenuH
			? -width
			: 0}px, {flipMenuV ? -height : 0}px);"
		on:mouseenter={() => (isMouseOver = true)}
		on:mouseleave={() => (isMouseOver = false)}
	>
		{#if useNewMoon}
			<Menu
				searchBar={$moonMenuSearchBarStore}
				menuItems={$moonMenuConnDropEvent ? filteredNewMoonItems : $newMoonItemsStore}
				type="tree"
			/>
		{:else}
			<div class="searchbar">
				<input
					bind:this={searchInput}
					type="text"
					class="w-full p-2 input"
					style="border-radius: 5px; !important"
					placeholder="Search"
					bind:value={search}
				/>
			</div>
			<div class="list overflow-y-auto h-full" bind:this={itemListDiv}>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				{#each filteredItemsAfterSearch as item (item.label)}
					<div
						role="menuitem"
						tabindex="0"
						class="px-4 py-2 cursor-pointer hover:bg-soft-primary rounded-none"
						on:click={() => onItemClick(item)}
						on:keypress={(event) => {
							if (event.key === 'Enter') {
								onItemClick(item);
							}
						}}
					>
						{item.label}
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
