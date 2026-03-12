module.exports = class Data1773311910395 {
    name = 'Data1773311910395'

    async up(db) {
        await db.query(`CREATE TABLE "market_info" ("id" character varying NOT NULL, "block" integer NOT NULL, "market_token" text NOT NULL, "index_token" text NOT NULL, "long_token" text NOT NULL, "short_token" text NOT NULL, CONSTRAINT "PK_b5c73bcd5128c538b622a6a665b" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_360a8234153660f78ddabafdf9" ON "market_info" ("block") `)
        await db.query(`CREATE INDEX "IDX_4ed3660968eabefeb4c4d2e908" ON "market_info" ("market_token") `)
        await db.query(`CREATE INDEX "IDX_5e8320318a53bafb3009a55e92" ON "market_info" ("index_token") `)
        await db.query(`CREATE TABLE "market_token_transfer" ("id" character varying NOT NULL, "block" integer NOT NULL, "from" text NOT NULL, "to" text NOT NULL, "value" numeric NOT NULL, "txn_hash" text NOT NULL, "token_address" text NOT NULL, "factory_event" jsonb, CONSTRAINT "PK_6ba46a4b25822f732994798ff13" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_88f7d4a20880f4666705f77c14" ON "market_token_transfer" ("block") `)
        await db.query(`CREATE INDEX "IDX_506b185a1dac18d9d8a5f4e1f0" ON "market_token_transfer" ("from") `)
        await db.query(`CREATE INDEX "IDX_462ee2929aa7fc9cc0a0ed09e3" ON "market_token_transfer" ("to") `)
        await db.query(`CREATE INDEX "IDX_48969039af1e3473cf26d10ee2" ON "market_token_transfer" ("txn_hash") `)
        await db.query(`CREATE INDEX "IDX_16723fdadd2a92a82b8696175c" ON "market_token_transfer" ("token_address") `)
    }

    async down(db) {
        await db.query(`DROP TABLE "market_info"`)
        await db.query(`DROP INDEX "public"."IDX_360a8234153660f78ddabafdf9"`)
        await db.query(`DROP INDEX "public"."IDX_4ed3660968eabefeb4c4d2e908"`)
        await db.query(`DROP INDEX "public"."IDX_5e8320318a53bafb3009a55e92"`)
        await db.query(`DROP TABLE "market_token_transfer"`)
        await db.query(`DROP INDEX "public"."IDX_88f7d4a20880f4666705f77c14"`)
        await db.query(`DROP INDEX "public"."IDX_506b185a1dac18d9d8a5f4e1f0"`)
        await db.query(`DROP INDEX "public"."IDX_462ee2929aa7fc9cc0a0ed09e3"`)
        await db.query(`DROP INDEX "public"."IDX_48969039af1e3473cf26d10ee2"`)
        await db.query(`DROP INDEX "public"."IDX_16723fdadd2a92a82b8696175c"`)
    }
}
