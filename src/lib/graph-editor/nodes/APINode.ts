import { getBackendAddress } from '$utils/config';
import { Node, type NodeParams } from './Node.svelte';
// import { env } from '$env/dynamic/public';
export interface APINodeParams extends NodeParams {
	url: string;
	defaultOutExec?: boolean;
}

export abstract class APINode extends Node {
	url: string;

	constructor(params: APINodeParams) {
		const {
			url,
			label = 'API',
			height = 225,
			width = 150,
			factory,
			defaultOutExec = true
		} = params;
		super({ label, height: height, width: width, factory });

		this.url = getBackendAddress(`/api/v1` + url);

		this.addInExec();
		if (defaultOutExec) this.addOutExec();
	}

	async getBody() {
		const inputs = (await this.fetchInputs()) as Record<string, unknown>;
		const body: Record<string, unknown> = {};
		for (const key in this.inputs) {
			if (key != 'exec') {
				const data = this.getData(key, inputs);
				// console.log(data);

				body[key] = data;
			}
		}
		// console.log("body:",JSON.stringify(body));

		return body;
	}

	override async execute(input: string, forward: (output: string) => unknown): Promise<void> {
		// notifications.show({ title: 'API Node', message: `Execution de l'appel API ${this.url}` });
		try {
			const response = await fetch(this.url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(await this.getBody())
			});
			const responseData = await response.json();
			await this.processResponseData(responseData);

			super.execute(input, forward);
		} catch (error) {
			{
				super.execute(input, forward);
				return;
			}
		}
	}

	async processResponseData(responseData: Record<string, unknown>) {
		for (const key in responseData) {
			this.setData(key, responseData[key]);
		}
		this.processDataflow();
	}
}

(APINode as unknown as { __isAbstract: boolean }).__isAbstract = true;
