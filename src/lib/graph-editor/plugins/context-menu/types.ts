/**
 * A menu item contains the necessary information to render a menu item in the context menu.
 */
export type MenuItem = {
	id: string;
	/** The label of the menu item */
	label: string;
	/** The description of the menu item */
	description: string;
	/** The search tags of the menu item */
	tags: string[];
	/** The path of the menu item */
	path: string[];
	/** Action to execute on selection */
	action: () => void;
	// /** The type of the menu item */
	// type: unknown
};
// & (
// 	| {
// 			type: 'action';
//             action: () => void;
// 	  }
// 	| {
// 			type: 'node';
//             // addNode: () => Node;
// 	  }
// );

// const t: MenuItem = {
//     type: "action"
// }
