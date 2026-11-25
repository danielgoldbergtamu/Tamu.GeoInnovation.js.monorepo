import { CUSTOM_ELEMENTS_SCHEMA, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { Angulartics2 } from 'angulartics2';

import { TripPlannerService } from '../../../../services/trip-planner.service';
import { TripPlannerDirectionsComponent } from '../base/base.component';
import { TripPlannerDirectionsMobileComponent } from './mobile.component';

/**
 * The phone's directions and the desktop's are one template (#3490).
 *
 * They were two, and drifted: the phone's always showed its actions and had no calculating or no-route feedback. Now
 * the phone's is the base template in its `mobile` layout, which adds only the bottom sheet's drag handle and the phone's
 * actions; every state reads the same on both.
 */
describe('TripPlannerDirectionsMobileComponent', () => {
  const ROUTE = {
    isFulfilled: true,
    isProcessing: false,
    isError: false,
    directions: { totalTime: 3, totalLength: 0.63 },
    modeSwitches: []
  };
  const CALCULATING = { isFulfilled: false, isProcessing: true, isError: false };
  const NO_ROUTE = { isFulfilled: true, isProcessing: false, isError: true };

  function render(component: Type<TripPlannerDirectionsComponent>, result: object): HTMLElement {
    TestBed.configureTestingModule({
      imports: [component],
      providers: [
        { provide: Router, useValue: {} },
        { provide: Angulartics2, useValue: {} },
        {
          provide: TripPlannerService,
          useValue: { TravelOptions: new BehaviorSubject({ travel_mode: 1 }), getTripResultForTravelMode: () => of(result) }
        }
      ]
    });

    // The actions and the mode switches are not what is tested, and need the planner's services and the router.
    TestBed.overrideComponent(component, { set: { imports: [], schemas: [CUSTOM_ELEMENTS_SCHEMA] } });

    const fixture = TestBed.createComponent(component);

    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  it("draws the bottom sheet's handle and the phone's actions, and the desktop draws neither", () => {
    const phone = render(TripPlannerDirectionsMobileComponent, ROUTE);

    expect(phone.querySelector('.handle')).not.toBeNull();
    expect(phone.querySelector('tamu-gisc-trip-planner-directions-actions-mobile')).not.toBeNull();
    expect(phone.querySelector('tamu-gisc-trip-planner-directions-actions')).toBeNull();

    TestBed.resetTestingModule();
    const desktop = render(TripPlannerDirectionsComponent, ROUTE);

    expect(desktop.querySelector('.handle')).toBeNull();
    expect(desktop.querySelector('tamu-gisc-trip-planner-directions-actions')).not.toBeNull();
    expect(desktop.querySelector('tamu-gisc-trip-planner-directions-actions-mobile')).toBeNull();
  });

  it('says a route is being calculated, as the desktop does, and offers no actions until it is', () => {
    const phone = render(TripPlannerDirectionsMobileComponent, CALCULATING);

    expect(phone.textContent).toContain('Calculating route. Please wait...');
    expect(phone.querySelector('tamu-gisc-trip-planner-directions-actions-mobile')).toBeNull();
  });

  it('says when no route was found, as the desktop does', () => {
    expect(render(TripPlannerDirectionsMobileComponent, NO_ROUTE).textContent).toContain('No reasonable route was found!');
  });

  it('shows the same overview as the desktop for a route', () => {
    const phone = render(TripPlannerDirectionsMobileComponent, ROUTE).querySelector('.directions-overview')?.textContent;

    TestBed.resetTestingModule();
    const desktop = render(TripPlannerDirectionsComponent, ROUTE).querySelector('.directions-overview')?.textContent;

    expect(phone).toContain('0.63');
    expect(phone).toEqual(desktop);
  });
});
