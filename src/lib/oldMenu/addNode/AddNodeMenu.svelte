<script lang="ts">
	import Menu from '../Menu.svelte';
	import { createActionMenuItem, createMenuItem, type IMenuItem } from '../types';

	const menuItems: IMenuItem[] = [
		createMenuItem({
			label: 'Test node',
			description: 'Test node description',
			menuPath: ['menu', 'path']
		}),
		createActionMenuItem({
			label: 'Test action',
			description: 'Test action description',
			menuPath: ['menu', 'path'],
			executeAction: () => undefined
		})
	];
</script>

<Menu {menuItems} />
