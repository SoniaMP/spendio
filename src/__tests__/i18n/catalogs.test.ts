import { describe, it, expect } from 'vitest';
import resources from '@/i18n/resources';

type Catalog = Record<string, unknown>;

function flattenKeys(catalog: Catalog, prefix = ''): string[] {
  return Object.entries(catalog).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object' && value !== null
      ? flattenKeys(value as Catalog, path)
      : [path];
  });
}

const languages = Object.keys(resources);
const reference = 'es';

describe('translation catalogs', () => {
  it.each(languages.filter((code) => code !== reference))(
    'the %s catalog has exactly the same keys as the reference one',
    (code) => {
      const referenceKeys = flattenKeys(resources[reference].translation).sort();
      const keys = flattenKeys(
        resources[code as keyof typeof resources].translation,
      ).sort();

      expect(keys).toEqual(referenceKeys);
    },
  );

  it.each(languages)('the %s catalog has no empty values', (code) => {
    const catalog = resources[code as keyof typeof resources].translation;
    const empty = flattenKeys(catalog).filter((path) => {
      const value = path
        .split('.')
        .reduce<unknown>((acc, key) => (acc as Catalog)[key], catalog);
      return typeof value !== 'string' || value.trim() === '';
    });

    expect(empty).toEqual([]);
  });

  it.each(languages)(
    'the %s catalog keeps the same interpolation variables as the reference one',
    (code) => {
      const catalog = resources[code as keyof typeof resources].translation;
      const referenceCatalog = resources[reference].translation;

      const variablesOf = (source: Catalog, path: string) => {
        const value = path
          .split('.')
          .reduce<unknown>((acc, key) => (acc as Catalog)[key], source);
        return [...String(value).matchAll(/\{\{(\w+)\}\}/g)]
          .map((match) => match[1])
          .sort();
      };

      const mismatched = flattenKeys(referenceCatalog).filter(
        (path) =>
          variablesOf(catalog, path).join() !==
          variablesOf(referenceCatalog, path).join(),
      );

      expect(mismatched).toEqual([]);
    },
  );
});
