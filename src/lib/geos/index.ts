import type { GeosXmlSchema$result, GraphEditorData$result, LoadingType } from '$houdini';
import type { GeosTypesTree } from '$lib/backend-interaction';
import type { Writable } from 'svelte/store';

export type GeosDataContext = {
	typesTree: Writable<GeosTypesTree | undefined>;
	typesPaths: Writable<Record<string, string[]> | undefined>;
	xmlSchema: Writable<GraphEditorData$result['geos']['xmlSchema'] | undefined>;
};

export type GeosSchema = {
	simpleTypes: Map<
		string,
		{
			enum: string[] | null;
			name: string;
			pattern: string;
		}
	>;
	complexTypes: Map<
		string,
		{
			name: string;
			link: string;
			attributes: Map<
				string,
				{
					name: string;
					type: string;
					default: string | undefined;
					description: string;
					required: boolean;
				}
			>;
			childTypes: string[];
		}
	>;
};
