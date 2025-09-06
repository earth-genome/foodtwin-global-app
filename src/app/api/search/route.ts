import { type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { EItemType } from "@/types/components";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");

  if (!query) {
    return Response.json({ error: "Provide a query term." }, { status: 400 });
  }

  // Normal Prisma query (contains, insensitive)
  const normalAreasPromise = prisma.area.findMany({
    where: {
      name: {
        contains: query,
        mode: "insensitive",
      },
    },
    take: 10,
  });

  const similarityAreasPromise = prisma.$queryRaw`
    SELECT *, similarity(name, ${query}) AS sim
    FROM "area"
    WHERE similarity(name, ${query}) > 0.3
    ORDER BY sim DESC, name
    LIMIT 10
  `;

  const [normalAreas, similarityAreasRaw] = await Promise.all([
    normalAreasPromise,
    similarityAreasPromise,
  ]);
  const similarityAreas = similarityAreasRaw as any[];

  const areaMap = new Map();
  for (const area of normalAreas) {
    areaMap.set(area.id, area);
  }
  for (const area of similarityAreas) {
    areaMap.set(area.id, area);
  }
  const areas = Array.from(areaMap.values());

  const results = [
    ...areas.map((area) => ({ ...area, type: EItemType["area"] })),
  ].sort((a, b) => ((a.name || "") < (b.name || "") ? -1 : 1)); // a.name || "" exists because the name can be null
  return Response.json(results);
}
