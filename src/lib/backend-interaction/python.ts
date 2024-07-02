export class PythonObject {
	constructor(
		public readonly id: number,
		public readonly type: string
	) {}
}
export class PythonProperty {
	constructor(
		public readonly object: PythonObject,
		public readonly name: string
	) {}
}
