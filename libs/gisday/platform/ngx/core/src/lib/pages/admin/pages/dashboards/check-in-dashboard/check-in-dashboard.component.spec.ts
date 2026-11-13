import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import type { CheckInDashboard, CheckInDashboardPerson } from '@tamu-gisc/gisday/platform/data-api';
import { CheckinService, SeasonService } from '@tamu-gisc/gisday/platform/ngx/data-access';
import { ModalService } from '@tamu-gisc/ui-kits/ngx/layout/modal';
import { NotificationService } from '@tamu-gisc/common/ngx/ui/notification';
import { LINE_CHART_DRAWER, LineChartOptions } from '@tamu-gisc/ui-kits/ngx/charts';

import { CheckInDashboardComponent, checkInChart, checkInFileName, checkInPerson, checkInRows, CHECK_IN_COLUMNS } from './check-in-dashboard.component';

const counts = (c: Partial<CheckInDashboard['events'][0]['counts']>) => ({
  undergraduate: 0,
  graduate: 0,
  student: 0,
  academia: 0,
  industry: 0,
  'not-given': 0,
  ...c
});

const dashboard: CheckInDashboard = {
  events: [
    { guid: 'e-1', name: 'Workshop', starts: '2026-11-18T15:00:00.000Z', location: 'ILCB 111', rsvps: 4, checkIns: 4, showedUp: 3, walkIns: 1, outside: 1, counts: counts({ undergraduate: 3, industry: 1 }) },
    { guid: 'e-2', name: 'Keynote', starts: '2026-11-18T20:00:00.000Z', location: null, rsvps: 0, checkIns: 1, showedUp: 0, walkIns: 1, outside: 0, counts: counts({ academia: 1 }) }
  ],
  made: [
    { event: 'e-1', created: '2026-11-18T15:05:00Z' },
    { event: 'e-1', created: '2026-11-18T15:20:00Z' },
    { event: 'e-1', created: '2026-11-18T16:10:00Z' },
    { event: 'e-1', created: '2026-11-18T16:12:00Z' },
    { event: 'e-2', created: '2026-11-18T20:02:00Z' }
  ],
  unreadAccounts: 0
};

const person = (p: Partial<CheckInDashboardPerson>): CheckInDashboardPerson => ({
  firstName: 'Ana',
  lastName: 'Lee',
  email: 'ana@example.edu',
  type: 'undergraduate',
  classification: 'Junior',
  department: null,
  position: null,
  organization: null,
  created: '2026-11-18T15:05:00.000Z',
  walkIn: false,
  outsideSessionTime: false,
  ...p
});

describe('checkInRows()', () => {
  it("gives the table each event, its check-ins as its total, and its RSVPs, show-up rate, walk-ins and types", () => {
    const [workshop, keynote] = checkInRows(dashboard.events);

    expect(workshop.total).toBe(4);
    expect(workshop.counts).toMatchObject({ rsvps: 4, showUpRate: 0.75, walkIns: 1, outside: 1, undergraduate: 3, industry: 1 });
    // Nobody RSVP'd for the keynote, so it has no show-up rate rather than 0%.
    expect(keynote.counts['showUpRate']).toBeNull();
  });
});

describe('CHECK_IN_COLUMNS', () => {
  it("works out the total row's show-up rate from the totals, not by adding the rates", () => {
    const rate = CHECK_IN_COLUMNS.find((c) => c.key === 'showUpRate');

    expect(rate.format).toBe('percent');
    expect(rate.total(checkInRows(dashboard.events))).toBe(0.75);
  });
});

describe('checkInChart()', () => {
  it("charts each hour's check-ins and their running total, with an opened event's own beside it", () => {
    const { series, hourly } = checkInChart(dashboard, dashboard.events[0]);

    // 9 AM, 10 AM and 2 PM Central.
    expect(hourly.points.map((p) => [p.x.toISOString().slice(11, 13), p.y])).toEqual([
      ['09', 2],
      ['10', 2],
      ['14', 1]
    ]);
    expect(series.map((s) => [s.label, s.points.map((p) => p.y)])).toEqual([
      ['All events', [2, 4, 5]],
      ['Workshop', [2, 4]]
    ]);
  });
});

describe('checkInPerson() and checkInFileName()', () => {
  it('notes a walk-in and a check-in outside the time, and nothing for anyone else', () => {
    expect(checkInPerson(person({})).note).toBeNull();
    expect(checkInPerson(person({ walkIn: true, outsideSessionTime: true })).note).toBe('Walk-in, no RSVP; Outside session time');
  });

  it("names an event's CSV by its name and day", () => {
    expect(checkInFileName(dashboard.events[0])).toBe('gisday-checkins-workshop-2026-11-18');
  });
});

describe('CheckInDashboardComponent', () => {
  let checkins: { getDashboardForSeason: jest.Mock; getDashboardForEvent: jest.Mock };
  let drawn: Array<LineChartOptions>;

  function open() {
    TestBed.configureTestingModule({
      imports: [CheckInDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: CheckinService, useValue: checkins },
        { provide: SeasonService, useValue: { seasons$: of([{ guid: 's-1', year: 2026 }]), activeSeason$: of({ guid: 's-1', year: 2026 }) } },
        { provide: ModalService, useValue: {} },
        { provide: NotificationService, useValue: {} },
        { provide: LINE_CHART_DRAWER, useValue: (_host: HTMLElement, options: LineChartOptions) => (drawn.push(options), Promise.resolve(() => undefined)) }
      ]
    });

    return TestBed.createComponent(CheckInDashboardComponent);
  }

  async function settle(fixture: ReturnType<typeof open>) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    drawn = [];
    checkins = {
      getDashboardForSeason: jest.fn(() => of(dashboard)),
      getDashboardForEvent: jest.fn(() => of([person({}), person({ firstName: 'Sam', lastName: 'Ortiz', type: 'industry', walkIn: true })]))
    };
  });

  it('says how many checked in, how many without an RSVP, and the share of RSVPs who came', async () => {
    const fixture = open();
    await settle(fixture);
    const summary = (fixture.nativeElement as HTMLElement).querySelector('.dashboard-summary').textContent.replace(/\s+/g, ' ');

    expect(checkins.getDashboardForSeason).toHaveBeenCalledWith('s-1');
    expect(summary).toContain('5 check-ins at 2 events, 2 of them without an RSVP.');
    expect(summary).toContain('75% of RSVPs checked in.');
  });

  it("heads its columns, totals them with the show-up rate worked out, and charts by hour", async () => {
    const fixture = open();
    await settle(fixture);
    const root = fixture.nativeElement as HTMLElement;

    expect(Array.from(root.querySelectorAll('.datatable-header-cell-label')).map((h) => h.textContent.trim()).slice(0, 7)).toEqual([
      'Event',
      'When',
      'Checked in',
      'RSVPs',
      'Show-up rate',
      'Walk-ins',
      'Outside session time'
    ]);
    expect(Array.from(root.querySelectorAll('datatable-summary-row .datatable-body-cell')).map((c) => c.textContent.trim()).slice(0, 7)).toEqual([
      'All events',
      '',
      '5',
      '4',
      '75%',
      '2',
      '1'
    ]);
    expect(drawn[drawn.length - 1].interval).toBe('hour');
  });

  it('opens an event to list who checked in, with a note for a walk-in', async () => {
    const fixture = open();
    await settle(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const cell = Array.from(root.querySelectorAll('datatable-row-wrapper .datatable-body-cell')).find((c) => c.textContent.includes('Workshop')) as HTMLElement;

    cell.click();
    await settle(fixture);

    expect(checkins.getDashboardForEvent).toHaveBeenCalledWith('e-1');
    expect(root.querySelector('tamu-gisc-dashboard-people').textContent).toContain('Walk-in, no RSVP');
    expect(drawn[drawn.length - 1].series.map((s) => s.label)).toEqual(['All events', 'Workshop']);
  });

  it('says the check-ins could not be read rather than showing an empty dashboard', async () => {
    checkins.getDashboardForSeason = jest.fn(() => throwError(() => new Error('403')));
    const fixture = open();
    await settle(fixture);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('The check-ins could not be read');
  });
});
