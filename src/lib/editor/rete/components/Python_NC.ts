import type { Node } from '$rete/node/Node';
import { NodeComponent } from './NodeComponent';

export type PythonComponentDataType = 'static' | 'dynamic';
export class PythonComponentData<
	T extends PythonComponentDataType = 'static' | 'dynamic',
	N = T extends 'static' ? unknown : T extends 'dynamic' ? string : unknown
> {
	type: T;
	data: N;

	constructor(type: T, data: N) {
		this.type = type;
		this.data = data;
	}
}

type ParseArgumentData = {
	name: string;
	type: string;
	required: boolean;
	help: string;
};

export class PythonNodeComponent extends NodeComponent {
	static isDynamicInput(inputs: Record<string, PythonComponentData[]>): boolean {
		return Object.entries(inputs).some(([key, value]) => {
			return value.some((data) => data.type === 'dynamic');
		});
	}
	async data(inputs: {
		[x: string]: PythonComponentData[];
	}): Promise<Record<string, PythonComponentData>> {
		const isDynamicInput = PythonNodeComponent.isDynamicInput(inputs);

		if (!isDynamicInput) {
			// convert inputs to regular inputs extracting data from PythonComponentData
			const staticInputs: Record<string, unknown[]> = {};
			for (const [key, value] of Object.entries(inputs)) {
				staticInputs[key] = value.map((data) => data.data);
			}
			let staticData = this.node.data(staticInputs);

			if (staticData instanceof Promise) {
				staticData = await staticData;
			}
			const staticPyData: Record<string, PythonComponentData> = {};
			// convert static data to PythonComponentData
			for (const key in staticData) {
				if (this.dynamicOutputs.has(key)) {
					if (!(key in this.dataCodeGetters))
						throw new Error(`Missing data code getter for ${key}`);
					staticPyData[key] = new PythonComponentData(
						'dynamic',
						await this.formatPythonVars(this.dataCodeGetters[key]())
					);
				} else staticPyData[key] = new PythonComponentData('static', staticData[key]);
			}

			return staticPyData;
		}

		// Dynamic inputs case
		const res: Record<string, PythonComponentData> = {};
		for (const [key, dataGetter] of Object.entries(this.dataCodeGetters)) {
			if (!dataGetter) throw new Error(`Missing data code getter for ${key}`);
			res[key] = new PythonComponentData(
				'dynamic',
				await this.formatPythonVars(dataGetter(), inputs)
			);
		}

		return res;
	}
	public dataCodeGetters: Record<string, () => string> = {};
	private importsStatements: Set<string> = new Set();
	private code: string[] = [];
	private createdVariables: Set<string> = new Set();
	private actualCreatedVars: Record<string, string> = {};
	private dynamicOutputs: Set<string> = new Set();
	private classes: Record<string, string> = {};
	private initCode: string[] = [];
	private parseArguments: Map<string, ParseArgumentData> = new Map();

	private codeTemplateGetters: Map<
		string,
		({ inputs }: { inputs: Record<string, unknown> }) => string
	> = new Map([['exec', this.getCodeTemplate]]);
	private newlinesBefore = 0;

	constructor({ owner }: { owner: Node }) {
		super({ id: 'python_NC', owner: owner });
	}

	setDataCodeGetter(key: string, codeGetter: () => string) {
		this.dataCodeGetters[key] = codeGetter;
	}

	addImportStatement(...statements: string[]) {
		for (const statement of statements) {
			this.importsStatements.add(statement);
		}
	}

	addParseArgument(params: ParseArgumentData) {
		if (this.parseArguments.has(params.name))
			throw new Error(`Argument ${params.name} already exists`);
		this.parseArguments.set(params.name, params);
	}

	addClass(code: string) {
		const pattern = /.*?class\s+(\w+)\s*.*?:/s;
		const name = pattern.exec(code)?.[1];
		if (!name || name in this.classes) throw new Error(`Class ${name} already exists`);
		this.classes[name] = code.trim().replaceAll('\t', '    ');
	}
	// TODO; change init into getter
	addInitCode(code: string) {
		this.initCode.push(code.trim());
	}
	addCode(...code: string[]) {
		this.code.push(...code);
	}

	addVariable(...names: string[]) {
		this.addDynamicOutput(...names.filter((key) => key in this.node.outputs));
		for (const name of names) {
			this.setDataCodeGetter(name, () => `$(${name})`);
			this.createdVariables.add(name);
		}
	}

	addVariables(...names: string[]) {
		this.addDynamicOutput(...names.filter((key) => key in this.node.outputs));
		for (const name of names) {
			this.setDataCodeGetter(name, () => `$(${name})`);
			this.createdVariables.add(name);
		}
	}

	addDynamicOutput(...name: string[]) {
		for (const n of name) {
			this.dynamicOutputs.add(n);
		}
	}

	setCodeTemplateGetter(
		getter: ({ inputs }: { inputs: Record<string, unknown> }) => string,
		key = 'exec'
	) {
		this.codeTemplateGetters.set(key, getter);
	}

	setEmptyNewlinesBefore(numNewlines: number) {
		if (numNewlines < 0) throw new Error('Number of newlines must be positive');
		this.newlinesBefore = numNewlines;
	}

	private getCodeTemplate() {
		return `
{{this}}
{{exec}}
`;
	}

	private assignActualVars(usedVars: Set<string>): Set<string> {
		for (const varName of this.createdVariables) {
			let numAttempts = 0;
			let attemptedVarName = varName;
			while (usedVars.has(attemptedVarName)) {
				numAttempts++;
				attemptedVarName = varName + (numAttempts + 1);
			}
			this.actualCreatedVars[varName] = attemptedVarName;
			usedVars.add(attemptedVarName);
		}
		return usedVars;
	}

	static toPythonData(data: unknown): string {
		if (data === undefined) return 'None';
		if (data === null) return 'None';
		if (typeof data === 'string') return `"${data}"`;
		if (typeof data === 'number') return data.toString();
		if (typeof data === 'boolean') return data ? 'True' : 'False';
		if (typeof data === 'object') {
			if (Array.isArray(data)) {
				return `[${data.map((item) => PythonNodeComponent.toPythonData(item)).join(', ')}]`;
			} else {
				return `{${Object.entries(data)
					.map(([key, value]) => `${key}: ${PythonNodeComponent.toPythonData(value)}`)
					.join(', ')}}`;
			}
		}
		throw new Error(`Cannot convert data to python: ${data}`);
	}

	async fetch(): Promise<Record<string, PythonComponentData>> {
		return await this.node.getFactory().pythonDataflowEngine.fetch(this.node.id);
	}

	async fetchInputs(): Promise<Record<string, PythonComponentData[]>> {
		try {
			return await this.node.getFactory().pythonDataflowEngine.fetchInputs(this.node.id);
		} catch (e) {
			const firstMatch = /"(.*?)"/.exec((e as { message: string }).message as string);
			if (firstMatch) {
				const nodeId = firstMatch[1];
				console.error('Problematic node', this.node.getFactory().getEditor().getNode(nodeId));
			}

			throw e;
		}
	}

	// TODO : python dataflow engine

	private async formatPythonVars(template: string, inputs?: Record<string, PythonComponentData[]>) {
		const varPattern = /([^$]*)\$(\(([^)]+)\)|\[([^]+)\])([^$]*)|([^]+)/g;
		let matchVar;
		let resCode = '';

		if (inputs === undefined) inputs = await this.fetchInputs();

		while ((matchVar = varPattern.exec(template)) !== null) {
			const codeBefore = matchVar[1];
			const varName = matchVar[3];
			const dataKey = matchVar[4];
			const codeAfter = matchVar[5];
			const codeWhenNoVar = matchVar[6];
			if (codeBefore) resCode += codeBefore;

			if (dataKey) {
				const data = this.node.getData(dataKey, inputs);
				if (data !== undefined) {
					resCode += PythonNodeComponent.toPythonData(data);
				}
			}

			if (varName) {
				// data is created by this node as a variable
				if (varName in this.actualCreatedVars) {
					resCode += this.actualCreatedVars[varName];
				} else {
					if (varName in this.node.ingoingDataConnections) {
						const input = inputs[varName][0];

						if (input.type === 'dynamic') {
							resCode += inputs[varName][0].data;
						} else {
							resCode += PythonNodeComponent.toPythonData(input.data);
						}
					}
					// data comes from control
					else {
						const data = this.node.getData<'text'>(varName, inputs);
						resCode += PythonNodeComponent.toPythonData(data);
					}
				}
			}
			if (codeAfter) resCode += codeAfter;
			if (codeWhenNoVar) resCode += codeWhenNoVar;
		}
		return resCode;
	}

	static async collectPythonData(
		node: Node | null,
		nodeInput: string | null,
		indentation: string,
		allVars: Set<string>
	): Promise<{
		importsStatements: Set<string>;
		code: string;
		allVars: Set<string>;
		classes: Record<string, string>;
		initCode: string[];
		parserArguments: Map<string, ParseArgumentData>;
	}> {
		// Stop case
		if (node === null || nodeInput === null) {
			return {
				importsStatements: new Set(),
				code: '',
				allVars: allVars,
				classes: {},
				initCode: [],
				parserArguments: new Map()
			};
		}
		if (nodeInput === 'exec') allVars = node.pythonComponent.assignActualVars(allVars);
		// console.log(node.pythonComponent.actualCreatedVars);

		// Get code template
		const getter = node.pythonComponent.codeTemplateGetters.get(nodeInput);
		if (!getter) throw new Error(`No code template getter for ${nodeInput}`);
		const inputs = await node.fetchInputs();
		// Cleanup code template
		let codeTemplate = getter({ inputs }).replace(/^\n*([^]*?)\s*$/, '$1');

		codeTemplate = await node.pythonComponent.formatPythonVars(codeTemplate);

		// Add intentation in front of everyline of codeTemplate
		codeTemplate = codeTemplate.replaceAll(/^(?!.*{{.*}}.*)/gm, indentation);

		const templateVars: Record<string, string> = {};
		let resImportsStatements: Set<string> = node.pythonComponent.importsStatements;
		let resClasses: Record<string, string> = node.pythonComponent.classes;
		let resInitCode: string[] =
			nodeInput !== 'exec'
				? []
				: await Promise.all(
						node.pythonComponent.initCode.map((code) => node.pythonComponent.formatPythonVars(code))
				  );
		let resParserArguments: Map<string, ParseArgumentData> = node.pythonComponent.parseArguments;

		// Pattern to match indendation and variables in code template
		const pattern = /( *){{(.+?)}}(\??)/g;

		// Iterate on code template variables
		let match;
		while ((match = pattern.exec(codeTemplate)) !== null) {
			// Compute child indentation and ensure it is made of spaces
			const childIndentation = match[1].replaceAll('\t', '    ') + indentation;

			const key = match[2];
			const pass = match[3];
			if (key === 'this') {
				templateVars[key] = (
					await Promise.all(
						node.pythonComponent.code.map(
							async (code) => childIndentation + (await node.pythonComponent.formatPythonVars(code))
						)
					)
				).join('\n');
			} else {
				const outgoer = node.getOutgoers(key.replace('_', '-'))?.at(0);
				const conn = node.outgoingExecConnections[key.replace('_', '-')][0];
				const targetInput = conn?.targetInput;
				const childRes = await PythonNodeComponent.collectPythonData(
					outgoer,
					targetInput,
					childIndentation,
					allVars
				);
				const { importsStatements, classes, initCode } = childRes;
				let code = childRes.code;
				if (pass && /^\s*$/.test(code)) code = childIndentation + 'pass';
				allVars = childRes.allVars;
				// Merge imports statements
				resImportsStatements = new Set(
					(function* () {
						yield* resImportsStatements;
						yield* importsStatements;
					})()
				);

				// Merge classes
				resClasses = {
					...resClasses,
					...classes
				};

				// Merge init code
				resInitCode = [...resInitCode, ...initCode];

				// Merge parser arguments
				resParserArguments = new Map(
					(function* () {
						yield* resParserArguments;
						yield* childRes.parserArguments;
					})()
				);

				templateVars[key] = code;
			}
		}
		codeTemplate = '\n'.repeat(node.pythonComponent.newlinesBefore) + codeTemplate;

		// Remove redundant indendation since indendation is
		// already included in child code
		// Remove trailing ? (pass symbol) in code template
		codeTemplate = codeTemplate.replaceAll(/^[\t ]*({{.*?}})\??(.*)$/gm, '$1$2');
		//
		// const resCodeTemplate = getMessageFormatter(codeTemplate).format(templateVars);
		const resCodeTemplate = codeTemplate.replace(/{{(.*?)}}/g, (match, key) => {
			const value = templateVars[key.trim()];
			return value !== undefined ? value : match;
		});

		return {
			importsStatements: resImportsStatements,
			code: resCodeTemplate,
			allVars: allVars,
			classes: resClasses,
			initCode: resInitCode,
			parserArguments: resParserArguments
		};
	}

	async toPython(): Promise<string> {
		// const PythonWorker = await import('$rete/components/Python_NC.worker?worker');
		// const worker = new PythonWorker.default();
		// worker.postMessage("Hello world from window!")
		// TODO: implement web worker
		const { importsStatements, code, classes, initCode, parserArguments } =
			await PythonNodeComponent.collectPythonData(
				this.node,
				'exec',
				'    ',
				new Set(['comm', 'rank', 'xml', 'args', 'xmlfile'])
			);
		const imports = [...importsStatements].join('\n');
		const fClasses = Object.values(classes).join('\n\n');
		const fInitCode = initCode.join('\n    ');

		const fParserArguments = [...parserArguments.values()]
			.map((arg) => {
				return `parser.add_argument('--${arg.name}', type=${
					arg.type
				}, required=${PythonNodeComponent.toPythonData(arg.required)}, help="${arg.help}")`;
			})
			.join('\n    ');
		const fParserArgumenntsExtracted = [...parserArguments.values()]
			.map((arg) => {
				return `${arg.name} = args.${arg.name}`;
			})
			.join('\n    ');

		return `
import argparse

from mpi4py import MPI

#GEOSX
from utilities.input import XML
${imports}
${fClasses ? '\n\n' : ''}${fClasses}${fClasses ? '\n\n' : ''} 
def parse_args():
    """Get arguments

    Returns:
        argument '--xml': Input xml file for GEOSX
    """
    parser = argparse.ArgumentParser(description="Modeling acquisition example")
    parser.add_argument('--xml', type=str, required=True,
                        help="Input xml file for GEOSX")
    ${fParserArguments}

    args ,_ = parser.parse_known_args()
    return args

def main():
    comm = MPI.COMM_WORLD
    rank = comm.Get_rank()
    
    args = parse_args()
    xmlfile = args.xml
    ${fParserArgumenntsExtracted}

    xml = XML(xmlfile)

    ${fInitCode}

${code}

if __name__ == "__main__":
    main()
`.trim();
	}
}
