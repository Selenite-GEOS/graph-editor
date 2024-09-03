import { describe, it, expect } from 'vitest';
import { areTypesCompatible } from './typed-sockets';

describe('typed-socket', () => {
	describe('areTypesCompatible', () => {
		it('should return true if the types are compatible', () => {
			expect(
				areTypesCompatible(
					{ type: 'boolean', datastructure: 'scalar' },
					{ type: 'boolean', datastructure: 'scalar' }
				)
			).toBe(true);
		});
		it('should return false if the types are incompatible', () => {
			expect(
				areTypesCompatible(
					{ type: 'boolean', datastructure: 'scalar' },
					{ type: 'number', datastructure: 'scalar' }
				)
			).toBe(false);
		});
		it('should return true if in type is any', () => {
			expect(
				areTypesCompatible(
					{ type: 'any', datastructure: 'scalar' },
					{ type: 'boolean', datastructure: 'scalar' }
				)
			).toBe(true);
			expect(
				areTypesCompatible(
					{ type: 'any', datastructure: 'scalar' },
					{ type: 'number', datastructure: 'scalar' }
				)
			);
		});
		it('should return true if out type is any', () => {
			expect(
				areTypesCompatible(
					{ type: 'boolean', datastructure: 'scalar' },
					{ type: 'any', datastructure: 'scalar' }
				)
			).toBe(true);
			expect(
				areTypesCompatible(
					{ type: 'number', datastructure: 'scalar' },
					{ type: 'any', datastructure: 'scalar' }
				)
			);
		});
		it('should return true if both types are any', () => {
			expect(
				areTypesCompatible(
					{ type: 'any', datastructure: 'scalar' },
					{ type: 'any', datastructure: 'scalar' }
				)
			).toBe(true);
		});
		it('should return true if both types are any but datastructures are incompatible', () => {
			expect(
				areTypesCompatible(
					{ type: 'any', datastructure: 'scalar' },
					{ type: 'any', datastructure: 'array' }
				)
			).toBe(true);
		});
		it('should return true if some types are any and datastructures are different', () => {
			expect(
				areTypesCompatible(
					{ type: 'integer', datastructure: 'scalar' },
					{ type: 'any', datastructure: 'array' }
				)
			).toBe(true);
		});
		it('should return true if same types with scalar output and array input', () => {
			expect(
				areTypesCompatible(
					{ type: 'integer', datastructure: 'scalar' },
					{ type: 'integer', datastructure: 'array' }
				)
			).toBe(true);
		});
		it('should handle subtypes', () => {
			expect(
				areTypesCompatible(
					{ type: 'xmlElement:A', datastructure: 'scalar' },
					{ type: 'xmlElement:A', datastructure: 'scalar' }
				)
			).toBe(true);
			expect(
				areTypesCompatible(
					{ type: 'xmlElement:A', datastructure: 'scalar' },
					{ type: 'xmlElement:B', datastructure: 'scalar' }
				)
			).toBe(false);
		});
		it('should handle subtypes with wildcard *', () => {
			expect(
				areTypesCompatible(
					{ type: 'xmlElement:*', datastructure: 'scalar' },
					{ type: 'xmlElement:A', datastructure: 'scalar' }
				)
			).toBe(true);
			expect(
				areTypesCompatible(
					{ type: 'xmlElement:A', datastructure: 'scalar' },
					{ type: 'xmlElement:*', datastructure: 'scalar' }
				)
			).toBe(true);
			expect(
				areTypesCompatible(
					{ type: 'xmlElement:*', datastructure: 'scalar' },
					{ type: 'xmlElement:*', datastructure: 'scalar' }
				)
			).toBe(true);
		});
		it('should allow connection from xml scalar to xml array', () => {
			expect(
				areTypesCompatible(
					{ type: 'xmlElement:A', datastructure: 'scalar' },
					{ type: 'xmlElement:A', datastructure: 'array' }
				)
			).toBe(true);
		});
		it('should allow connection from group name ref scalar to group name ref array', () => {
			expect(
				areTypesCompatible(
					{ type: 'groupNameRef', datastructure: 'scalar' },
					{ type: 'groupNameRef', datastructure: 'array' }
				)
			).toBe(true);
		});
	});
});
