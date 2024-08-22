import { ButtonControl, Socket, type Exec, type Scalar } from '$graph-editor/socket';
import { formatXml } from '$utils';
import { Node, path, registerNode, type NodeParams } from '$graph-editor/nodes/Node.svelte';
import { download } from '@selenite/commons';
import { XMLData } from '../XML';

@registerNode('io.Download')
@path('I/O')
export class DownloadNode extends Node<
	{ exec: Exec; data: Socket<'any'>; name: Scalar<'string'> },
	{ exec: Exec },
	{ downloadBtn: ButtonControl }
> {
	constructor(params: NodeParams = {}) {
		super({ label: 'Download', ...params });
		this.addInData('name', { type: 'string', isLabelDisplayed: true, initial: 'problem.xml' });
		this.addInExec();
		this.addOutExec();
		this.addInData('data', { isLabelDisplayed: true });
		this.addControl(
			'downloadBtn',
			new ButtonControl({ label: 'Download', onClick: () => this.download(), placeInHeader: true })
		);
	}

	async download() {
		const inputs = await this.fetchInputs();
		let data = this.getData('data', inputs);
		if (data instanceof XMLData) {
			data = formatXml({ xml: data.toXml() });
		}
		const name = this.getData('name', inputs);
		download(name, data);
	}

	async execute(
		input: 'exec',
		forward: (output: 'exec') => unknown,
		forwardExec?: boolean
	): Promise<void> {
		await this.download();
		super.execute(input, forward, true);
	}
}
