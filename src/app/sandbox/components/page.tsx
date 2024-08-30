import PageHeader from "@/app/components/PageHeader";
import { PageSection, SectionHeader } from "@/app/components/PageSection";
import { EPageType } from "@/types/components";

export default function Components() {
  return (
    <div className="container mx-auto">
      <h1>Component Sandbox</h1>
      <h2>Page Headers</h2>

      <div className="w-[480px] mb-8">
        <PageHeader title="Black Sea Route" type={EPageType.route} />
      </div>

      <div className="w-[480px] mb-8">
        <PageHeader title="Baden-Württemberg, Germany" type={EPageType.area} />
      </div>

      <div className="w-[480px] mb-8">
        <PageHeader title="Rotterdam, The Netherlands" type={EPageType.node} />
      </div>

      <h2>Page Sections</h2>

      <div className="w-[480px] mb-8">
        <PageSection>
          <SectionHeader label="Food Produced" />
        </PageSection>
      </div>

      <div className="w-[480px] mb-8">
        <PageSection>
          <SectionHeader
            label="Food Transportation"
            tooltip="These routes represent the path that food takes from where it is produced to where it is consumed. The nodes represent major maritime ports, inland waterway ports, or rail depots that are recognized in the model as aggregation points and places where food flows change transportation mode."
          />
        </PageSection>
      </div>
    </div>
  );
}
