<script lang="ts">
	import {
		AppShell,
		RadioGroup,
		RadioItem,
		localStorageStore,
		modeCurrent
	} from '@skeletonlabs/skeleton';
	import { EditorButton, EditorButtons } from './buttons';
	import { VariablesListOverlay } from './overlay';
	import { _, getContext } from '$lib/global/index.svelte';
	import {
		connectionPathTypes,
		assignConnectionPath,
		type ConnectionPathType,
		defaultConnectionPath
	} from '$lib/editor';
	import { faArrowAltCircleLeft, faArrowAltCircleRight } from '@fortawesome/free-regular-svg-icons';
	import {
		faArrowCircleLeft,
		faRotateLeft,
		faRotateRight
	} from '@fortawesome/free-solid-svg-icons';
	import { line } from 'd3-shape';
	import type { ComponentProps } from 'svelte';
	import type Fa from 'svelte-fa';
	import Color from 'color';
	import { readable } from 'svelte/store';
	const { activeEditor } = getContext('editor');
	let connectionPathType = localStorageStore<ConnectionPathType>(
		'connectionPathType',
		defaultConnectionPath
	);
	$: factory = $activeEditor?.factory;
	let canRedo = readable(false);
	let canUndo = readable(false);
	$: if (factory?.history) {
		canRedo = factory.history.canRedo;
		canUndo = factory.history.canUndo;
	}

	$: if (!connectionPathTypes.includes($connectionPathType)) {
		$connectionPathType = defaultConnectionPath;
	}
	$: factoryConnPathStore = $activeEditor?.factory?.connectionPathType;

	$: if (factoryConnPathStore) {
		$factoryConnPathStore = $connectionPathType;
	}

	let size = 12;
	function getPath(type: ConnectionPathType) {
		return line()
			.x((d) => size * d[0])
			.y((d) => size * d[1])
			.curve(assignConnectionPath(type))([
			[0, 0],
			[0.33, 0],
			[0.66, 1],
			[1, 1]
		]);
	}
	let alwaysVisible = false;
	$: colorBrightness = $modeCurrent ? '700' : '700';
	let iconProps: ComponentProps<Fa>;
	$: iconProps = {
		icon: faRotateLeft,
		size: 'sm',
		//  color: Color("black").alpha(0.5).string()

		color: `rgb(var(--color-${$canUndo ? 'warning' : 'surface'}-${colorBrightness}))`
	};
	$: console.log('factoryStore', $factoryConnPathStore);
	$: iconPropsRedo = {
		...iconProps,
		icon: faRotateRight,
		color: `rgb(var(--color-${$canRedo ? 'success' : 'surface'}-${colorBrightness}))`
	};
	$: stroke = $modeCurrent ? 'black' : Color('white').value(80).string();
	$: variant = 'p-1.5 rounded-token';
</script>

<AppShell class="absolute z-10 pointer-events-none" slotPageHeader="p-2 space-y-2">
	<svelte:fragment slot="pageHeader">
		<EditorButtons />
		<!-- {#if connectionPathType} -->
		<!-- Second toolbar -->
		<div class="w-full flex">
			<div class="flex gap-2 ms-2">
				<EditorButton
					exec={({ factory }) => {
						factory.history?.undo();
					}}
					button=""
					iconSize="sm"
					{variant}
					{iconProps}
					icon={faRotateLeft}
					tooltip={$_('editor.button.undo.tooltip', { values: { shortcut: 'Ctrl+Z' } })}
					shortcutTooltip="Ctrl+Z"
				/>
				<EditorButton
					button=""
					exec={({ factory }) => {
						factory.history?.redo();
					}}
					icon={faRotateRight}
					{variant}
					iconProps={iconPropsRedo}
					tooltip={$_('editor.button.redo.tooltip', {
						values: { shortcut: 'Ctrl+Shift+Z, Ctrl+Y' }
					})}
					shortcutTooltip="Ctrl+Shift+Z, Ctrl+Y"
				/>
			</div>
			<div class="fill-token px-2 absolute right-0 flex" style="height: {size}; width: {size};">
				<RadioGroup
					background="me-1.5 group relative variant-ghost-surface pointer-events-auto overflow-hidden d-opacity-50 transition-all  {alwaysVisible
						? 'w-full'
						: 'w-7 hover:w-28'}  hover:opacity-100"
					active="opacity-100"
					border="outline-2"
					fill="red"
				>
					{#if !alwaysVisible}
						<div
							class="transition-all absolute right-0 py-1 group-hover:opacity-0"
							style="padding-right: 0.5rem;"
						>
							<svg width={size} height={size}>
								<path d={getPath($connectionPathType)} {stroke} fill="none" />
							</svg>
						</div>
					{/if}
					{#each connectionPathTypes as type}
						<RadioItem
							name="connectionPathType"
							padding="p-1"
							bind:group={$connectionPathType}
							value={type}
						>
							<svg
								class={alwaysVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
								class:group-hover:opacity-50={$connectionPathType !== type}
								width={size}
								height={size}
							>
								<path d={getPath(type)} {stroke} fill="none" />
							</svg>
						</RadioItem>
					{/each}
				</RadioGroup>
			</div>
		</div>
		<!-- {/if} -->
	</svelte:fragment>
	<svelte:fragment slot="pageFooter">
		<VariablesListOverlay />
	</svelte:fragment>
</AppShell>
