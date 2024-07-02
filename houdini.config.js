/// <references types="houdini-svelte">

/** @type {import('houdini').ConfigFile} */
let config = {
	watchSchema: {
		url: 'http://localhost:8000/api/v1/graphql'
	},
	plugins: {
		'houdini-svelte': {}
	},
	scalars: {
		ESCreateUpdateResultType: {
			type: '"created" | "updated" | "deleted"'
		},
		JSON: {
			type: 'unknown'
		},
		Base64: {
			type: 'string',
			unmarshal(val) {
				return val;
			},
			marshal(val) {
				return val;
			}
		},
		TypesTree: {
			type: 'GeosTypesTree',
			unmarshal(val) {
				return val;
			},
			marshal(val) {
				return val;
			}
		},
		TypesPaths: {
			type: 'Record<string, string[]>',
			unmarshal(val) {
				return val;
			},
			marshal(val) {
				return val;
			}
		},
		/* in your case, something like */
		UUID: {
			// <- The GraphQL Scalar
			type: 'string' // <-  The TypeScript type
		},
		DateTime: {
			type: 'Date',
			unmarshal(val) {
				return val ? new Date(val) : null;
			},

			marshal(date /** @type {Date} */) {
				return date && date.toISOString();
			}
		},
		PythonTypingInfo: {
			type: 'unknown'
		}
	}
};

// if (typeof window === 'undefined') {
// 	const { getConfig } = await import('@selenial/typed-config');
// 	const houdiniConf = await getConfig({
// 		domain: 'Houdini',
// 		schema: {
// 			schemaUrl: 'string',
// 			watch: 'boolean',
// 			static: 'boolean'
// 		}
// 	});

// 	config = {
// 		...config,

// 		watchSchema: {
// 			url: houdiniConf.schemaUrl
// 			// headers: {
// 			// 	Authorization(env) {
// 			// 		return `Bearer 05785ac6-25eb-4c1f-80a1-c6f6a96c8e45`;
// 			// 	}
// 			// }
// 		}
// 	};
// 	if (!houdiniConf.watch) {
// 		config.watchSchema = undefined;
// 	}
// 	config.plugins['houdini-svelte'].static = houdiniConf.static;
// }

export default config;
