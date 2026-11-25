import { Component } from '@angular/core';

import { TripPlannerDirectionsActionsComponent } from '../base/base.component';

import { AsyncPipe } from '@angular/common';
import { ClipboardCopyDirective } from '@tamu-gisc/ui-kits/ngx/interactions/clipboard';

/**
 * The directions actions on the phone: the base template, unchanged (#3490). Only its stylesheet differs, lightening
 * the two borders and the dividers to the bottom sheet's grey.
 */
@Component({
  selector: 'tamu-gisc-trip-planner-directions-actions-mobile',
  templateUrl: '../base/base.component.html',
  styleUrls: ['../base/base.component.scss', './mobile.component.scss'],
  imports: [ClipboardCopyDirective, AsyncPipe]
})
export class TripPlannerDirectionsActionsMobileComponent extends TripPlannerDirectionsActionsComponent {}
