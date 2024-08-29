import PageHeader from "@/app/components/PageHeader";
import { EPageType } from "@/types/components";

export default function Components() {
  return (
    <div className="container mx-auto">
      <div className="w-[480px] mb-8">
        <PageHeader title="Black Sea Route" type={EPageType.route} />
      </div>

      <div className="w-[480px] mb-8">
        <PageHeader title="Baden-Württemberg, Germany" type={EPageType.area} />
      </div>

      <div className="w-[480px] mb-8">
        <PageHeader title="Rotterdam, The Netherlands" type={EPageType.node} />
      </div>
    </div>
  );
}
