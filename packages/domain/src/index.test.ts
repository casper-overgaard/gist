import { describe, it, expect } from 'vitest';
import { AssetTypeSchema } from './index';

describe('Domain Schemas', () => {
  it('should validate an asset type correctly', () => {
    expect(AssetTypeSchema.parse('image')).toBe('image');
  });
});
