import { ErrorWNotif } from '$lib/global/todo.svelte';
import { curveBasis, curveStep, type CurveFactory, curveLinear, curveMonotoneX } from 'd3-shape';

export const connectionPathTypes = ['curve', 'monotone', 'linear', 'step'] as const;

export type ConnectionPathType = (typeof connectionPathTypes)[number];
export const defaultConnectionPath = 'curve';
export function assignConnectionPath(type: ConnectionPathType): CurveFactory {
	if (!connectionPathTypes.includes(type))
		throw new ErrorWNotif(`Unknown connection path type: ${type}`);

	const map: Record<ConnectionPathType, CurveFactory> = {
		curve: curveBasis,
		step: curveStep,
		linear: curveLinear,
		monotone: curveMonotoneX
	};
	return map[type];
}
