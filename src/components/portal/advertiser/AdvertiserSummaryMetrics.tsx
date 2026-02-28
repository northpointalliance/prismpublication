import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface SummaryCard {
  label: string;
  value: string;
  icon: LucideIcon;
}

interface Props {
  cards: SummaryCard[];
}

const AdvertiserSummaryMetrics = ({ cards }: Props) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
    {cards.map(({ label, value, icon: Icon }) => (
      <Card key={label}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold">{value}</p>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default AdvertiserSummaryMetrics;
