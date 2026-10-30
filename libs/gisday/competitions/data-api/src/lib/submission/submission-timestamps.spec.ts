import { DataSource } from 'typeorm';

import { queryCheckingDataSource, recordWrites } from '@tamu-gisc/gisday/platform/data-api';

import { CompetitionSubmission, GISDAY_COMPETITIONS_ENTITIES } from '../entities/all.entities';
import { isInScoringWindow } from '../leaderboard/leaderboard.service';

// #2584: a submission's `created` is what the scoring window is compared with, so it must be the instant the submission was made.
// The database's own clock (getdate()) is Central on production and was stored as if it were UTC, which moved the 2026 window
// (opens 14 November 00:00 Central, closes 20 November 11:00 Central) 6 hours early.
describe('A competition submission is stamped with the instant it was made (#2584)', () => {
  const opens = new Date('2026-11-14T06:00:00Z');
  const closes = new Date('2026-11-20T17:00:00Z');
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await queryCheckingDataSource(GISDAY_COMPETITIONS_ENTITIES);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // The `created` the API gives a submission inserted at `now`, as the INSERT carries it to the database.
  const createdWhenInsertedAt = async (now: string): Promise<Date | undefined> => {
    jest.useFakeTimers({ now: new Date(now) });

    const { statements } = recordWrites(dataSource);
    const submission = dataSource.manager.create(CompetitionSubmission, { guid: 's-1', userGuid: 'auth0|ann', value: '{}' });

    await dataSource.manager.insert(CompetitionSubmission, submission);

    const insert = statements.find((s) => /INSERT INTO "?vgi_submissions"?\s*\(/i.test(s.sql));

    expect(insert).toBeDefined();

    return insert?.parameters
      .map((p) => (p && typeof p === 'object' && 'value' in p ? (p as { value: unknown }).value : p))
      .find((p): p is Date => p instanceof Date);
  };

  it('scores a submission made at 10:59 AM Central on 20 November 2026', async () => {
    const created = await createdWhenInsertedAt('2026-11-20T10:59:00-06:00');

    expect(created).toEqual(new Date('2026-11-20T16:59:00Z'));
    expect(isInScoringWindow(created as Date, opens, closes)).toBe(true);
  });

  it('does not score a submission made at 11:00 AM Central on 20 November 2026', async () => {
    const created = await createdWhenInsertedAt('2026-11-20T11:00:00-06:00');

    expect(created).toEqual(new Date('2026-11-20T17:00:00Z'));
    expect(isInScoringWindow(created as Date, opens, closes)).toBe(false);
  });

  it("declares the default of every competition table's created and updated columns as the database clock that carries an offset", () => {
    const columns = GISDAY_COMPETITIONS_ENTITIES.flatMap((entity) => dataSource.getMetadata(entity as never).columns).filter(
      (column) => column.isCreateDate || column.isUpdateDate
    );

    expect(columns.length).toBeGreaterThan(0);
    expect(columns.map((column) => `${(column.default as () => string)()}`.toLowerCase())).toEqual(
      columns.map(() => 'sysdatetimeoffset()')
    );
  });
});
