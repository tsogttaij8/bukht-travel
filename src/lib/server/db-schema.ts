import type { PGlite } from "@electric-sql/pglite"
import { authSchemaSql } from "./db-schema-auth"
import { commerceSchemaSql } from "./db-schema-commerce"
import { customerSchemaSql } from "./db-schema-customer"
import { operationsSchemaSql } from "./db-schema-operations"
import { travelSchemaSql } from "./db-schema-travel"

export async function initSchema(db: PGlite): Promise<void> {
  for (const sql of [authSchemaSql(Date.now()), operationsSchemaSql, commerceSchemaSql, travelSchemaSql, customerSchemaSql]) {
    await db.exec(sql)
  }
}
