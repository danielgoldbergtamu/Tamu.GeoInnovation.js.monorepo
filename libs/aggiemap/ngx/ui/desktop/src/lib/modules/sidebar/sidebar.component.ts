import { Component, OnInit, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Angulartics2 } from 'angulartics2';

import { TestingService } from '@tamu-gisc/dev-tools/application-testing';

import { TamuBlockBrandingComponent } from '@tamu-gisc/ui-kits/ngx/branding';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { SidebarComponent } from '@tamu-gisc/common/ngx/ui/sidebar';
import { SidebarTabComponent } from '@tamu-gisc/common/ngx/ui/sidebar';
import { PopupComponent } from '@tamu-gisc/maps/feature/popup';
import { RevealSidebarOnPopupDirective } from '@tamu-gisc/maps/feature/popup';

import { AGGIEMAP_SIDEBAR_TABS } from './sidebar-tabs';

@Component({
  selector: 'tamu-gisc-aggiemap-sidebar',
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
export class AggiemapSidebarComponent implements OnInit {
  private devTools = inject(TestingService);
  private readonly analytics = inject(Angulartics2);

  public isDev: Observable<boolean>;

  /** The tabs every map offers (#2758). */
  public readonly tabs = AGGIEMAP_SIDEBAR_TABS;

  public ngOnInit() {
    this.isDev = this.devTools.get('isTesting');
  }

  public reportSidebarContent(tabTitle: string) {
    const label = {
      guid: crypto.randomUUID(),
      date: Date.now(),
      name: tabTitle
    };

    this.analytics.eventTrack.next({
      action: 'sidebar_select',
      properties: {
        category: 'ui_interaction',
        gstCustom: label
      }
    });
  }
}
