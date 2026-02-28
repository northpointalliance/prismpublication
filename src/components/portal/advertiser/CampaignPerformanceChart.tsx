import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import ChartTooltip from "@/components/portal/ChartTooltip";

interface ChartRow {
  name: string;
  Impressions: number;
  Clicks: number;
  "Spend ($)": number;
}

interface Props {
  data: ChartRow[];
}

const CampaignPerformanceChart = ({ data }: Props) => {
  if (!data.length) return null;
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Campaign Performance — Last 7 Days</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Impressions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Clicks" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default CampaignPerformanceChart;
