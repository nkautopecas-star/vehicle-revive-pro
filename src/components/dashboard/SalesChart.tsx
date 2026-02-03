import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { name: "Jan", vendas: 4000, receita: 24000 },
  { name: "Fev", vendas: 3000, receita: 18000 },
  { name: "Mar", vendas: 5000, receita: 30000 },
  { name: "Abr", vendas: 4500, receita: 27000 },
  { name: "Mai", vendas: 6000, receita: 36000 },
  { name: "Jun", vendas: 5500, receita: 33000 },
  { name: "Jul", vendas: 7000, receita: 42000 },
];

export function SalesChart() {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Vendas por Mês</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38 92% 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(38 92% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 19% 18%)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="hsl(215 16% 57%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(215 16% 57%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222 47% 10%)",
                  border: "1px solid hsl(217 19% 18%)",
                  borderRadius: "8px",
                  color: "hsl(210 40% 96%)",
                }}
                labelStyle={{ color: "hsl(215 16% 57%)" }}
              />
              <Area
                type="monotone"
                dataKey="vendas"
                stroke="hsl(38 92% 50%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorVendas)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
