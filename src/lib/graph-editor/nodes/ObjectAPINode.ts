import { APINode, type APINodeParams } from './APINode';

export interface ObjectAPINodeParams extends APINodeParams {
	objectKey: string;
	objectLabel: string;
}

export class ObjectAPINode extends APINode {
	objectKey: string;
	static __isAbstract: boolean;

	constructor(params: ObjectAPINodeParams) {
		const { objectKey = 'object', objectLabel = 'Object' } = params;

		super(params);
		this.objectKey = objectKey;
		this.oldAddInData({
			name: objectKey,
			displayName: objectLabel,
			socketLabel: objectLabel,
			type: 'pythonObject'
		});
		this.addOutData({
			name: objectKey,
			socketLabel: objectLabel,
			displayName: objectLabel,
			type: 'pythonObject'
		});

		this.pythonComponent.setDataCodeGetter(objectKey, () => `$(${objectKey})`);
	}

	// override data(
	// 	inputs?: Record<string, unknown> | undefined
	// ): Record<string, unknown> | Promise<Record<string, unknown>> {
	// 	const res = {};
	// 	res[this.objectKey] = undefined;
	// 	if (!inputs || inputs[this.objectKey] === undefined) return res;

	// 	res[this.objectKey] = (inputs[this.objectKey] as PythonObject[])[0];

	// 	return res;
	// }
}

// add property __abstract to ObjectAPINode
ObjectAPINode.__isAbstract = true;
