import { type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { EItemType } from "@/types/components";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");

  if (!query) {
    return Response.json({ error: "Provide a query term." }, { status: 400 });
  }

  const [areas] = await Promise.all([
    prisma.area.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      take: 10,
    }),
  ]);

  const results = [
    ...areas.map((area) => ({ ...area, type: EItemType["area"] })),
  ].sort((a, b) => ((a.name || "") < (b.name || "") ? -1 : 1)); // a.name || "" exists because the name can be null
  return Response.json(results);
}
