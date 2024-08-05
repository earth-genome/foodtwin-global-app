import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import CloseButton from "./close-button";

const AreaPage = async ({
  params,
}: {
  params: {
    areaId: string;
  };
}) => {
  const area = await prisma.area.findUnique({
    where: {
      id: params.areaId,
    },
  });

  if (!area) {
    return redirect("/not-found");
  }

  return (
    <>
      <div className="overflow-y-auto w-128 p-4 space-y-4">
        This is area page for {area.name}
      </div>
      <CloseButton />
    </>
  );
};

export default AreaPage;
