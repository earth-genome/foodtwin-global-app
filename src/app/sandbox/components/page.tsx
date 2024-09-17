"use client";

import { ListBars } from "@/app/components/charts";
import PageHeader from "@/app/components/page-header";
import {
  Metric,
  MetricRow,
  PageSection,
  SectionHeader,
  Tabs,
} from "@/app/components/page-section";
import { EPageType } from "@/types/components";
import { Tab } from "@nextui-org/react";

export default function Components() {
  return (
    <div className="container mx-auto">
      <h1>Component Sandbox</h1>
      <h2>Page Headers</h2>

      <div className="w-[480px] mb-8">
        <PageHeader title="Black Sea Route" itemType={EPageType.route} />
      </div>

      <div className="w-[480px] mb-8">
        <PageHeader
          title="Baden-Württemberg, Germany"
          itemType={EPageType.area}
        />
      </div>

      <div className="w-[480px] mb-8">
        <PageHeader
          title="Rotterdam, The Netherlands"
          itemType={EPageType.node}
        />
      </div>

      <h2>Page Sections</h2>

      <div className="w-[480px] mb-8 border-y-1">
        <PageSection>
          <SectionHeader label="Food Produced" />
          <MetricRow>
            <Metric
              label="Calories produced"
              value={999999}
              unit="billion Kcal"
            />
            <Metric
              label="Agriculture sector in GDP"
              value={8.364}
              unit="billion 2010 USD$"
            />
            <Metric label="GDP per capita" value={49447} unit="2011 USD$" />
          </MetricRow>
          <MetricRow>
            <Metric
              label="Total population"
              value={30.9}
              unit="million people"
            />
            <Metric label="Human Development Index" value={0.907} />
          </MetricRow>
        </PageSection>
      </div>

      <div className="w-[480px] mb-8 border-y-1">
        <PageSection>
          <SectionHeader
            label="Food Transportation"
            tooltip="These routes represent the path that food takes from where it is produced to where it is consumed. The nodes represent major maritime ports, inland waterway ports, or rail depots that are recognized in the model as aggregation points and places where food flows change transportation mode."
          />
          <MetricRow>
            <Metric
              label="Calories produced"
              value={999999}
              unit="billion Kcal"
            />
            <Metric
              label="Agriculture sector in GDP"
              value={8.364}
              unit="billion 2010 USD$"
            />
            <Metric label="GDP per capita" value={49447} unit="2011 USD$" />
          </MetricRow>
        </PageSection>
      </div>

      <h2>Charts</h2>

      <div className="w-[480px] mb-8">
        <Tabs>
          <Tab title="Food groups">
            <ListBars
              showPercentage
              unit="million MMt"
              data={[
                {
                  label: "🥛 Dairy and Eggs",
                  value: 14.13,
                  color: "#76B7B2",
                },
                {
                  label: "🥔 Starches",
                  value: 1.1,
                  color: "#4E79A7",
                },
              ]}
            />
          </Tab>
          <Tab title="Nutritional value">
            <ListBars
              unit="Millions people’s needs"
              data={[
                {
                  label: "🍔 Calories",
                  value: 20000,
                },
                {
                  label: "🥩 Protein",
                  value: 10000,
                },
              ]}
            />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
