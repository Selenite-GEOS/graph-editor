/**
 * Daisy UI helpers.
 *
 * @module
 */

export const daisyUiSemClasses = [
	'primary',
	'secondary',
	'accent',
	'base-100',
	'base-200',
	'base-300',
	'neutral',
	'success',
	'info',
	'error',
	'warning'
] as const;


export type DaisyUISemClass = (typeof daisyUiSemClasses)[number];
/**
 * Combines daisy ui semantic background and text classes into one.
 *
 * Example: variant("primary") -> "bg-primary text-primary-content"
 * @param semClass - daisy ui semantic class
 * @returns variant combining background and text
 */
export function variant<SemClass extends DaisyUISemClass>(semClass: SemClass): SemClass extends "base-100" | "base-200" | "base-300" ? `bg-${SemClass} text-base-content` : `bg-${SemClass} text-${SemClass}-content` {
	const textClass = semClass.includes('base') ? 'base' : semClass;
	return `bg-${semClass} text-${textClass}-content` as ReturnType<typeof variant>;
}




// Tells tailwind to include all variants of a class
const backgrounds = [
    "bg-primary",
    "bg-secondary",
    "bg-accent",
    "bg-neutral",
    "bg-success",
	"bg-accent",
    "bg-info",
    "bg-error",
    "bg-warning",
    "bg-base-100",
    "bg-base-200",
    "bg-base-300",
] as const;

const foregrounds = [
	'text-primary-content',
	'text-secondary-content',
	'text-accent-content',
	'text-neutral-content',
	'text-success-content',
	'text-info-content',
	'text-error-content',
	'text-warning-content',
	'text-accent-content',
	'text-base-content',
	'text-base-content',
	'text-base-content'
] as const;
