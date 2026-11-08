import { SearchSource } from '@tamu-gisc/ui-kits/ngx/search';

/**
 * Whether a layer's field `name` is the field a search source calls `candidate`.
 *
 * A service that joins several tables names its fields by table - `GIS.TS.ParkingLots.LotName`, not
 * `LotName` - so a candidate matches a field's last dot-separated part. Compared whole, no field matched
 * and a `?lot=` link opened nothing on fourteen parking maps (#1952); a popup's copy button, which compared
 * them whole too, wrote an object id where a lot number was declared (#2701).
 */
export function fieldMatches(name: string, candidate: string): boolean {
  return name === candidate || name.split('.').pop() === candidate;
}

/**
 * A readable name for a feature in a copied link, as `{ param, value }` - for example
 * `{ param: 'lot', value: '043' }` for `?lot=043` - from the first of `sources` with a `urlQueryParam`
 * whose first match field has a value on the feature, matched by `fieldMatches`. `null` when none has,
 * and the link keeps the generic `feature=<layerId>:<objectId>` form.
 */
export function readableLinkIdentity(
  attributes: Record<string, unknown> | undefined,
  sources: SearchSource[]
): { param: string; value: string | number } | null {
  if (!attributes) {
    return null;
  }

  for (const source of sources) {
    const field = source.queryParams?.where?.keys?.[0];

    if (!source.urlQueryParam || !field) {
      continue;
    }

    // The field itself first, so a plain name is never shadowed by a joined table's field of the same name.
    const name = field in attributes ? field : Object.keys(attributes).find((attribute) => fieldMatches(attribute, field));
    const value = name === undefined ? undefined : attributes[name];

    if (value !== undefined && value !== null && `${value}`.trim() !== '') {
      return { param: source.urlQueryParam, value: value as string | number };
    }
  }

  return null;
}
