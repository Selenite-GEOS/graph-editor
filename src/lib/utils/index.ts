// export * from './uuid';
// export * from './context';
export { formatXml } from './xml';
export * from './url';
export * from './string';

import { v4 as uuidv4 } from 'uuid';

let idCount = 0;
export function newLocalId(baseName?: string) {
	idCount += 1;
	return `${baseName ?? 'local-unique-id'}-${idCount}}`;
}

export function newUuid(baseName?: string) {
	return `${baseName ? baseName + '-' : ''}${uuidv4()}`;
}
