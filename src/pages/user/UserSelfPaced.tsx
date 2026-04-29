import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Share2 } from 'lucide-react';

import { 
  Play, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Star,
  Search,
  Filter,
  GraduationCap,
  TrendingUp,
  Award
} from "lucide-react";
import { motion } from "motion/react";

interface SelfPacedCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  thumbnail: string;
  instructor: string;
  duration: string;
  totalLessons: number;
  completedLessons: number;
  rating: number;
  enrolled: boolean;
  progress: number;
}

const selfPacedCourses: SelfPacedCourse[] = [
  {
    id: '1',
    title: 'Yoga Fundamentals for Beginners',
    description: 'Master the basic yoga poses, breathing techniques, and foundational principles to start your yoga journey with confidence.',
    category: 'Foundation',
    level: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
    instructor: 'Priya Sharma',
    duration: '6 hours',
    totalLessons: 24,
    completedLessons: 8,
    rating: 4.9,
    enrolled: true,
    progress: 33,
  },
  {
    id: '2',
    title: 'Advanced Asana Mastery',
    description: 'Deepen your practice with advanced poses, inversions, and complex sequences designed for experienced practitioners.',
    category: 'Asana',
    level: 'Advanced',
    thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
    instructor: 'Rohan Desai',
    duration: '10 hours',
    totalLessons: 40,
    completedLessons: 40,
    rating: 4.8,
    enrolled: true,
    progress: 100,
  },
  {
    id: '3',
    title: 'Pranayama & Breathwork Essentials',
    description: 'Learn powerful breathing techniques to enhance your energy, reduce stress, and improve overall well-being.',
    category: 'Pranayama',
    level: 'Intermediate',
    thumbnail: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&q=80',
    instructor: 'Anjali Menon',
    duration: '4 hours',
    totalLessons: 16,
    completedLessons: 5,
    rating: 5.0,
    enrolled: true,
    progress: 31,
  },
  {
    id: '4',
    title: 'Meditation & Mindfulness Journey',
    description: 'Develop a consistent meditation practice with guided sessions ranging from 5 to 30 minutes for all experience levels.',
    category: 'Meditation',
    level: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800&q=80',
    instructor: 'Vikram Patel',
    duration: '5 hours',
    totalLessons: 20,
    completedLessons: 0,
    rating: 4.9,
    enrolled: false,
    progress: 0,
  },
  {
    id: '5',
    title: 'Yoga for Flexibility & Strength',
    description: 'Build strength and increase flexibility through targeted sequences focusing on key muscle groups and joint mobility.',
    category: 'Fitness',
    level: 'Intermediate',
    thumbnail: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&q=80',
    instructor: 'Kavita Singh',
    duration: '8 hours',
    totalLessons: 32,
    completedLessons: 0,
    rating: 4.7,
    enrolled: false,
    progress: 0,
  },
  {
    id: '6',
    title: 'Restorative Yoga & Healing',
    description: 'Gentle, therapeutic practices designed to promote deep relaxation, stress relief, and physical recovery.',
    category: 'Wellness',
    level: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&q=80',
    instructor: 'Meera Iyer',
    duration: '6 hours',
    totalLessons: 24,
    completedLessons: 0,
    rating: 4.9,
    enrolled: false,
    progress: 0,
  },
];

const categories = ['All', 'Foundation', 'Asana', 'Pranayama', 'Meditation', 'Fitness', 'Wellness'];

export function UserSelfPaced() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);

  const filteredCourses = selfPacedCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    const matchesEnrolled = !showEnrolledOnly || course.enrolled;
    
    return matchesSearch && matchesCategory && matchesEnrolled;
  });

  const enrolledCourses = selfPacedCourses.filter(c => c.enrolled);
  const completedCourses = enrolledCourses.filter(c => c.progress === 100);
  const inProgressCourses = enrolledCourses.filter(c => c.progress > 0 && c.progress < 100);

  const handleCourseClick = (courseId: string) => {
    navigate(`/user/self-paced-course/${courseId}`);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-700 border-green-200';
      case 'Intermediate': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Advanced': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen pb-8">
 
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-gradient-to-br from-[#ff691d] via-[#610981] to-[#8b0fa8] text-white overflow-hidden"
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#ffac96]/20 rounded-full blur-3xl" />
        
        <div className="relative px-6 py-12 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Self-Paced Learning</h1>
              <p className="text-white/90 mt-1">Learn at your own pace, anytime, anywhere</p>
            </div>
          </motion.div>
 
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Enrolled Courses</p>
                  <p className="text-2xl font-bold">{enrolledCourses.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-white/80">In Progress</p>
                  <p className="text-2xl font-bold">{inProgressCourses.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Completed</p>
                  <p className="text-2xl font-bold">{completedCourses.length}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
 
      <div className="px-6 lg:px-8 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg"
        >
          <div className="flex flex-col lg:flex-row gap-4">
 
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search courses, instructors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 border-2 focus:border-[#ff691d]"
              />
            </div>
 
            <Button
              variant={showEnrolledOnly ? "default" : "outline"}
              onClick={() => setShowEnrolledOnly(!showEnrolledOnly)}
              className="h-12"
              style={showEnrolledOnly ? { backgroundColor: '#610981', color: 'white' } : {}}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showEnrolledOnly ? 'My Courses' : 'All Courses'}
            </Button>
          </div>
 
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="rounded-full"
                style={selectedCategory === category ? { backgroundColor: '#ff691d', color: 'white' } : {}}
              >
                {category}
              </Button>
            ))}
          </div>
        </motion.div>
 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
            >
              <Card className="group cursor-pointer hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 hover:border-[#ff691d]/50 bg-white/80 backdrop-blur-sm">
 
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {course.enrolled && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white/90 backdrop-blur-sm text-[#610981] border-[#610981]">
                        Enrolled
                      </Badge>
                    </div>
                  )}
                  {course.progress === 100 && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <Badge className={`${getLevelColor(course.level)} border`}>
                      {course.level}
                    </Badge>
                    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-semibold">{course.rating}</span>
                    </div>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg group-hover:text-[#ff691d] transition-colors">
                      {course.title}
                    </CardTitle>
                  </div>
                  <CardDescription className="line-clamp-2 text-sm">
                    {course.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
 
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span className="font-medium">{course.instructor}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration}</span>
                    </div>
                  </div>
 
                  {course.enrolled && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{course.completedLessons} of {course.totalLessons} lessons</span>
                        <span className="font-semibold" style={{ color: '#610981' }}>{course.progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ delay: 0.5 + (0.1 * index), duration: 1 }}
                          className="h-full bg-gradient-to-r from-[#ff691d] to-[#610981] rounded-full"
                        />
                      </div>
                    </div>
                  )}
 
                  <div className="flex gap-2">
 
                <Button
                  onClick={() => handleCourseClick(course.id)}
                  className={`flex-1 group/btn text-white ${
                    course.enrolled
                      ? 'bg-[#610981] hover:bg-[#7a0a9f]'
                      : 'bg-[#ff691d] hover:bg-[#ff7f3a]'
                  }`}
                >
                  {course.enrolled ? (
                    <>
                      <Play className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                      {course.progress === 100 ? 'Review Course' : 'Continue Learning'}
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                      Enroll Now
                    </>
                  )}
                </Button>
 
                <Button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: course.title,
                        text: `Check out this course: ${course.title}`,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copied!');
                    }
                  }}
                  className={`px-3 text-white ${
                    course.enrolled
                      ? 'bg-[#ff691d] hover:bg-[#ff7f3a]'
                      : 'bg-[#610981] hover:bg-[#7a0a9f]'
                  }`}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
 
        {filteredCourses.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setShowEnrolledOnly(false);
              }}
              style={{ backgroundColor: '#ff691d', color: 'white' }}
            >
              Clear Filters
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
