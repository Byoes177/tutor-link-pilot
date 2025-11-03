import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProgressEntry {
  date_of_session: string;
  skill_level: string;
}

interface ProgressChartProps {
  subject: string;
  entries: ProgressEntry[];
}

const skillLevelToValue = {
  'Needs support': 1,
  'Satisfactory': 2,
  'Good': 3,
  'Excellent': 4,
};

const valueToSkillLevel = ['', 'Needs support', 'Satisfactory', 'Good', 'Excellent'];

export function ProgressChart({ subject, entries }: ProgressChartProps) {
  const chartData = entries
    .map((entry) => ({
      date: new Date(entry.date_of_session).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      level: skillLevelToValue[entry.skill_level as keyof typeof skillLevelToValue] || 0,
      fullDate: entry.date_of_session,
    }))
    .reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{subject} Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              domain={[0, 4]}
              ticks={[1, 2, 3, 4]}
              tickFormatter={(value) => valueToSkillLevel[value]}
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="text-sm font-medium">{payload[0].payload.date}</p>
                      <p className="text-sm text-muted-foreground">
                        Level: {valueToSkillLevel[payload[0].value as number]}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="level"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
              name="Skill Level"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
