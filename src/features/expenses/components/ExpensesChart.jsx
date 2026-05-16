import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import { formatMoney } from "../../../utils/formatters";

export default function ExpensesChart({ chartData, chartStrokeColor }) {
  return (
    <div className="border-b border-border p-5 md:p-6">
      <div className="mb-4">
        <p className="text-sm font-semibold text-text-primary">Evolución neta</p>

        <p className="text-sm text-text-secondary">
          Tendencia acumulada de utilidad realizada y gastos dentro del rango seleccionado.
        </p>
      </div>

      <div className="h-[320px] w-full rounded-[28px] border border-border bg-surface-soft p-4 md:p-5">
        {chartData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="2 6" vertical={false} />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  `$${Number(v || 0).toLocaleString("es-MX")}`
                }
              />

              <Tooltip
                formatter={(value) => [formatMoney(value), "Neto acumulado"]}
                contentStyle={{
                  borderRadius: 16,
                  border: "1px solid var(--color-border, #e5e7eb)",
                }}
              />

              <Line
                type="monotone"
                dataKey="neto"
                name="Neto"
                stroke={chartStrokeColor}
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 5,
                  stroke: chartStrokeColor,
                  fill: chartStrokeColor,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-text-secondary">
            No hay datos para la gráfica en el filtro actual.
          </div>
        )}
      </div>
    </div>
  );
}