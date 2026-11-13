import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type { Auth0UserProfile, ManagementService } from '@tamu-gisc/common/nest/auth';

import { CheckIn, Event, Organization, University, UserRsvp } from '../entities/all.entity';
import { queryCheckingDataSource, queryCheckingRepository } from '../_base/query-checking-data-source';
import { DashboardProfilesService } from '../dashboards/dashboard-profiles.service';
import { CheckInDashboardProvider } from './check-in-dashboard.provider';
import { showUpRate } from './dto/check-in-dashboard.dto';

const profiles: Record<string, Auth0UserProfile> = {
  'auth0|ug': {
    user_info: { given_name: 'Ana', family_name: 'Lee', email: 'ana@example.edu' },
    app_metadata: { gisday: { attendeeType: 'student' } },
    user_metadata: { education: { classification: 'Junior' } }
  } as unknown as Auth0UserProfile,
  'auth0|prof': { app_metadata: { gisday: { attendeeType: 'academia' } } } as unknown as Auth0UserProfile,
  'auth0|esri': { app_metadata: { gisday: { attendeeType: 'industry' } } } as unknown as Auth0UserProfile
};

const management = () =>
  ({
    getUsersByIds: jest.fn(async (accounts: Array<string>) => new Map(accounts.filter((a) => profiles[a]).map((a) => [a, profiles[a]])))
  }) as unknown as ManagementService & { getUsersByIds: jest.Mock };

const checkIn = (account: string, event: string, created: string, outsideSessionTime = false) =>
  ({ accountGuid: account, event: { guid: event }, created: new Date(created), outsideSessionTime }) as CheckIn;
const rsvp = (account: string, event: string) => ({ accountGuid: account, event: { guid: event } }) as UserRsvp;

describe('CheckInDashboardProvider (#2893)', () => {
  let dataSource: DataSource;
  let provider: CheckInDashboardProvider;
  let checkInRepo: ReturnType<typeof queryCheckingRepository<CheckIn>>;
  let rsvpRepo: ReturnType<typeof queryCheckingRepository<UserRsvp>>;
  let eventRepo: ReturnType<typeof queryCheckingRepository<Event>>;

  beforeAll(async () => {
    dataSource = await queryCheckingDataSource();
  });

  beforeEach(() => {
    checkInRepo = queryCheckingRepository(dataSource, CheckIn);
    rsvpRepo = queryCheckingRepository(dataSource, UserRsvp);
    eventRepo = queryCheckingRepository(dataSource, Event);

    // Each query is still built by typeorm against the real entities, which is what is checked; the rows are given.
    const stub = <T>(repo: { find: (o: unknown) => Promise<Array<T>>; findOne?: unknown }, rows: Array<T>) => {
      const find = repo.find;
      repo.find = async (options) => {
        await find.call(repo, options);

        return rows;
      };
    };

    stub(eventRepo, [
      { guid: 'e-1', name: 'Workshop', startTime: '09:00:00 GMT-0600 (Central Standard Time)', day: { date: new Date('2026-11-18T06:00:00Z') } },
      { guid: 'e-2', name: 'Keynote', startTime: '15:00:00 GMT-0600 (Central Standard Time)', day: { date: new Date('2026-11-18T06:00:00Z') } }
    ] as Array<Event>);
    stub(checkInRepo, [
      checkIn('auth0|ug', 'e-1', '2026-11-18T15:05:00Z'),
      checkIn('auth0|esri', 'e-1', '2026-11-18T15:10:00Z', true),
      checkIn('auth0|gone', 'e-1', '2026-11-18T15:20:00Z')
    ]);
    stub(rsvpRepo, [rsvp('auth0|ug', 'e-1'), rsvp('auth0|prof', 'e-1'), rsvp('auth0|ug', 'e-2')]);

    provider = new CheckInDashboardProvider(
      checkInRepo,
      rsvpRepo,
      eventRepo,
      new DashboardProfilesService(queryCheckingRepository(dataSource, University), queryCheckingRepository(dataSource, Organization), management())
    );
  });

  it("counts each event's RSVPs, check-ins, those who had RSVP'd, walk-ins and check-ins outside the time", async () => {
    const dashboard = await provider.getSeason('s-1');

    expect(dashboard.events.map((e) => [e.name, e.rsvps, e.checkIns, e.showedUp, e.walkIns, e.outside])).toEqual([
      ['Workshop', 2, 3, 1, 2, 1],
      ['Keynote', 1, 0, 0, 0, 0]
    ]);
  });

  it('counts who checked in by person type, an unread account as Not given, and says how many were unread', async () => {
    const dashboard = await provider.getSeason('s-1');

    expect(dashboard.events[0].counts).toMatchObject({ undergraduate: 1, industry: 1, 'not-given': 1 });
    expect(dashboard.unreadAccounts).toBe(1);
  });

  it('gives when each check-in was made, for the chart, and carries no names', async () => {
    const dashboard = await provider.getSeason('s-1');

    expect(dashboard.made).toEqual([
      { event: 'e-1', created: '2026-11-18T15:05:00.000Z' },
      { event: 'e-1', created: '2026-11-18T15:10:00.000Z' },
      { event: 'e-1', created: '2026-11-18T15:20:00.000Z' }
    ]);
    expect(JSON.stringify(dashboard)).not.toContain('ana@example.edu');
  });

  describe('.getEvent()', () => {
    beforeEach(() => {
      const findOne = eventRepo.findOne;
      eventRepo.findOne = async (options) => {
        await findOne.call(eventRepo, options);

        return (options.where as { guid: string }).guid === 'missing' ? null : ({ guid: 'e-1' } as Event);
      };
    });

    it("lists who checked in, earliest first, marking walk-ins and check-ins outside the session's time", async () => {
      const people = await provider.getEvent('e-1');

      expect(people.map((p) => [p.firstName, p.type, p.walkIn, p.outsideSessionTime])).toEqual([
        ['Ana', 'undergraduate', false, false],
        [null, 'industry', true, true],
        [null, 'not-given', true, false]
      ]);
    });

    it('answers 404 for an event that does not exist', async () => {
      await expect(provider.getEvent('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});

describe('showUpRate()', () => {
  it("is the share of an event's RSVPs who checked in, and nothing for an event nobody RSVP'd for", () => {
    expect(showUpRate(4, 3)).toBe(0.75);
    expect(showUpRate(0, 2)).toBeNull();
  });
});
