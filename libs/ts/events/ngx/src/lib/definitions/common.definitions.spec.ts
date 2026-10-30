// The definitions, their popups and the settings service import one another. Loading the service
// first is the order the application loads them in; starting from a definition finds a popup's base
// class still undefined.
import '../services/settings/event-settings.service';

import { EventPopups } from '../modules/popups/popups';
import { athleticsDevelopmentSource } from './common.definitions';

/**
 * Every athletics map but the two basketball maps builds its layers here, so a change to the helper reaches all of
 * them. The refresh it gained for Women's Basketball (#2581) is opt-in: a caller that does not ask for it gets
 * exactly the source it got before, with no `refreshInterval` key at all, not even an undefined one.
 */
describe('athleticsDevelopmentSource', () => {
  const popup = {
    popupComponent: EventPopups.MarkdownPopupComponent,
    popupData: { name: 'attributes.name', description: 'attributes.description' },
    visible: true,
    listMode: 'show'
  };

  it('builds the source an existing caller got before, exactly', () => {
    expect(athleticsDevelopmentSource({ id: 'a', url: 'https://host/FeatureServer/0' })).toStrictEqual({
      type: 'feature',
      id: 'a',
      url: 'https://host/FeatureServer/0',
      ...popup,
      native: { outFields: ['*'] }
    });
  });

  it('builds a titled, one-type source exactly as before', () => {
    expect(
      athleticsDevelopmentSource({ id: 'b', url: 'https://host/FeatureServer/1', title: 'Lots', onlyType: 'Lot' })
    ).toStrictEqual({
      type: 'feature',
      id: 'b',
      url: 'https://host/FeatureServer/1',
      title: 'Lots',
      ...popup,
      native: { outFields: ['*'], definitionExpression: "type = 'Lot'" }
    });
  });

  it('polls the service when asked to (#2581)', () => {
    const source = athleticsDevelopmentSource({ id: 'c', url: 'https://host/FeatureServer/2', refreshInterval: 1 });

    expect(source.native).toStrictEqual({ outFields: ['*'], refreshInterval: 1 });
  });
});
