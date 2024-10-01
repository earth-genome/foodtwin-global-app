interface ILegendItem {
  color: string;
  label: string;
}

function LegendItem({ color, label }: ILegendItem) {
  return (
    <div className="flex gap-2 items-center">
      <span className={`w-2 h-2 bg-${color} rounded`} />
      <span>{label}</span>
    </div>
  );
}

function Legend() {
  return (
    <div className="absolute bottom-4 left-[50%] translate-x-[-50%] z-50 bg-neutral-100/60 rounded text-xs backdrop-blur">
      <div className="px-4 py-2 bg-neutral-200/80 font-header text-xxs uppercase rounded-t">
        <h2>Legend</h2>
      </div>
      <div className="flex text-neutral-600 items-center">
        <div className="p-4 border-r border-neutral-300">
          <h3 className="mb-2 font-bold">Categories</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <LegendItem color="neutral-900" label="Dairy and Eggs" />
            <LegendItem color="neutral-900" label="Oils and Oilseed" />
            <LegendItem color="neutral-900" label="Starches" />
            <LegendItem color="neutral-900" label="Fruits" />
            <LegendItem color="neutral-900" label="Grains" />
            <LegendItem color="neutral-900" label="Pulses" />
            <LegendItem color="neutral-900" label="Vegetables" />
            <LegendItem color="neutral-900" label="Treenuts" />
            <LegendItem color="neutral-900" label="Meet and Fish" />
            <LegendItem color="neutral-900" label="Others" />
          </div>
        </div>
        <div className="p-4">
          <h3 className="mb-2 font-bold">Calories production</h3>
          <div className="flex gap-4 items-center">
            <span>Low</span>
            <span className="border border-neutral-400 w-[4px] h-[4px] rounded-[2px]" />
            <span className="border border-neutral-400 w-[8px] h-[8px] rounded-[4px]" />
            <span className="border border-neutral-400 w-[12px] h-[12px] rounded-[6px]" />
            <span className="border border-neutral-400 w-[16px] h-[16px] rounded-[8px]" />
            <span className="border border-neutral-400 w-[20px] h-[20px] rounded-[10px]" />
            <span>High</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Legend;
