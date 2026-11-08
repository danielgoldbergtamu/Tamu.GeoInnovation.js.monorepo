// The definitions, their popups and the settings service import one another. Loading the service
// first is the order the application loads them in; starting from a definition finds a popup's base
// class still undefined.
import '../settings/event-settings.service';

import { SearchSource } from '@tamu-gisc/ui-kits/ngx/search';

import { AVPParkingConfiguration } from '../../definitions/avp-parking.definitions';
import { parkingLotLinkSource } from '../../definitions/common.definitions';
import { fieldMatches, readableLinkIdentity } from './feature-links';

/**
 * A copied link names a feature by something the same on every server (#2701).
 *
 * AVP Parking's Lot 043 is object 26135 on the production GIS server and 34694 on the development one, so the
 * `?feature=AVP-parking-lots:<objectId>` link its popup copied opened nothing on the other server. The
 * attributes below are the ones both servers return for that lot, joined tables and all.
 */
const LOT_043 = {
  'GIS.TS.ParkingLots.OBJECTID': 26135,
  'GIS.TS.ParkingLots.CIT_CODE': '04300',
  'GIS.TS.ParkingLots.FAC_CODE': '043',
  'GIS.TS.ParkingLots.LotName': 'Lot 043',
  'GIS.TS.ParkingLots.Name': '43',
  'GIS.TS.Lot_Use.OBJECTID': 42,
  'GIS.TS.Lot_Use.LotName': 'Lot 043'
};

describe('fieldMatches', () => {
  it('matches a field by its whole name', () => {
    expect(fieldMatches('FAC_CODE', 'FAC_CODE')).toBe(true);
  });

  it("matches a joined table's field by its last part (#1952)", () => {
    expect(fieldMatches('GIS.TS.ParkingLots.FAC_CODE', 'FAC_CODE')).toBe(true);
  });

  it('does not match a field that only ends with the same letters', () => {
    expect(fieldMatches('GIS.TS.ParkingLots.OLD_FAC_CODE', 'FAC_CODE')).toBe(false);
    expect(fieldMatches('LotName', 'Name')).toBe(false);
  });
});

describe('readableLinkIdentity', () => {
  it("names AVP Parking's Lot 043 as ?lot=043, which both servers resolve, not by its object id", () => {
    expect(readableLinkIdentity(LOT_043, AVPParkingConfiguration.searchSources ?? [])).toEqual({
      param: 'lot',
      value: '043'
    });
  });

  it('prefers a field named exactly over a joined one of the same name', () => {
    const sources = [parkingLotLinkSource('https://example.invalid/0')];

    expect(readableLinkIdentity({ FAC_CODE: '100', 'GIS.TS.ParkingLots.FAC_CODE': '043' }, sources)).toEqual({
      param: 'lot',
      value: '100'
    });
  });

  it('takes the first source with a value, and skips one with no link parameter', () => {
    const sources = [
      { source: 'search-only', queryParams: { where: { keys: ['Name'] } } },
      { source: 'empty', urlQueryParam: 'zone', queryParams: { where: { keys: ['zone_ID'] } } },
      { source: 'tent', urlQueryParam: 'tent', queryParams: { where: { keys: ['tent_id'] } } }
    ] as SearchSource[];

    expect(readableLinkIdentity({ Name: 'x', zone_ID: ' ', tent_id: 'L1' }, sources)).toEqual({
      param: 'tent',
      value: 'L1'
    });
  });

  it('gives no name when no source has a value, so the link keeps the generic form', () => {
    expect(readableLinkIdentity({ 'GIS.TS.ParkingLots.FAC_CODE': null }, [parkingLotLinkSource('u')])).toBeNull();
    expect(readableLinkIdentity(undefined, [parkingLotLinkSource('u')])).toBeNull();
    expect(readableLinkIdentity(LOT_043, [])).toBeNull();
  });
});

describe("AVP Parking's link source", () => {
  it('is for links only, so the sidebar search keeps the application-wide sources', () => {
    const sources = AVPParkingConfiguration.searchSources ?? [];

    expect(sources.map((source) => source.urlQueryParam)).toEqual(['lot']);
    expect(sources.some((source) => source.searchActive)).toBe(false);
  });
});
