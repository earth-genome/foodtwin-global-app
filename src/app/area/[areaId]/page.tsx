const AreaPage = ({
  params,
}: {
  params: {
    areaId: string;
  };
}) => {
  return (
    <div className="overflow-y-auto w-128 p-4 space-y-4">
      This is area page for {params.areaId}
    </div>
  );
};

export default AreaPage;
