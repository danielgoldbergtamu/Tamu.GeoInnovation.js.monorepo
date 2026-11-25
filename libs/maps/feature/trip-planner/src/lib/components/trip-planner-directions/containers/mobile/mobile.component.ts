import { Component } from '@angular/core';

import { TripPlannerDirectionsComponent, TripPlannerDirectionsLayout } from '../base/base.component';
import { TripPlannerDirectionsActionsComponent } from '../../../trip-planner-directions-actions/containers/base/base.component';
import { TripPlannerDirectionsActionsMobileComponent } from '../../../trip-planner-directions-actions/containers/mobile/mobile.component';
import { TripPlannerModeSwitchComponent } from '../../../trip-planner-mode-switch/containers/base/base.component';

/**
 * The directions in the phone's bottom sheet: the base template in its `mobile` layout (#3490), so the two cannot drift
 * apart again. The class stays for its selector, which the bottom sheet hosts its drag directive on, and for its
 * stylesheet, which places and sizes the sheet.
 */
@Component({
  selector: 'tamu-gisc-trip-planner-directions-mobile',
  templateUrl: '../base/base.component.html',
  styleUrls: ['../base/base.component.scss', './mobile.component.scss'],
  imports: [
    TripPlannerDirectionsActionsComponent,
    TripPlannerDirectionsActionsMobileComponent,
    TripPlannerModeSwitchComponent
  ]
})
export class TripPlannerDirectionsMobileComponent extends TripPlannerDirectionsComponent {
  public override readonly layout: TripPlannerDirectionsLayout = 'mobile';
}
