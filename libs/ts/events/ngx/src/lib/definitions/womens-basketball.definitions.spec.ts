// The definitions, their popups and the settings service import one another. Loading the service
// first is the order the application loads them in; starting from a definition finds a popup's base
// class still undefined.
import '../services/settings/event-settings.service';

import { WomensBasketball_DevelopmentLayerSources } from './womens-basketball.definitions';

/**
 * Women's Basketball reaches the map without a reload, as Men's Basketball and football do (#2581, #2558, #1587).
 *
 * Staff edit the service on game day: a lot closed, accessible spaces moved. Both layers poll their service every
 * minute, so a visitor with the map open sees the change.
 */
describe("Women's Basketball game-day edits", () => {
  it('declares its two layers', () => {
    expect(WomensBasketball_DevelopmentLayerSources.length).toBe(2);
  });

  for (const source of WomensBasketball_DevelopmentLayerSources) {
    it(`${source.id} refreshes every minute`, () => {
      expect((source.native as { refreshInterval?: number } | undefined)?.refreshInterval).toBe(1);
    });
  }
});
