import type { SocketType } from "./plugins/typed-sockets";
import type { SocketValueType } from "./socket";

export type Position = {
	x: number;
	y: number;
};

export namespace Vector {
	export type Vector = {
			x: number;
			y: number;
			z: number;
	}
	export function zero(): Vector {
		return {
			x: 0,
			y: 0,
			z: 0
		};
	}
	export function isVector(o: unknown): o is Vector {
		return typeof o === 'object' && o !== null && 'x' in o && 'y' in o && 'z' in o;
	}

	export function fromNumber(x: number) {
		return {x, y: x, z: x};
	}
}

type Converter<T> = (v: unknown) => T;



function convertNumber(t: unknown, parser: (s: string) =>number): number {
	if (typeof t === 'boolean') return t ? 1 : 0;
	if (Vector.isVector(t)) return parser(String(t.x));
	const attempt = parser(t as string);
	return isNaN(attempt) ? 0 : attempt;
}




export const valueConverters: { [K in SocketType]?: Converter<SocketValueType<K>> } = {
	any: (t) => t,
	boolean: (t) => !!t,
	groupNameRef: (t) => String(t),
	integer: (t) => convertNumber(t, parseInt),
	number: (t) => convertNumber(t, parseFloat),
	string: (t) => (typeof t === 'string' ? t : JSON.stringify(t)),
	vector: (t) => {
		if (Vector.isVector(t)) return {x: t.x, y: t.y, z: t.z};
		if (typeof t === 'string') {
			try {
				const parsed = JSON.parse(t)
				if (Vector.isVector(parsed)) return {x: parsed.x, y: parsed.y, z: parsed.z};
			} catch {}
		}
		if (typeof t === 'number') return Vector.fromNumber(t);
		if (typeof t === 'boolean') return Vector.fromNumber(t ? 1 : 0);
		return Vector.zero();
	}
};