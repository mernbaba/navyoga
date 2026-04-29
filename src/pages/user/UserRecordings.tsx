import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Video, Search, Play, Clock, Eye, Star, Filter, BookOpen, Sparkles, Heart } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { motion } from "motion/react";

export function UserRecordings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const navigate = useNavigate();

  const metrics = [
    { title: 'Total Recordings', value: '156', icon: Video, color: '#ff691d', gradient: 'from-orange-500 to-red-500' },
    { title: 'Hours Watched', value: '87', icon: Clock, color: '#610981', gradient: 'from-purple-600 to-pink-600' },
    { title: 'Completed', value: '45', icon: Play, color: '#10b981', gradient: 'from-green-500 to-teal-500' },
    { title: 'Favorites', value: '23', icon: Heart, color: '#ef4444', gradient: 'from-red-500 to-pink-500' },
  ];

  const recordings = [
    { 
      id: 1, 
      title: 'Introduction to Ashtanga Yoga', 
      instructor: 'Priya Sharma', 
      category: 'Hatha Yoga',
      duration: '45:30', 
      date: 'Mar 8, 2026', 
      views: 234,
      rating: 4.8,
      description: 'Learn the fundamentals of Ashtanga yoga practice with proper alignment and breathing techniques.',
      watched: true,
      progress: 100,
      favorite: true
    },
    { 
      id: 2, 
      title: 'Advanced Breathing Techniques', 
      instructor: 'Rahul Kumar', 
      category: 'Pranayama',
      duration: '30:15', 
      date: 'Mar 7, 2026', 
      views: 189,
      rating: 4.9,
      description: 'Master advanced pranayama techniques to enhance your energy and mental clarity.',
      watched: true,
      progress: 100,
      favorite: false
    },
    { 
      id: 3, 
      title: 'Morning Stretch Routine', 
      instructor: 'Anita Verma', 
      category: 'Flexibility',
      duration: '25:00', 
      date: 'Mar 6, 2026', 
      views: 312,
      rating: 5.0,
      description: 'Perfect morning routine to wake up your body and improve flexibility.',
      watched: true,
      progress: 60,
      favorite: true
    },
    { 
      id: 4, 
      title: 'Power Yoga for Strength', 
      instructor: 'Vikram Singh', 
      category: 'Power Yoga',
      duration: '60:00', 
      date: 'Mar 5, 2026', 
      views: 278,
      rating: 4.7,
      description: 'Build strength and endurance with this intensive power yoga flow.',
      watched: false,
      progress: 0,
      favorite: false
    },
    { 
      id: 5, 
      title: 'Meditation for Beginners', 
      instructor: 'Anita Verma', 
      category: 'Meditation',
      duration: '20:30', 
      date: 'Mar 4, 2026', 
      views: 445,
      rating: 4.9,
      description: 'Start your meditation journey with simple and effective techniques.',
      watched: true,
      progress: 100,
      favorite: true
    },
    { 
      id: 6, 
      title: 'Restorative Evening Practice', 
      instructor: 'Priya Sharma', 
      category: 'Restorative',
      duration: '40:15', 
      date: 'Mar 3, 2026', 
      views: 203,
      rating: 4.8,
      description: 'Wind down your day with gentle restorative poses and deep relaxation.',
      watched: false,
      progress: 0,
      favorite: false
    },
    { 
      id: 7, 
      title: 'Core Strengthening Flow', 
      instructor: 'Vikram Singh', 
      category: 'Power Yoga',
      duration: '35:45', 
      date: 'Mar 2, 2026', 
      views: 267,
      rating: 4.6,
      description: 'Focus on building a strong core with targeted yoga poses.',
      watched: true,
      progress: 45,
      favorite: false
    },
    { 
      id: 8, 
      title: 'Yin Yoga Deep Stretch', 
      instructor: 'Anita Verma', 
      category: 'Yin Yoga',
      duration: '50:00', 
      date: 'Mar 1, 2026', 
      views: 198,
      rating: 5.0,
      description: 'Deep passive stretches held for longer durations to target connective tissues.',
      watched: false,
      progress: 0,
      favorite: true
    },
  ];

  const categories = ['all', 'Hatha Yoga', 'Pranayama', 'Flexibility', 'Power Yoga', 'Meditation', 'Restorative', 'Yin Yoga'];

  const filteredRecordings = recordings.filter(recording => {
    const matchesSearch = recording.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recording.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || recording.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Hatha Yoga': '#ff691d',
      'Pranayama': '#610981',
      'Flexibility': '#10b981',
      'Power Yoga': '#ef4444',
      'Meditation': '#8b5cf6',
      'Restorative': '#06b6d4',
      'Yin Yoga': '#f59e0b'
    };
    return colors[category] || '#6b7280';
  };

  const getCategoryGradient = (category: string) => {
    const gradients: { [key: string]: string } = {
      'Hatha Yoga': 'from-orange-500 to-red-500',
      'Pranayama': 'from-purple-600 to-pink-600',
      'Flexibility': 'from-green-500 to-teal-500',
      'Power Yoga': 'from-red-500 to-pink-500',
      'Meditation': 'from-violet-500 to-purple-600',
      'Restorative': 'from-cyan-500 to-blue-500',
      'Yin Yoga': 'from-yellow-500 to-orange-500'
    };
    return gradients[category] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="space-y-6">
 
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#610981] via-[#8b0fa8] to-[#610981] p-8 text-white shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Video className="w-8 h-8" />
              </motion.div>
              <h1 className="text-4xl font-bold">Class Recordings</h1>
            </div>
            <p className="text-white/90 text-lg">Access and watch recorded yoga sessions anytime</p>
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
                    placeholder="Search recordings or instructors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-11 border-gray-200 focus:border-purple-300"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full lg:w-[220px] h-11 border-gray-200">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  All Recordings ({filteredRecordings.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredRecordings.map((recording, idx) => (
                  <motion.div
                    key={recording.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + idx * 0.05 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    onClick={() => navigate(`/user/recording-player/${recording.id}`)}
                  >
                    <Card className="group border-2 border-gray-100 hover:border-purple-200 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer h-full overflow-hidden">
 
                      <div 
                        className={`relative w-full h-48 flex items-center justify-center overflow-hidden bg-gradient-to-br ${getCategoryGradient(recording.category)}`}
                      >
                        <Video className="w-16 h-16 text-white/40" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white/90 rounded-full p-4 group-hover:scale-110 transition-transform">
                            <Play className="w-8 h-8 text-purple-700" />
                          </div>
                        </div>
                        {recording.watched && recording.progress > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/30">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${recording.progress}%` }}
                              transition={{ delay: 0.7 + idx * 0.05, duration: 0.6 }}
                              className="h-full bg-white"
                            />
                          </div>
                        )}
                        {recording.favorite && (
                          <div className="absolute top-3 right-3 bg-white/90 rounded-full p-1.5 shadow-lg">
                            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
                          <span className="text-white text-xs font-semibold">{recording.duration}</span>
                        </div>
                      </div>

                      <CardContent className="pt-4 pb-4">
                        <div className="space-y-3">
 
                          <div>
                            <h3 className="font-bold line-clamp-2 mb-1 group-hover:text-purple-700 transition-colors">{recording.title}</h3>
                            <p className="text-sm text-muted-foreground">{recording.instructor}</p>
                          </div>
 
                          <div className="flex items-center justify-between">
                            <Badge 
                              className="font-semibold"
                              style={{ backgroundColor: `${getCategoryColor(recording.category)}20`, color: getCategoryColor(recording.category) }}
                            >
                              {recording.category}
                            </Badge>
                            {recording.progress === 100 && (
                              <Badge className="bg-green-100 text-green-700 text-xs font-semibold">
                                ✓ Completed
                              </Badge>
                            )}
                          </div>
 
                          <div className="flex items-center justify-between text-sm pt-2 border-t">
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                <span className="font-medium">{recording.views}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded">
                                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                <span className="font-bold text-gray-700 text-xs">{recording.rating}</span>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">{recording.date}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {filteredRecordings.length === 0 && (
                <div className="text-center py-16">
                  <Video className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-muted-foreground text-lg">No recordings found matching your search</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
