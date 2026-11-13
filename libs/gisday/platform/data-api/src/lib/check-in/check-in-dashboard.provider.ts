import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { emptyCounts, sessionTime } from '@tamu-gisc/gisday/common';

import { CheckIn, Event, UserRsvp } from '../entities/all.entity';
import { DashboardProfilesService } from '../dashboards/dashboard-profiles.service';
import { personOf, personTypeOf } from '../user-rsvp/dto/rsvp-dashboard.dto';
import { CheckInDashboard, CheckInDashboardPerson } from './dto/check-in-dashboard.dto';

/**
 * The admin Check-ins dashboard (#2893): each event's RSVPs against who checked in, them by person type, when each
 * check-in was made, and an event's people. A check-in keeps only its account id, so the type and the name come from
 * that account's Auth0 profile, read as every dashboard reads them (DashboardProfilesService).
 */
@Injectable()
export class CheckInDashboardProvider {
  constructor(
    @InjectRepository(CheckIn) private readonly checkInRepo: Repository<CheckIn>,
    @InjectRepository(UserRsvp) private readonly rsvpRepo: Repository<UserRsvp>,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    private readonly people: DashboardProfilesService
  ) {}

  /** Every event in the season, with its RSVPs and check-ins, and when each check-in was made. */
  public async getSeason(seasonGuid: string): Promise<CheckInDashboard> {
    const [events, checkIns, rsvps] = await Promise.all([
      this.eventRepo.find({ where: { season: { guid: seasonGuid } }, relations: { day: true, location: true } }),
      this.checkInRepo.find({ where: { event: { season: { guid: seasonGuid } } }, relations: { event: true }, order: { created: 'ASC' } }),
      this.rsvpRepo.find({ where: { event: { season: { guid: seasonGuid } } }, relations: { event: true } })
    ]);

    const rsvpd = rsvpSets(rsvps);
    const profiles = await this.people.profilesOf(checkIns.map((c) => c.accountGuid));
    const byEvent = new Map(
      events.map((e) => [e.guid, { rsvps: rsvpd.get(e.guid)?.size ?? 0, checkIns: 0, showedUp: 0, walkIns: 0, outside: 0, counts: emptyCounts() }])
    );

    for (const checkIn of checkIns) {
      const row = byEvent.get(checkIn.event?.guid);

      if (!row) {
        continue;
      }

      row.checkIns++;
      row.counts[personTypeOf(profiles.get(checkIn.accountGuid))]++;

      if (rsvpd.get(checkIn.event.guid)?.has(checkIn.accountGuid)) {
        row.showedUp++;
      } else {
        row.walkIns++;
      }

      if (checkIn.outsideSessionTime) {
        row.outside++;
      }
    }

    return {
      events: events
        .map((e) => ({
          guid: e.guid,
          name: e.name ?? null,
          starts: sessionTime(e.day?.date, e.startTime)?.toISOString() ?? null,
          location: [e.location?.building, e.location?.room].filter(Boolean).join(' ') || null,
          ...byEvent.get(e.guid)
        }))
        // In the order they happen; an event with no time last.
        .sort((a, b) => (a.starts ?? '￿').localeCompare(b.starts ?? '￿')),
      made: checkIns
        .filter((c) => byEvent.has(c.event?.guid))
        .map((c) => ({ event: c.event.guid, created: new Date(c.created).toISOString() })),
      unreadAccounts: [...new Set(checkIns.map((c) => c.accountGuid))].filter((a) => profiles.get(a) === null).length
    };
  }

  /** The people who checked in to one event, earliest first, each marked if they had not RSVP'd or came outside the time. */
  public async getEvent(eventGuid: string): Promise<Array<CheckInDashboardPerson>> {
    const event = await this.eventRepo.findOne({ where: { guid: eventGuid } });

    if (!event) {
      throw new NotFoundException('Event could not be found');
    }

    const [checkIns, rsvps] = await Promise.all([
      this.checkInRepo.find({ where: { event: { guid: eventGuid } }, order: { created: 'ASC' } }),
      this.rsvpRepo.find({ where: { event: { guid: eventGuid } } })
    ]);
    const rsvpd = new Set(rsvps.map((r) => r.accountGuid));
    const [profiles, organizations] = await Promise.all([
      this.people.profilesOf(checkIns.map((c) => c.accountGuid)),
      this.people.organizationNames()
    ]);

    return checkIns.map((c) => ({
      ...personOf(profiles.get(c.accountGuid), c.created, organizations),
      walkIn: !rsvpd.has(c.accountGuid),
      outsideSessionTime: Boolean(c.outsideSessionTime)
    }));
  }
}

/** Each event's RSVP'd accounts. */
function rsvpSets(rsvps: Array<UserRsvp>): Map<string, Set<string>> {
  const sets = new Map<string, Set<string>>();

  for (const rsvp of rsvps) {
    const guid = rsvp.event?.guid;

    if (guid) {
      sets.set(guid, (sets.get(guid) ?? new Set()).add(rsvp.accountGuid));
    }
  }

  return sets;
}
