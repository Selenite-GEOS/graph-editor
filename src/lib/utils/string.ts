export function getVarsFromFormatString(formatString: string): string[] {
	// return all matches of the regex

	return [
		...new Set(Array.from(formatString.matchAll(/{([^}]+)\s*?}/g)).map((match) => match[1]))
	];
}
