import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { 
  ArrowLeft,
  Play,
  CheckCircle2,
  Circle,
  Lock,
  Clock,
  BookOpen,
  Download,
  Share2,
  Star,
  ChevronRight,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  SkipBack,
  SkipForward,
  Pause
} from "lucide-react";
import { motion } from "motion/react";
import { Progress } from "../../components/ui/progress";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
  videoUrl: string;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

const courseData = {
  id: '1',
  title: 'Yoga Fundamentals for Beginners',
  instructor: 'Priya Sharma',
  description: 'Master the basic yoga poses, breathing techniques, and foundational principles to start your yoga journey with confidence.',
  rating: 4.9,
  totalStudents: 1247,
  level: 'Beginner',
  totalDuration: '6 hours',
  completedLessons: 8,
  totalLessons: 24,
  progress: 33,
  modules: [
    {
      id: 'm1',
      title: 'Introduction to Yoga',
      lessons: [
        { id: 'l1', title: 'Welcome & What to Expect', duration: '5:30', completed: true, locked: false, videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
        { id: 'l2', title: 'History and Philosophy of Yoga', duration: '12:45', completed: true, locked: false, videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
        { id: 'l3', title: 'Benefits of Regular Practice', duration: '8:20', completed: true, locked: false, videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
        { id: 'l4', title: 'Setting Up Your Practice Space', duration: '6:15', completed: true, locked: false, videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
      ],
    },
    {
      id: 'm2',
      title: 'Basic Asanas (Poses)',
      lessons: [
        { id: 'l5', title: 'Mountain Pose (Tadasana)', duration: '10:30', completed: true, locked: false, videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
        { id: 'l6', title: 'Downward Dog (Adho Mukha Svanasana)', duration: '14:20', completed: true, locked: false, videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
        { id: 'l7', title: 'Warrior I & II Poses', duration: '18:45', completed: true, locked: false, videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' },
        { id: 'l8', title: 'Child\'s Pose (Balasana)', duration: '9:10', completed: true, locked: false, videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' },
        { id: 'l9', title: 'Cat-Cow Stretch', duration: '11:30', completed: false, locked: false, videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4' },
        { id: 'l10', title: 'Triangle Pose (Trikonasana)', duration: '13:50', completed: false, locked: false, videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
      ],
    },
    {
      id: 'm3',
      title: 'Breathing Fundamentals',
      lessons: [
        { id: 'l11', title: 'Introduction to Pranayama', duration: '8:40', completed: false, locked: false, videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
        { id: 'l12', title: 'Deep Belly Breathing', duration: '10:20', completed: false, locked: false, videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
        { id: 'l13', title: 'Alternate Nostril Breathing', duration: '12:15', completed: false, locked: true, videoUrl: '' },
        { id: 'l14', title: 'Ujjayi Breath Technique', duration: '11:30', completed: false, locked: true, videoUrl: '' },
      ],
    },
    {
      id: 'm4',
      title: 'Building Your Practice',
      lessons: [
        { id: 'l15', title: '15-Minute Morning Flow', duration: '16:45', completed: false, locked: true, videoUrl: '' },
        { id: 'l16', title: '20-Minute Evening Relaxation', duration: '21:30', completed: false, locked: true, videoUrl: '' },
        { id: 'l17', title: 'Sun Salutation A & B', duration: '18:20', completed: false, locked: true, videoUrl: '' },
        { id: 'l18', title: 'Creating a Personal Routine', duration: '14:50', completed: false, locked: true, videoUrl: '' },
      ],
    },
  ],
};

export function UserSelfPacedCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [currentLesson, setCurrentLesson] = useState(courseData.modules[0].lessons[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showModules, setShowModules] = useState(true);

  const handleLessonSelect = (lesson: Lesson) => {
    if (!lesson.locked) {
      setCurrentLesson(lesson);
      setIsPlaying(false);
    }
  };

  const handleMarkComplete = () => {
 
    const allLessons = courseData.modules.flatMap(m => m.lessons);
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
    if (currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      if (!nextLesson.locked) {
        setCurrentLesson(nextLesson);
      }
    }
  };

  const allLessons = courseData.modules.flatMap(m => m.lessons);
  const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
  const hasPrevious = currentIndex > 0 && !allLessons[currentIndex - 1].locked;
  const hasNext = currentIndex < allLessons.length - 1 && !allLessons[currentIndex + 1].locked;

  return (
    <div className="min-h-screen bg-black">
 
      <div className="bg-black/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/user/self-paced')}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
            <div className="hidden md:block">
              <h2 className="text-white font-semibold">{courseData.title}</h2>
              <p className="text-sm text-gray-400">{courseData.instructor}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <BookOpen className="w-4 h-4 text-white" />
              <span className="text-sm text-white">{courseData.completedLessons}/{courseData.totalLessons} lessons</span>
              <span className="text-sm font-semibold text-[#ff691d]">{courseData.progress}%</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={() => setShowModules(!showModules)}
            >
              {showModules ? 'Hide' : 'Show'} Curriculum
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
 
        <div className={`flex-1 ${showModules ? 'lg:mr-96' : ''}`}>
 
          <div className="relative bg-black aspect-video">
            <video
              className="w-full h-full"
              src={currentLesson.videoUrl}
              poster="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80"
              controls
            />
          </div>
 
          <div className="bg-gradient-to-br from-gray-900 to-black text-white p-6 lg:p-8">
 
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-[#ff691d] text-white">
                    Lesson {currentIndex + 1}
                  </Badge>
                  {currentLesson.completed && (
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">{currentLesson.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {currentLesson.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {courseData.rating}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Resources
                </Button>
              </div>
            </div>
 
            <div className="flex items-center gap-3 mb-6">
              <Button
                disabled={!hasPrevious}
                onClick={() => handleLessonSelect(allLessons[currentIndex - 1])}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20"
                style={{ opacity: hasPrevious ? 1 : 0.5 }}
              >
                <SkipBack className="w-4 h-4 mr-2" />
                Previous Lesson
              </Button>

              {!currentLesson.completed && (
                <Button
                  onClick={handleMarkComplete}
                  className="flex-1"
                  style={{ backgroundColor: '#610981', color: 'white' }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Complete
                </Button>
              )}

              <Button
                disabled={!hasNext}
                onClick={() => handleLessonSelect(allLessons[currentIndex + 1])}
                className="flex-1"
                style={{ 
                  backgroundColor: hasNext ? '#ff691d' : '#666',
                  color: 'white',
                  opacity: hasNext ? 1 : 0.5
                }}
              >
                Next Lesson
                <SkipForward className="w-4 h-4 ml-2" />
              </Button>
            </div>
 
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Your Progress</h3>
                <span className="text-sm font-bold" style={{ color: '#ff691d' }}>
                  {courseData.progress}% Complete
                </span>
              </div>
              <Progress value={courseData.progress} className="h-2 mb-3" />
              <p className="text-sm text-gray-400">
                {courseData.completedLessons} of {courseData.totalLessons} lessons completed
              </p>
            </div>
          </div>
        </div>
 
        {showModules && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="fixed right-0 top-0 h-full w-96 bg-white border-l border-border overflow-hidden hidden lg:block"
            style={{ marginTop: '57px' }}
          >
            <div className="h-full overflow-y-auto">
 
              <div className="sticky top-0 bg-gradient-to-br from-[#610981] to-[#8b0fa8] text-white p-6 z-10">
                <h2 className="text-lg font-bold mb-2">Course Curriculum</h2>
                <p className="text-sm text-white/80">{courseData.totalLessons} lessons • {courseData.totalDuration}</p>
              </div>
 
              <div className="p-4 space-y-4">
                {courseData.modules.map((module, moduleIndex) => (
                  <Card key={module.id} className="overflow-hidden border-2">
                    <CardHeader className="pb-3 bg-gradient-to-r from-[#ff691d]/5 to-[#610981]/5">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>Module {moduleIndex + 1}: {module.title}</span>
                        <Badge variant="secondary" className="text-xs">
                          {module.lessons.filter(l => l.completed).length}/{module.lessons.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonSelect(lesson)}
                          disabled={lesson.locked}
                          className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-all ${
                            currentLesson.id === lesson.id
                              ? 'bg-[#ff691d] text-white'
                              : lesson.locked
                              ? 'bg-gray-50 cursor-not-allowed opacity-50'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {lesson.locked ? (
                                <Lock className="w-4 h-4 text-gray-400" />
                              ) : lesson.completed ? (
                                <CheckCircle2 className={`w-4 h-4 ${currentLesson.id === lesson.id ? 'text-white' : 'text-green-500'}`} />
                              ) : currentLesson.id === lesson.id ? (
                                <Play className="w-4 h-4 fill-white text-white" />
                              ) : (
                                <Circle className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${
                                currentLesson.id === lesson.id ? 'text-white' : 'text-gray-900'
                              }`}>
                                {lessonIndex + 1}. {lesson.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className={`w-3 h-3 ${
                                  currentLesson.id === lesson.id ? 'text-white/80' : 'text-gray-500'
                                }`} />
                                <span className={`text-xs ${
                                  currentLesson.id === lesson.id ? 'text-white/80' : 'text-gray-500'
                                }`}>
                                  {lesson.duration}
                                </span>
                              </div>
                            </div>
                            {currentLesson.id === lesson.id && (
                              <ChevronRight className="w-4 h-4 text-white flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
