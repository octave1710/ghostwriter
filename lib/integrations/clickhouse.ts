// ClickHouse Cloud — store narrative_control time series.
// Schema:
//   CREATE TABLE narrative_control (
//     brand String, query String, ts DateTime,
//     cited UInt8, source_owned UInt8, run_id String
//   ) ENGINE = MergeTree ORDER BY (brand, ts);

import { createClient, type ClickHouseClient } from '@clickhouse/client';

let _client: ClickHouseClient | null = null;

export function getClient(): ClickHouseClient {
  if (_client) return _client;
  _client = createClient({
    url: process.env.CLICKHOUSE_HOST,
    username: process.env.CLICKHOUSE_USER || 'default',
    password: process.env.CLICKHOUSE_PASSWORD,
    database: process.env.CLICKHOUSE_DB || 'default',
  });
  return _client;
}

export type NarrativeRow = {
  brand: string;
  query: string;
  ts: string; // ISO datetime
  cited: 0 | 1;
  source_owned: 0 | 1;
  run_id: string;
};

export async function insertRows(rows: NarrativeRow[]): Promise<void> {
  if (!process.env.CLICKHOUSE_HOST) return;
  const client = getClient();
  await client.insert({
    table: 'narrative_control',
    values: rows,
    format: 'JSONEachRow',
  });
}

export async function getNarrativeControl(brand: string): Promise<{ run_id: string; owned_ratio: number; ts: string }[]> {
  if (!process.env.CLICKHOUSE_HOST) return [];
  const client = getClient();
  const result = await client.query({
    query: `
      SELECT
        run_id,
        sum(source_owned) / count() AS owned_ratio,
        max(ts) AS ts
      FROM narrative_control
      WHERE brand = {brand:String}
      GROUP BY run_id
      ORDER BY ts ASC
    `,
    query_params: { brand },
    format: 'JSONEachRow',
  });
  return result.json();
}

export async function ensureTable(): Promise<void> {
  if (!process.env.CLICKHOUSE_HOST) return;
  const client = getClient();
  await client.command({
    query: `
      CREATE TABLE IF NOT EXISTS narrative_control (
        brand String,
        query String,
        ts DateTime,
        cited UInt8,
        source_owned UInt8,
        run_id String
      ) ENGINE = MergeTree ORDER BY (brand, ts)
    `,
  });
}
