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
      foodgroup1_code TEXT,
      foodgroup1 TEXT,
      foodgroup2 TEXT,
      foodgroup2_code TEXT,
      foodgroup3 TEXT
    )
  `;
  const copyCommand = `\\copy food_groups_temp (foodgroup1_code,foodgroup1,foodgroup2,foodgroup2_code,foodgroup3) FROM '${FOOD_GROUPS_LIST_FILE}' DELIMITER ',' CSV HEADER;`;
  await execa(`psql -d ${POSTGRES_CONNECTION_STRING} -c "${copyCommand}"`, {
    shell: true,
  });

  // Level 3
  await prisma.$executeRaw`
    INSERT INTO "FoodGroup" (name, level)
    SELECT DISTINCT foodgroup3, 3
    FROM "food_groups_temp"
  `;

  // Level 2
  await prisma.$executeRaw`
    INSERT INTO "FoodGroup" (name, level, \"parentId\")
    SELECT DISTINCT foodgroup2, 2, fg.id
    FROM "food_groups_temp" fgt
    JOIN "FoodGroup"  fg ON fg.name = fgt.foodgroup3
  `;

  // Level 1
  await prisma.$executeRaw`
    INSERT INTO "FoodGroup" (name, level, "parentId")
    SELECT DISTINCT fgt.foodgroup1, 1, fg.id
    FROM "food_groups_temp" fgt
    JOIN "FoodGroup" fg ON fg.name = fgt.foodgroup2 AND fg.level = 2;
  `;

  await prisma.$executeRaw`
    UPDATE "FoodGroup"
    SET "slug" = REGEXP_REPLACE(
      REGEXP_REPLACE(
        LOWER(
          REGEXP_REPLACE(name, '[^a-zA-Z0-9\\s-]', '', 'g')
        ),
        '\\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  `;

  await prisma.$executeRaw`DROP TABLE IF EXISTS "food_groups_temp"`;
  log(`Ingested food groups and subgroups.`);
};
