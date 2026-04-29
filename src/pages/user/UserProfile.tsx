import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { User, Mail, Phone, MapPin, Calendar, Award, Target, TrendingUp } from "lucide-react";
import { Textarea } from "../../components/ui/textarea";

export function UserProfile() {
  const profileStats = [
    { title: 'Member Since', value: 'Jan 2025', icon: Calendar, color: '#ff691d' },
    { title: 'Total Classes', value: '124', icon: Target, color: '#610981' },
    { title: 'Achievements', value: '12', icon: Award, color: '#10b981' },
    { title: 'Skill Level', value: 'Intermediate', icon: TrendingUp, color: '#f59e0b' },
  ];

  const achievements = [
    { id: 1, title: '30-Day Streak', description: 'Attended classes for 30 consecutive days', icon: '🔥', date: 'Earned on Mar 1, 2026' },
    { id: 2, title: 'Early Bird', description: 'Attended 10 morning classes', icon: '🌅', date: 'Earned on Feb 15, 2026' },
    { id: 3, title: 'Meditation Master', description: 'Completed 20 meditation sessions', icon: '🧘', date: 'Earned on Feb 28, 2026' },
    { id: 4, title: 'Flexible Warrior', description: 'Achieved advanced flexibility poses', icon: '💪', date: 'Earned on Jan 20, 2026' },
    { id: 5, title: 'Power House', description: 'Completed 15 power yoga sessions', icon: '⚡', date: 'Earned on Feb 10, 2026' },
    { id: 6, title: 'Breath Master', description: 'Mastered 10 pranayama techniques', icon: '🌬️', date: 'Earned on Jan 30, 2026' },
  ];

  const healthGoals = [
    { goal: 'Improve Flexibility', progress: 75, target: 'Achieve full splits by June 2026' },
    { goal: 'Build Core Strength', progress: 60, target: 'Hold plank for 5 minutes' },
    { goal: 'Master Meditation', progress: 85, target: '30 minutes daily meditation' },
    { goal: 'Weight Management', progress: 45, target: 'Reach ideal body weight' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
 
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information and track your progress</p>
        </div>
 
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {profileStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="relative overflow-hidden">
                <div 
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10"
                  style={{ backgroundColor: stat.color }}
                />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${stat.color}20` }}>
                    <Icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
 
        <div className="grid gap-6 lg:grid-cols-2">
  
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff691d]/5 rounded-full blur-3xl" />
            <CardHeader>
              <CardTitle style={{ color: '#ff691d' }}>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: '#61098120' }}>
                    <User className="w-12 h-12" style={{ color: '#610981' }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Enter your name" defaultValue="Rajesh Kumar" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input id="email" type="email" placeholder="Enter your email" defaultValue="rajesh.kumar@email.com" className="pl-9" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input id="phone" type="tel" placeholder="Enter your phone" defaultValue="+91 98765 43210" className="pl-9" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
                    <Textarea id="address" placeholder="Enter your address" defaultValue="123 Yoga Lane, Mumbai, Maharashtra 400001" className="pl-9" rows={3} />
                  </div>
                </div>

                <Button className="w-full" style={{ backgroundColor: '#610981', color: 'white' }}>
                  Update Profile
                </Button>
              </div>
            </CardContent>
          </Card>
 
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#610981]/5 rounded-full blur-3xl" />
            <CardHeader>
              <CardTitle style={{ color: '#ff691d' }}>Health Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {healthGoals.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{item.goal}</span>
                      <span className="text-xs font-semibold">{item.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all" 
                        style={{ 
                          width: `${item.progress}%`,
                          backgroundColor: '#610981'
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{item.target}</p>
                  </div>
                ))}

                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  style={{ borderColor: '#610981', color: '#610981' }}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Set New Goal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
 
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffac96]/5 rounded-full blur-3xl" />
          <CardHeader>
            <CardTitle style={{ color: '#ff691d' }}>Your Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className="hover:shadow-lg transition-shadow border-2" style={{ borderColor: '#10b981' }}>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-3">
                      <div className="text-4xl mb-2">{achievement.icon}</div>
                      <div>
                        <h4 className="font-semibold mb-1">{achievement.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
                        <Badge variant="secondary" className="text-xs">
                          {achievement.date}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
 
        <div className="grid gap-6 lg:grid-cols-2">
 
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#10b981]/5 rounded-full blur-3xl" />
            <CardHeader>
              <CardTitle style={{ color: '#ff691d' }}>Medical Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" placeholder="Enter your age" defaultValue="32" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodgroup">Blood Group</Label>
                  <Input id="bloodgroup" placeholder="Enter blood group" defaultValue="O+" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency">Emergency Contact</Label>
                  <Input id="emergency" type="tel" placeholder="Emergency contact number" defaultValue="+91 98765 12345" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conditions">Current Weight</Label>
                  <Textarea id="conditions" placeholder="Mention your Weight" defaultValue="None" />
                </div>

                <Button className="w-full" variant="outline">
                  Update Medical Info
                </Button>
              </div>
            </CardContent>
          </Card>
 
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#f59e0b]/5 rounded-full blur-3xl" />
            <CardHeader>
              <CardTitle style={{ color: '#ff691d' }}>Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="experience">Yoga Experience</Label>
                  <Input id="experience" placeholder="Years of practice" defaultValue="2 years" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Current Level</Label>
                  <Input id="level" placeholder="Beginner/Intermediate/Advanced" defaultValue="Intermediate" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interests">Areas of Interest</Label>
                  <Textarea id="interests" placeholder="Hatha, Vinyasa, Pranayama, etc." rows={2} defaultValue="Hatha Yoga, Pranayama, Meditation" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goals">Fitness Goals</Label>
                  <Textarea id="goals" placeholder="What do you want to achieve?" rows={3} defaultValue="Improve flexibility, build core strength, and learn advanced meditation techniques" />
                </div>

                <Button className="w-full" style={{ backgroundColor: '#ff691d', color: 'white' }}>
                  Update Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
