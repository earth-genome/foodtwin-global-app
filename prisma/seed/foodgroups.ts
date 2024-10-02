import { execa } from "execa";
import { PrismaClient } from "@prisma/client";
import { log } from "./utils";
import { FOOD_GROUPS_LIST_FILE, POSTGRES_CONNECTION_STRING } from "./config";

export const ingestFoodGroups = async (prisma: PrismaClient) => {
  await prisma.$executeRaw`TRUNCATE "FoodGroup" RESTART IDENTITY CASCADE`;

  await prisma.$executeRaw`DROP TABLE IF EXISTS "food_groups_temp"`;
  await prisma.$executeRaw`
    CREATE TABLE "food_groups_temp" (
      id SERIAL PRIMARY KEY,
      food_group TEXT,
      food_subgroup TEXT
    )
  `;
  const copyCommand = `\\copy food_groups_temp (food_group, food_subgroup) FROM '${FOOD_GROUPS_LIST_FILE}' DELIMITER ',' CSV HEADER;`;
  await execa(`psql -d ${POSTGRES_CONNECTION_STRING} -c "${copyCommand}"`, {
    shell: true,
  });

  // Insert level 0 food groups
  await prisma.$executeRaw`
    INSERT INTO "FoodGroup" (name, level)
    SELECT DISTINCT food_group, 0
    FROM "food_groups_temp"
  `;

  // Insert level 1 food subgroups
  await prisma.$executeRaw`
    INSERT INTO "FoodGroup" (name, level, \"parentId\")
    SELECT DISTINCT food_subgroup, 1, fg.id
    FROM "food_groups_temp" fgt
    JOIN "FoodGroup"  fg ON fg.name = fgt.food_group
  `;

  await prisma.$executeRaw`
    UPDATE "FoodGroup"
    SET "slug" = LOWER(REPLACE(name, ' ', '_'))
  `;

  await prisma.$executeRaw`DROP TABLE IF EXISTS "food_groups_temp"`;
  log(`Ingested food groups and subgroups.`);
};
