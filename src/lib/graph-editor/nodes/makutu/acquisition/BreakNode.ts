import { PythonObject, PythonProperty } from '$lib/backend-interaction/python';
import { Node } from '../../Node';
import type { NodeFactory } from '../$graph-editor/editor';

// TODO : autogenerate outputs from the python object
export class BreakNode extends Node {
	state = { ...this.state, type: 'any' };

	constructor({ factory }: { factory: NodeFactory }) {
		super({ label: 'Break Shot', factory, height: 225 });

		this.oldAddInData({
			name: 'object',
			displayName: 'Shot',
			socketLabel: 'Shot',
			type: 'pythonObject'
		});

		this.addOutData({
			name: 'xml',
			displayName: 'XML',
			type: 'pythonProperty'
		});

		this.addOutData({
			name: 'sourceCoords',
			displayName: 'Source Coords',
			type: 'pythonProperty'
		});
		this.addOutData({
			name: 'receiverCoords',
			displayName: 'Receiver Coords',
			type: 'pythonProperty'
		});

		this.addOutData({
			name: 'id',
			displayName: 'ID',
			type: 'pythonProperty'
		});

		this.pythonComponent.setDataCodeGetter('xml', () => '$(object).xml');
		this.pythonComponent.setDataCodeGetter('sourceCoords', () => '$(object).getSourceCoords()');
		this.pythonComponent.setDataCodeGetter('receiverCoords', () => '$(object).getReceiverCoords()');
		this.pythonComponent.setDataCodeGetter('id', () => '$(object).id');

		this.changeType('utilities.acquisition.Shot.Shot');
	}

	override applyState(): void {
		super.applyState();
		this.changeType(this.state.type);
	}

	changeType(type: string): void {
		this.state.type = type;
		const makutuClasses = this.factory.makutuClasses;
		if (type in makutuClasses) {
			console.log(makutuClasses[type]);
		}
		// this.pythonComponent.setVariableType('object', type);
	}

	data(
		inputs?: Record<string, unknown> | undefined
	): Record<string, unknown> | Promise<Record<string, unknown>> {
		const res = {
			xml: undefined,
			sourceCoords: undefined,
			receiverCoords: undefined,
			id: undefined
		};
		if (!inputs) return { ...super.data(inputs), res };
		const object = inputs.object as PythonObject;
		if (!object) return { ...super.data(inputs), res };

		return {
			...super.data(inputs),
			xml: new PythonProperty(object, 'xml'),
			sourceCoords: new PythonProperty(object, 'sourcesCoords'),
			receiverCoords: new PythonProperty(object, 'receiverCoords'),
			id: new PythonProperty(object, 'id')
		};
	}
}
