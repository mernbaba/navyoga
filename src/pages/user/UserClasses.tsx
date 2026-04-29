import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { BookOpen, Search, Calendar, Clock, Users, Star, Sparkles, Play } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { motion } from "motion/react";

export function UserClasses() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const metrics = [
    { title: 'Enrolled Classes', value: '8', icon: BookOpen, color: '#ff691d', gradient: 'from-orange-500 to-red-500' },
    { title: 'Completed', value: '3', icon: Star, color: '#10b981', gradient: 'from-green-500 to-teal-500' },
    { title: 'In Progress', value: '5', icon: Clock, color: '#610981', gradient: 'from-purple-600 to-pink-600' },
    { title: 'Avg. Attendance', value: '92%', icon: Calendar, color: '#f59e0b', gradient: 'from-yellow-500 to-orange-500' },
  ];

  const enrolledClasses = [
    { 
      id: 1, 
      name: 'Advanced Hatha Yoga', 
      instructor: 'Priya Sharma', 
      level: 'Advanced', 
      schedule: 'Mon, Wed, Fri • 6:00 PM',
      duration: '60 min',
      enrolled: '24/30',
      progress: 75,
      nextClass: 'Today at 6:00 PM',
      status: 'active',
      rating: 4.8
    },
    { 
      id: 2, 
      name: 'Pranayama Basics', 
      instructor: 'Rahul Kumar', 
      level: 'Beginner', 
      schedule: 'Tue, Thu • 7:00 AM',
      duration: '45 min',
      enrolled: '18/25',
      progress: 60,
      nextClass: 'Tomorrow at 7:00 AM',
      status: 'active',
      rating: 4.9
    },
    { 
      id: 3, 
      name: 'Meditation & Mindfulness', 
      instructor: 'Anita Verma', 
      level: 'All Levels', 
      schedule: 'Daily • 8:00 AM',
      duration: '30 min',
      enrolled: '32/40',
      progress: 85,
      nextClass: 'Tomorrow at 8:00 AM',
      status: 'active',
      rating: 5.0
    },
    { 
      id: 4, 
      name: 'Power Yoga Flow', 
      instructor: 'Vikram Singh', 
      level: 'Intermediate', 
      schedule: 'Mon, Wed, Fri • 6:30 PM',
      duration: '75 min',
      enrolled: '20/25',
      progress: 45,
      nextClass: 'Mar 13 at 6:30 PM',
      status: 'active',
      rating: 4.7
    },
    { 
      id: 5, 
      name: 'Yoga for Flexibility', 
      instructor: 'Meera Joshi', 
      level: 'Beginner', 
      schedule: 'Tue, Sat • 5:00 PM',
      duration: '50 min',
      enrolled: '15/20',
      progress: 100,
      nextClass: 'Completed',
      status: 'completed',
      rating: 4.6
    },
    { 
      id: 6, 
      name: 'Restorative Yoga', 
      instructor: 'Priya Sharma', 
      level: 'All Levels', 
      schedule: 'Sun • 7:00 PM',
      duration: '60 min',
      enrolled: '22/30',
      progress: 30,
      nextClass: 'Mar 16 at 7:00 PM',
      status: 'active',
      rating: 4.8
    },
    { 
      id: 7, 
      name: 'Vinyasa Flow', 
      instructor: 'Rahul Kumar', 
      level: 'Intermediate', 
      schedule: 'Tue, Thu, Sat • 6:00 AM',
      duration: '60 min',
      enrolled: '28/35',
      progress: 100,
      nextClass: 'Completed',
      status: 'completed',
      rating: 4.9
    },
    { 
      id: 8, 
      name: 'Yin Yoga', 
      instructor: 'Anita Verma', 
      level: 'All Levels', 
      schedule: 'Wed, Fri • 8:00 PM',
      duration: '45 min',
      enrolled: '12/20',
      progress: 100,
      nextClass: 'Completed',
      status: 'completed',
      rating: 5.0
    },
  ];

  const availableClasses = [
    { id: 9, name: 'Hot Yoga Basics', instructor: 'Vikram Singh', level: 'Beginner', schedule: 'Mon, Wed • 5:00 PM', duration: '60 min', enrolled: '10/20', rating: 4.5 },
    { id: 10, name: 'Aerial Yoga', instructor: 'Meera Joshi', level: 'Intermediate', schedule: 'Tue, Thu • 7:00 PM', duration: '55 min', enrolled: '8/15', rating: 4.7 },
    { id: 11, name: 'Prenatal Yoga', instructor: 'Priya Sharma', level: 'All Levels', schedule: 'Mon, Fri • 10:00 AM', duration: '45 min', enrolled: '12/15', rating: 4.9 },
  ];

  const filteredClasses = enrolledClasses.filter(class_item => {
    const matchesSearch = class_item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         class_item.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === "all" || class_item.level === filterLevel;
    const matchesStatus = filterStatus === "all" || class_item.status === filterStatus;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const getLevelColor = (level: string) => {
    switch(level) {
      case 'Beginner': return '#10b981';
      case 'Intermediate': return '#f59e0b';
      case 'Advanced': return '#ef4444';
      default: return '#610981';
    }
  };

  const getLevelGradient = (level: string) => {
    switch(level) {
      case 'Beginner': return 'from-green-500 to-teal-500';
      case 'Intermediate': return 'from-yellow-500 to-orange-500';
      case 'Advanced': return 'from-red-500 to-pink-500';
      default: return 'from-purple-600 to-pink-600';
    }
  };

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      <div className="space-y-6">
 
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#ff691d] via-[#ff8c4d] to-[#ffac96] p-8 text-white shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              >
                <BookOpen className="w-8 h-8" />
              </motion.div>
              <h1 className="text-4xl font-bold">My Classes</h1>
            </div>
            <p className="text-white/90 text-lg">Manage your enrolled classes and explore new courses</p>
          </div>
        </motion.div>
 
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
                    style={{ backgroundColor: metric.color }}
                  />
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </CardTitle>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.gradient} shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      {metric.value}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search classes or instructors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-11 border-gray-200 focus:border-purple-300"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterLevel} onValueChange={setFilterLevel}>
                    <SelectTrigger className="w-[160px] h-11 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="All Levels">All Levels</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[160px] h-11 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#ff691d]/10 to-transparent rounded-full blur-3xl" />
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#ff691d] to-[#ff8c4d] shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-xl" style={{ color: '#ff691d' }}>
                  Enrolled Classes ({filteredClasses.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid gap-5 md:grid-cols-2">
                {filteredClasses.map((class_item, idx) => (
                  <motion.div
                    key={class_item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + idx * 0.05 }}
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  >
                    <Card className="group border-2 border-gray-100 hover:border-purple-200 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden">
                      <div className={`h-2 bg-gradient-to-r ${getLevelGradient(class_item.level)}`} />
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg mb-1 group-hover:text-purple-700 transition-colors">{class_item.name}</h3>
                              <p className="text-sm text-muted-foreground">{class_item.instructor}</p>
                            </div>
                            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-bold text-gray-700">{class_item.rating}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge 
                              className="font-semibold" 
                              style={{ backgroundColor: `${getLevelColor(class_item.level)}20`, color: getLevelColor(class_item.level) }}
                            >
                              {class_item.level}
                            </Badge>
                            <Badge variant="secondary" className="bg-gray-100">
                              <Clock className="w-3 h-3 mr-1" />
                              {class_item.duration}
                            </Badge>
                            <Badge variant="secondary" className="bg-gray-100">
                              <Users className="w-3 h-3 mr-1" />
                              {class_item.enrolled}
                            </Badge>
                            {class_item.status === 'completed' && (
                              <Badge className="bg-green-100 text-green-700 font-semibold">
                                ✓ Completed
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground font-medium">Course Progress</span>
                              <span className="font-bold" style={{ color: class_item.progress === 100 ? '#10b981' : '#610981' }}>
                                {class_item.progress}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${class_item.progress}%` }}
                                transition={{ delay: 0.7 + idx * 0.05, duration: 0.8, ease: "easeOut" }}
                                className={`h-3 rounded-full bg-gradient-to-r ${getLevelGradient(class_item.level)}`}
                              />
                            </div>
                          </div>

                          <div className="pt-2 border-t-2 border-dashed border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-xs text-muted-foreground font-medium">Schedule</p>
                                <p className="text-sm font-semibold text-gray-700">{class_item.schedule}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground font-medium">Next Class</p>
                                <p className="text-sm font-semibold" style={{ color: class_item.status === 'active' ? '#ff691d' : '#10b981' }}>
                                  {class_item.nextClass}
                                </p>
                              </div>
                              {class_item.status === 'active' && (
                                <Button 
                                  onClick={() => navigate(`/user/class-session/${class_item.id}`)}
                                  className="bg-gradient-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca] text-white shadow-lg"
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Join Class
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {filteredClasses.length === 0 && (
                <div className="text-center py-16">
                  <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-muted-foreground text-lg">No classes found matching your filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#610981]/10 to-transparent rounded-full blur-3xl" />
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#610981] to-[#8b0fa8] shadow-lg">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-xl" style={{ color: '#ff691d' }}>Available Classes</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid gap-5 md:grid-cols-3">
                {availableClasses.map((class_item, idx) => (
                  <motion.div
                    key={class_item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + idx * 0.1 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  >
                    <Card className="group border-2 border-gray-100 hover:border-orange-200 shadow-md hover:shadow-2xl transition-all duration-300 h-full">
                      <div className={`h-2 bg-gradient-to-r ${getLevelGradient(class_item.level)}`} />
                      <CardContent className="pt-6 flex flex-col h-full">
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="font-bold text-lg mb-1 group-hover:text-orange-700 transition-colors">{class_item.name}</h3>
                            <p className="text-sm text-muted-foreground">{class_item.instructor}</p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge 
                              className="font-semibold"
                              style={{ backgroundColor: `${getLevelColor(class_item.level)}20`, color: getLevelColor(class_item.level) }}
                            >
                              {class_item.level}
                            </Badge>
                            <Badge variant="secondary" className="bg-gray-100">
                              <Clock className="w-3 h-3 mr-1" />
                              {class_item.duration}
                            </Badge>
                          </div>

                          <div className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white">
                            <p className="text-sm text-muted-foreground mb-2">{class_item.schedule}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-bold text-gray-700">{class_item.rating}</span>
                              </div>
                              <span className="text-sm text-muted-foreground font-medium">
                                <Users className="w-4 h-4 inline mr-1" />
                                {class_item.enrolled}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Button 
                          className="w-full mt-4 bg-gradient-to-r from-[#ff691d] to-[#ff8c4d] hover:from-[#ff5500] hover:to-[#ff691d] text-white font-bold shadow-lg"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Enroll Now
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}