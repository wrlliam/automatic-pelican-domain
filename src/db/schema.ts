import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";

export const node = sqliteTable("node", {
  id: integer().primaryKey({ autoIncrement: true }),
  rgs: text(),
  previous_name: text(),
  domain: text(),
  allocation: text(),
});
