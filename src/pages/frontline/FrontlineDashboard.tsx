import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Phone, Users, TrendingUp, CheckCircle, Clock, PhoneCall, Target, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const callData = [
  { day: 'Mon', calls: 45, connected: 32 },
  { day: 'Tue', calls: 52, connected: 38 },
  { day: 'Wed', calls: 48, connected: 35 },
  { day: 'Thu', calls: 58, connected: 42 },
  { day: 'Fri', calls: 55, connected: 40 },
  { day: 'Sat', calls: 35, connected: 25 },
];

export function FrontlineDashboard() {
  const stats = [
    { name: "Today's Calls", value: 32, target: 50, icon: Phone, color: '#ff691d' },
    { name: "Connected", value: 24, percentage: 75, icon: PhoneCall, color: '#10b981' },
    { name: "New Leads", value: 18, trend: '+12%', icon: Users, color: '#610981' },
    { name: "Conversions", value: 5, trend: '+25%', icon: CheckCircle, color: '#3b82f6' },
  ];

  const recentCalls = [
    { id: 1, name: 'Amit Patel', status: 'Connected', time: '10:30 AM', duration: '5m 23s', outcome: 'Interested' },
    { id: 2, name: 'Priya Singh', status: 'No Answer', time: '11:15 AM', duration: '-', outcome: 'Follow-up' },
    { id: 3, name: 'Rahul Kumar', status: 'Connected', time: '12:00 PM', duration: '8m 45s', outcome: 'Converted' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-8">
   
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#610981] to-[#8b0fa8] p-8 text-white shadow-2xl shadow-[#ffac96]/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff691d]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#ffac96]/20 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Phone className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    Lead Generation Specialist
                  </Badge>
                </div>
                <h1 className="text-4xl font-bold mb-2">Welcome, Sarah! 📞</h1>
                <p className="text-white/80 text-lg">Let's make today count with great conversations!</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border-2 border-white/30">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target className="w-5 h-5" />
                    <p className="text-sm font-medium">Daily Target</p>
                  </div>
                  <p className="text-3xl font-bold mb-1">32/50</p>
                  <p className="text-sm text-white/80">Calls Made</p>
                  <div className="mt-3 w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white h-2 rounded-full" style={{ width: '64%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
 
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name} className="relative overflow-hidden group hover:scale-105 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-[#ffac96]/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
              
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: '#ffac96' }}>
                  {stat.name}
                </CardTitle>
                <div className="p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                {stat.target && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Target: {stat.target}
                  </p>
                )}
                {stat.percentage && (
                  <p className="text-xs font-medium mt-2" style={{ color: '#10b981' }}>
                    {stat.percentage}% success rate
                  </p>
                )}
                {stat.trend && (
                  <p className="text-xs font-medium mt-2" style={{ color: '#10b981' }}>
                    {stat.trend} from yesterday
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
 
        <div className="grid gap-4 lg:grid-cols-2">
 
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#610981]/5 rounded-full blur-3xl" />
            <CardHeader>
              <CardTitle style={{ color: '#ff691d' }}>Weekly Call Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={callData}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis key="xaxis" dataKey="day" stroke="#888" />
                  <YAxis key="yaxis" stroke="#888" />
                  <Tooltip key="tooltip" />
                  <Bar key="calls-bar" dataKey="calls" fill="#610981" radius={[8, 8, 0, 0]} />
                  <Bar key="connected-bar" dataKey="connected" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
 
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#ffac96]/5 rounded-full blur-3xl" />
            <CardHeader>
              <CardTitle style={{ color: '#ff691d' }}>Recent Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentCalls.map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{call.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{call.time}</span>
                        <span className="text-xs text-muted-foreground">• {call.duration}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge variant={call.status === 'Connected' ? 'default' : 'secondary'} className="text-xs">
                        {call.status}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ 
                          borderColor: call.outcome === 'Converted' ? '#10b981' : call.outcome === 'Interested' ? '#f59e0b' : '#94a3b8',
                          color: call.outcome === 'Converted' ? '#10b981' : call.outcome === 'Interested' ? '#f59e0b' : '#94a3b8'
                        }}
                      >
                        {call.outcome}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}