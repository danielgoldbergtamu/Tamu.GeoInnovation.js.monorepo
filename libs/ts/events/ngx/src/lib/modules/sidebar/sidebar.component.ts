import { Component, OnInit, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { TestingService } from '@tamu-gisc/dev-tools/application-testing';

import { EventConfiguration } from '../../interfaces/special-event.interface';
import { EventSettingsService } from '../../services/settings/event-settings.service';

import { TamuBlockBrandingComponent } from '@tamu-gisc/ui-kits/ngx/branding';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { SidebarComponent } from '@tamu-gisc/common/ngx/ui/sidebar';
import { SidebarTabComponent } from '@tamu-gisc/common/ngx/ui/sidebar';
import { PopupComponent } from '@tamu-gisc/maps/feature/popup';
import { RevealSidebarOnPopupDirective } from '@tamu-gisc/maps/feature/popup';
import { AGGIEMAP_SIDEBAR_TABS, AggiemapSidebarTab } from '@tamu-gisc/aggiemap/ngx/ui/desktop';

@Component({
  selector: 'tamu-gisc-movein-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [
    SidebarComponent,
    SidebarTabComponent,
    PopupComponent,
    RevealSidebarOnPopupDirective,
    TamuBlockBrandingComponent,
    RouterOutlet,
    AsyncPipe
  ]
})
export class MoveInOutSidebarComponent implements OnInit {
  private readonly eventSettingsService = inject(EventSettingsService);
  private readonly testing = inject(TestingService);

  public configuration: EventConfiguration | null;

  /** The main map's tabs (#2758). */
  public readonly tabs = AGGIEMAP_SIDEBAR_TABS;

  /** Development and localhost only; gates the development-only tabs, as on the main map. */
  public isDev: Observable<boolean>;

  constructor() {
    this.isDev = this.testing.get('isTesting');
  }

  public ngOnInit(): void {
    this.configuration = this.eventSettingsService.eventConfiguration()?.configuration ?? null;
  }

  /**
   * Whether the given tab should render. Falls back to showing every tab when `sidebarTabs` is
   * omitted, preserving existing behavior for maps that don't restrict their tabs.
   */
  public showTab(tab: AggiemapSidebarTab['id']): boolean {
    return !this.configuration?.sidebarTabs || this.configuration.sidebarTabs.includes(tab);
  }
}
