import {
	Node,
	path,
	registerNode,
	type NodeParams,
	type SocketsValues
} from '$graph-editor/nodes/Node.svelte';
import { capitalize, getVarsFromFormatString } from '$lib/utils/string';
import type { Scalar, Socket } from '$graph-editor/socket';

export type FormatNodeParams = NodeParams & {
	format?: string;
	vars?: Record<string, unknown>;
	params?: {
		format: string;
		vars: Record<string, unknown>;
	};
};

@registerNode('string.Format')
export class FormatNode extends Node<
	{ format: Scalar<'string'> } & Record<string, Socket<'any'>>,
	{ result: Scalar<'string'> }
> {
	constructor(params: FormatNodeParams = {}) {
		// super('Format', { factory, height: 124.181818 + 43.818182 });
		super({ label: 'Format', ...params });

		this.pythonComponent.setDataCodeGetter('result', () => {
			const vars = this.getFormatVariablesKeys();
			const var_bindings = Object.entries(vars)
				.map(([key, varname]) => `${varname}=$(${key})`)
				.join(', ');
			return `$(format).format(${var_bindings})`;
		});
		this.addOutData('result', {
			type: 'string'
		});
		this.addInData('format', {
			type: 'string',
			initial: params.params?.format ?? '{name}',
			control: {
				type: 'textarea',
				onChange: (value) => {
					this.params.format = value;
					this.updateDataInputs();
				}
			}
		});
		this.updateDataInputs();
	}

	getFormatVariablesKeys(): Record<string, string> {
		const res: Record<string, string> = {};

		for (const key in this.inputs) {
			if (key.startsWith('data-')) res[key] = key.slice('data-'.length);
		}
		return res;
	}

	getValues(inputs?: Record<string, unknown>) {
		const values: Record<string, unknown> = {};
		Object.keys(this.inputs).forEach((key) => {
			if (key.startsWith('data-')) values[key.slice('data-'.length)] = this.getData(key, inputs);
		});
		return values;
	}

	data(
		inputs?:
			| SocketsValues<
					{ format: Scalar<'string'> } & Record<string, Socket<'any', 'scalar' | 'array'>>
			  >
			| undefined
	): SocketsValues<{ result: Scalar<'string'> }> {
		let res = this.getData('format', inputs);
		// console.debug(res)
		const values = this.getValues(inputs);
		for (const [k, v] of Object.entries(values)) {
			res = res.replace(`{${k}}`, v as string);
		}

		return { result: res };
	}

	updateDataInputs(inputs?: Record<string, unknown>) {
		const formatString = this.getData('format', inputs);

		let anyChange = false;
		// console.debug(formatString);
		if (formatString) {
			try {
				const vars = getVarsFromFormatString(formatString);
				// console.debug('vars', vars);

				vars.forEach((varName) => {
					const key = 'data-' + varName;
					if (!(key in this.inputs)) {
						// const varData = this.getData(varName, inputs);
						anyChange = true;
						this.addInData(key, {
							label: capitalize(varName),
							isLabelDisplayed: true
						});
						// console.debug('added', key);
					}
				});

				for (const [i, var_] of vars.entries()) {
					const key = 'data-' + var_;
					this.inputs[key]!.index = i;
				}

				for (const key in this.inputs) {
					if (key.startsWith('data-') && !vars.includes(key.substr(5))) {
						this.removeInput(key);
						anyChange = true;
					}
				}
			} catch (error) {
				return;
			}
		}
		if (anyChange) this.updateElement();
	}
}
