import type { PGlite } from "@electric-sql/pglite"
import { authSchemaSql } from "./db-schema-auth"
import { customerSchemaSql } from "./db-schema-customer"
import { operationsSchemaSql } from "./db-schema-operations"
import { travelSchemaSql } from "./db-schema-travel"

export async function initSchema(db: PGlite): Promise<void> {
  for (const sql of [authSchemaSql(Date.now()), operationsSchemaSql, travelSchemaSql, customerSchemaSql]) {
    await db.exec(sql)
  }
}
