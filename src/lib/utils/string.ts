export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function capitalizeWords(str: string): string {
	return str.split(' ').map(capitalize).join(' ');
}

export function isAlphaNumChar(str: string) {
	return /^[a-z0-9]$/i.test(str);
}

const identity = (str: string) => str;
export const words = capitalizeWords;

// split on capital letters that are followed by non capital letters or
// preceded by non capital letters
// and join with spaces
export function titlelize(str: string): string {
	return str
		.split(/(?=(?<=[^A-Z])[A-Z])/)

		.map(capitalize)
		.join(' ');
}

// returns the first two capital letters of a string or the first two letters if there is not enough capital letters
export function initials(str: string): string {
	str = capitalizeWords(str);
	const capitalLetters = str.match(/^([A-Z])(?:\S*?\s+|\S*?)([A-Z])/);
	if (capitalLetters == null) {
		return str.slice(0, 2);
	}

	return capitalLetters[1] + capitalLetters[2];
}

// export function titlelize(str: string): string {
// 	return str
// 		.split(/(?=[A-Z])/)
// 		.map(capitalize)
// 		.join(' ');
// }

// remove spaces and capitalize all but first letter
export function camlelcaseize(str: string): string {
	const capitalized = str.split(' ').map(capitalize).join('');
	return capitalized.charAt(0).toLowerCase() + capitalized.slice(1);
}

export function getVarsFromFormatString(formatString: string): string[] {
	// return all matches of the regex
	return Array.from(formatString.matchAll(/{(\w+).*?}/g)).map((match) => match[1]);
}
