import { LayerSource } from '@tamu-gisc/common/types';
import { SearchSource } from '@tamu-gisc/ui-kits/ngx/search';

import { EventPopups } from '../modules/popups/popups';

type FeatureNative = Extract<LayerSource, { type: 'feature' }>['native'];
type FeatureRenderer = NonNullable<NonNullable<FeatureNative>['renderer']>;

/**
 * One solid fill, with no outline, for every feature a layer draws: a renderer that tests no field.
 *
 * Only for a layer whose service renderer cannot draw what the layer holds, as a deliberate override
 * (docs/map-layers.md). Each use says beside it why the service's renderer fails, takes `color` from
 * the service's own symbol for the features the layer selects, and says what would let it be removed.
 * Business Parking (#1981) and Vendor Parking (#1991) use it because their services' renderers key on
 * `GIS.TS.ParkingLots.LotType`, which the services do not publish.
 */
export function lotFill(label: string, color: [number, number, number, number]): FeatureRenderer {
  return {
    type: 'simple',
    label,
    symbol: { type: 'simple-fill', style: 'solid', color, outline: null }
  } as FeatureRenderer;
}

export const commonSymbols = {
  GREEN_ARROW: {
    type: 'simple-line',
    color: 'rgb(56, 168, 0)',
    width: 2,
    marker: {
      type: 'line-marker',
      style: 'arrow',
      color: 'rgb(56, 168, 0)',
      placement: 'end'
    }
  },
  RED_ARROW: {
    type: 'simple-line',
    color: 'rgb(230, 0, 0)',
    width: 2,
    marker: {
      type: 'line-marker',
      style: 'arrow',
      color: 'rgb(230, 0, 0)',
      placement: 'end'
    }
  }
};

/**
 * One layer of an athletics map as the **development** GIS server publishes it (#2209).
 *
 * The development views are the schema going forward: the GIS team confirmed on 26 October 2026 that
 * production's services will be republished to match them. They differ from production's in two ways
 * that every athletics definition has to account for, so the accounting lives here once rather than
 * nine times over.
 *
 * **Each view already holds one sport.** `SoccerParking_view` carries only `event = 'Soccer'`, and so
 * on. Production's per-sport filters - `baseball IN ('AnyValid','SeasonPass')`, `trackxc =
 * 'EventParking'`, `wbasketball IS NOT NULL`, `event = '<Sport>'` - have nothing left to select and no
 * column to read, so they are dropped rather than translated. Where production splits one service
 * layer into two map layers, `type` carries that distinction instead: pass `onlyType`.
 *
 * **The attributes are a marker feed**: `name`, `description`, `type`, and `event` on the layers that
 * carry it. Production's `lotname` and `<sport>n` do not exist here. A popup that reads them comes up
 * empty while the layer still draws, which is why feature-count checks passed maps whose popups were
 * blank - `map-layers.spec.ts` counts features and cannot see an empty popup.
 *
 * Women's Basketball was written this way by hand in #2176 and is the only athletics map whose
 * development popups have ever worked; this generalises it.
 */
export function athleticsDevelopmentSource(source: {
  id: string;
  url: string;
  title?: string;
  /** The `type` value this layer shows, where production split one service layer into two. */
  onlyType?: string;
}): LayerSource {
  return {
    type: 'feature',
    id: source.id,
    url: source.url,
    ...(source.title === undefined ? {} : { title: source.title }),
    popupComponent: EventPopups.MarkdownPopupComponent,
    popupData: {
      name: 'attributes.name',
      description: 'attributes.description'
    },
    visible: true,
    listMode: 'show',
    native: {
      outFields: ['*'],
      ...(source.onlyType === undefined ? {} : { definitionExpression: `type = '${source.onlyType}'` })
    }
  } as unknown as LayerSource;
}

/**
 * A `?lot=043` link for a parking map whose lots carry Transportation Services' facility code, `FAC_CODE`,
 * which a popup's copy button then writes in place of `?feature=<layerId>:<objectId>` (#2701).
 *
 * The object id in the generic form names a lot on one server only: the development and production GIS
 * servers numbered the same lots independently, so AVP Parking's Lot 043 is object 26135 on one and 34694
 * on the other, and a link copied from either opened nothing on the other. It also changes when a service
 * is republished. `FAC_CODE` is the lot's own number, the same everywhere, and zero-padded as TS's own
 * links are. A service that joins several tables names it `GIS.TS.ParkingLots.FAC_CODE`; both the lookup
 * and the copy button match a field by its last part.
 *
 * Link-only (`searchActive: false`), so the sidebar search is unchanged. `?lot=43` and `?lot=Lot 043` still
 * open the lot too, through the application's own `lot` source, which a link tries after this one.
 *
 * @param url The parking lots layer this map draws, which carries `FAC_CODE`.
 */
export function parkingLotLinkSource(url: string): SearchSource {
  return {
    source: 'parking-lot-link',
    name: 'Parking Lot',
    url,
    queryParams: { where: { keys: ['FAC_CODE'], operators: ['='] } },
    featuresLocation: 'features',
    displayTemplate: 'Lot {attributes.FAC_CODE}',
    searchActive: false,
    urlQueryParam: 'lot',
    urlQueryParamAliases: ['Lot']
  } as SearchSource;
}
