import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { catchError, filter, of, switchMap, tap } from 'rxjs';

import type { CheckIn, CheckInDashboard, CheckInDashboardEvent, CheckInDashboardPerson } from '@tamu-gisc/gisday/platform/data-api';
import { CheckinService } from '@tamu-gisc/gisday/platform/ngx/data-access';
import { SelectComponent } from '@tamu-gisc/ui-kits/ngx/forms';
import { ChartSeries, countsByHour, dayIn, LineChartComponent } from '@tamu-gisc/ui-kits/ngx/charts';
import { fileNamePart } from '@tamu-gisc/common/utils/ui';

import { BaseAdminListComponent } from '../../base-admin-list/base-admin-list.component';
import { DashboardPeopleComponent, DashboardPerson, PERSON_TYPE_COLUMNS } from '../shared/dashboard-people/dashboard-people.component';
import {
  DashboardRowDetailDirective,
  DashboardTableColumn,
  DashboardTableComponent,
  DashboardTableRow
} from '../shared/dashboard-table/dashboard-table.component';

/** The share of RSVPs who checked in, or null where nobody RSVP'd. */
const share = (rsvps: number, showedUp: number) => (rsvps > 0 ? showedUp / rsvps : null);

/**
 * The table's columns: each event's RSVPs, the share of them who checked in, walk-ins, check-ins outside the time,
 * then who checked in by person type. The total row's show-up rate is worked out from the totals, not added up.
 */
export const CHECK_IN_COLUMNS: Array<DashboardTableColumn> = [
  { key: 'rsvps', label: 'RSVPs' },
  {
    key: 'showUpRate',
    label: 'Show-up rate',
    format: 'percent',
    total: (rows) => share(sum(rows, 'rsvps'), sum(rows, 'showedUp'))
  },
  { key: 'walkIns', label: 'Walk-ins' },
  { key: 'outside', label: 'Outside session time' },
  ...PERSON_TYPE_COLUMNS
];

function sum(rows: Array<DashboardTableRow>, key: string): number {
  return rows.reduce((total, row) => total + (row.counts[key] ?? 0), 0);
}

/** The table's rows: each event, its check-ins as its total, and its counts. `showedUp` is kept for the total row. */
export function checkInRows(events: Array<CheckInDashboardEvent>): Array<DashboardTableRow> {
  return events.map((e) => ({
    key: e.guid,
    name: e.name ?? 'Untitled event',
    note: e.location,
    when: e.starts,
    total: e.checkIns,
    counts: {
      rsvps: e.rsvps,
      showedUp: e.showedUp,
      showUpRate: share(e.rsvps, e.showedUp),
      walkIns: e.walkIns,
      outside: e.outside,
      ...e.counts
    }
  }));
}

/**
 * The chart: check-ins by hour across the week (decided on #2893: they happen only that week), each hour's as columns
 * and the running total as a line, with the opened event's own running total beside it.
 */
export function checkInChart(dashboard: CheckInDashboard, expanded: CheckInDashboardEvent | null): { series: Array<ChartSeries>; hourly: ChartSeries } {
  const runningTotal = (times: Array<string>) => {
    let total = 0;

    return countsByHour(times).map((p) => ({ x: p.x, y: (total += p.y) }));
  };
  const all = dashboard.made.map((m) => m.created);
  const series: Array<ChartSeries> = [{ label: 'All events', points: runningTotal(all) }];

  if (expanded) {
    series.push({ label: expanded.name ?? 'This event', points: runningTotal(dashboard.made.filter((m) => m.event === expanded.guid).map((m) => m.created)) });
  }

  return { series, hourly: { label: 'Checked in that hour', points: countsByHour(all) } };
}

/** A person as the shared list shows them, with a note saying if they came without an RSVP or outside the time. */
export function checkInPerson(person: CheckInDashboardPerson): DashboardPerson {
  const note = [person.walkIn ? 'Walk-in, no RSVP' : null, person.outsideSessionTime ? 'Outside session time' : null].filter(Boolean).join('; ');

  return { ...person, note: note || null };
}

/** An event's CSV file name: gisday-checkins-<name>-<day>. */
export function checkInFileName(event: CheckInDashboardEvent): string {
  const name = [fileNamePart(event.name ?? 'event'), event.starts ? dayIn(new Date(event.starts), 'America/Chicago') : null].filter(Boolean).join('-');

  return `gisday-checkins-${name}`;
}

/**
 * The Check-ins dashboard (#2893): each event's RSVPs against who checked in, them by person type, check-ins by hour
 * across the week, and, one event at a time, who checked in. It also does #2879, check-ins next to RSVPs.
 */
@Component({
  selector: 'tamu-gisc-check-in-dashboard',
  templateUrl: './check-in-dashboard.component.html',
  styleUrls: ['./check-in-dashboard.component.scss'],
  imports: [SelectComponent, LineChartComponent, DashboardTableComponent, DashboardRowDetailDirective, DashboardPeopleComponent, AsyncPipe]
})
export class CheckInDashboardComponent extends BaseAdminListComponent<CheckIn> implements OnInit {
  protected readonly entityService = inject(CheckinService);
  private readonly destroyRef = inject(DestroyRef);

  public readonly columns = CHECK_IN_COLUMNS;

  public readonly dashboard = signal<CheckInDashboard | null>(null);
  public readonly failed = signal(false);

  public readonly expanded = signal<string | null>(null);
  public readonly people = signal<Array<DashboardPerson> | null>(null);
  public readonly peopleFailed = signal(false);

  public readonly rows = computed(() => checkInRows(this.dashboard()?.events ?? []));
  public readonly expandedEvent = computed(() => this.dashboard()?.events.find((e) => e.guid === this.expanded()) ?? null);
  public readonly totals = computed(() => {
    const events = this.dashboard()?.events ?? [];

    return {
      checkIns: events.reduce((n, e) => n + e.checkIns, 0),
      walkIns: events.reduce((n, e) => n + e.walkIns, 0),
      showUpRate: share(
        events.reduce((n, e) => n + e.rsvps, 0),
        events.reduce((n, e) => n + e.showedUp, 0)
      )
    };
  });
  public readonly chart = computed(() => {
    const dashboard = this.dashboard();

    return dashboard ? checkInChart(dashboard, this.expandedEvent()) : { series: [], hourly: null };
  });
  public readonly fileName = computed(() => {
    const event = this.expandedEvent();

    return event ? checkInFileName(event) : 'gisday-checkins';
  });

  public override ngOnInit(): void {
    super.ngOnInit();

    this.selectedSeason$
      .pipe(
        filter((season) => Boolean(season?.guid)),
        tap(() => {
          this.dashboard.set(null);
          this.failed.set(false);
          this.collapse();
        }),
        switchMap((season) =>
          this.entityService.getDashboardForSeason(season.guid).pipe(
            catchError(() => {
              this.failed.set(true);

              return of(null);
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((dashboard) => this.dashboard.set(dashboard));
  }

  /** Reads the people of the event the table opened, or forgets them when it closes. */
  public toggle(key: string | null) {
    if (!key) {
      this.collapse();

      return;
    }

    this.expanded.set(key);
    this.people.set(null);
    this.peopleFailed.set(false);

    this.entityService.getDashboardForEvent(key).subscribe({
      next: (people) => {
        if (this.expanded() === key) {
          this.people.set(people.map(checkInPerson));
        }
      },
      error: () => {
        if (this.expanded() === key) {
          this.peopleFailed.set(true);
        }
      }
    });
  }

  public collapse() {
    this.expanded.set(null);
    this.people.set(null);
    this.peopleFailed.set(false);
  }
}
