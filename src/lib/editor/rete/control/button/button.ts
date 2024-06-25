// <script lang="ts">
//   export let label: string
//   export let onClick: () => void = () => {};
// </script>

// <button type="button" on:click={() => onClick()}>
//   {label}
// </button>

// import * as React from "react";
// import { Button } from "@mantine/core"; -->
import { ClassicPreset } from 'rete';

export class ButtonControl extends ClassicPreset.Control {
	constructor(public label: string, public onClick: () => void) {
		super();
	}
}

// export function CustomButton(props: { data: ButtonControl }) {
//   const [customizationAdded, setCustomizationAdded] =
//     React.useState<boolean>(false);

//   if (!customizationAdded) {
//     setCustomizationAdded(true);
//   }

//   return (
//     <Button
//       onPointerDown={(e) => e.stopPropagation()}
//       onDoubleClick={(e) => e.stopPropagation()}
//       onClick={props.data.onClick}
//       styles={{ root: { backgroundColor: "#228be6 !important" } }}
//     >
//       {props.data.label}
//     </Button>
//   );
// }
