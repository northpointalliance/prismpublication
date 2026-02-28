import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import ChartTooltip from "@/components/portal/ChartTooltip";

interface ChartRow {
  name: string;
  "Requests (7d)": number;
  "Revenue $ Today": number;
  "Fill Rate %": number;
}

interface Props {
  data: ChartRow[];
}

const BotPerformanceChart = ({ data }: Props) => {
  if (!data.length) return null;
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Bot Performance Overview</CardTitle>
        <p className="text-xs text-muted-foreground">Requests (7d) and fill rate across your fleet.</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Requests (7d)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Revenue $ Today" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default BotPerformanceChart;
