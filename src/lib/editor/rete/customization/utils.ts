import type { InputControlTypes } from '../control/Control';
import type { SocketType } from '../plugin/typed-sockets';
import type { Socket } from '../socket/Socket';
import { $socketcolor } from './vars';

export const colorMap: { [key in SocketType]?: string } = {
	string: '#d88cbb',
	path: '#8B78E6',
	integer: false ? 'hsl(151.07deg 48.7% 35.1%)' : 'hsl(151.07deg 48.7% 45.1%)',
	pythonObject: '#616796',
	pythonProperty: '#949cd3',
	number: '#d8b38c',
	boolean: '#d88c8c',
	solver: '#bc8cd8',
	output: '#d88c8c',
	fieldSpecification: '#8cd8b3',
	constitutive: '#8c8dd8',
	elementRegion: '#8cd8d8',
	numericalMethod: '#d8b78c',
	geometry: '#d8d08c',
	mesh: '#ad8c71',
	vector: true
		? //  'hsl(58 87% 44% / 1)'
			'hsl(58 79% 44% / 1)'
		: '#efec78',
	groupNameRef: '#5165b2'
};

export function assignColor(s: Socket): string {
	// if (s.required)
	// 	return '#b38a8a';
	if (s.type.startsWith('xml')) {
		// return random color generated from the name and make sure saturation doesn't go over 50%
		// Convert the string seed into a numerical value
		const seed = s.type;
		let seedValue = 0;
		for (let i = 0; i < seed.length; i++) {
			seedValue += seed.charCodeAt(i);
		}

		// Use the seed to generate hue and saturation values
		const baseHue = seedValue % 360;
		const baseSaturation = 40; // Adjust this value as needed for desired saturation

		// Generate a random variation in hue and saturation
		const hueVariation = Math.random() * 30 - 15;
		const saturationVariation = Math.random() * 20 - 10;

		// Calculate final hue and saturation values
		const finalHue = (baseHue + hueVariation + 360) % 360;
		const finalSaturation = Math.max(0, Math.min(100, baseSaturation + saturationVariation));

		// Convert hue and saturation to HSL color string
		const color = `hsl(${finalHue}, ${finalSaturation}%, 60%)`;

		return color;
	}

	return colorMap[s.type] || $socketcolor;
}

export function assignControl(
	socketType: SocketType,
	default_?: InputControlTypes
): InputControlTypes | undefined {
	const controlMap: { [key in SocketType]?: InputControlTypes } = {
		path: 'remote-file',
		string: 'text',
		integer: 'integer',
		number: 'number',
		boolean: 'checkbox',
		vector: 'vector',
		any: 'text',
		groupNameRef: 'group-name-ref'
	};

	return socketType in controlMap ? controlMap[socketType] : default_;
}
