import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Angulartics2 } from 'angulartics2';

import { TestingService } from '@tamu-gisc/dev-tools/application-testing';
import { AggiemapSidebarComponent } from '@tamu-gisc/aggiemap/ngx/ui/desktop';

import { EventConfiguration } from '../../interfaces/special-event.interface';
import { EventSettingsService } from '../../services/settings/event-settings.service';
import { MoveInOutSidebarComponent } from './sidebar.component';

/**
 * Every map offers the main map's sidebar tabs (#2758).
 *
 * The main map's sidebar and the one every event, parking and campus map uses kept their own copies of the tab list, and
 * they drifted: Bus Routes and Experiments were added to the first only, so no event or parking map offered bus routes.
 * Both now draw one list. This renders both and compares them, so a tab added to one template and not the other, or a
 * second list, fails here.
 */
describe('the sidebar tabs every map offers (#2758)', () => {
  /** The titles of the tabs a sidebar renders, its own components left as elements. */
  function tabs<T>(component: new (...args: never[]) => T, isTesting: boolean, configuration?: Partial<EventConfiguration>) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: TestingService, useValue: { get: () => of(isTesting) } },
        { provide: Angulartics2, useValue: { eventTrack: { next: () => undefined } } },
        { provide: EventSettingsService, useValue: { eventConfiguration: () => ({ configuration }) } }
      ]
    });
    TestBed.overrideComponent(component, { set: { imports: [AsyncPipe], schemas: [CUSTOM_ELEMENTS_SCHEMA] } });

    const fixture = TestBed.createComponent(component);

    fixture.detectChanges();

    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('tamu-gisc-sidebar-tab')).map(
      (tab) => (tab as HTMLElement & { title: string }).title
    );
  }

  it('on a development host, the main map offers every tab', () => {
    expect(tabs(AggiemapSidebarComponent, true)).toEqual([
      'Features',
      'Directions',
      'Bus Routes',
      'Experiments',
      'Settings'
    ]);
  });

  it('on production, the main map offers every tab but the development-only ones', () => {
    expect(tabs(AggiemapSidebarComponent, false)).toEqual(['Features', 'Bus Routes', 'Settings']);
  });

  for (const isTesting of [true, false]) {
    it(`an event or parking map offers the main map's tabs ${isTesting ? 'on a development host' : 'on production'}`, () => {
      expect(tabs(MoveInOutSidebarComponent, isTesting, {})).toEqual(tabs(AggiemapSidebarComponent, isTesting));
    });
  }

  it('a map that names its tabs, as a satellite campus does, offers only those', () => {
    expect(tabs(MoveInOutSidebarComponent, true, { sidebarTabs: ['features'] })).toEqual(['Features']);
  });
});
