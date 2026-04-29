import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Video, Play, Pause, Volume2, VolumeX, Maximize2, ArrowLeft, Clock, X, Settings, Download, Heart, Eye, Star, BookOpen, Camera, Mic, Speaker, Monitor, SkipForward, SkipBack } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

export function UserRecordingPlayer() {
  const navigate = useNavigate();
  const { recordingId } = useParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [recordingData, setRecordingData] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
 
  const [videoQuality, setVideoQuality] = useState("hd");
  const [playbackSpeed, setPlaybackSpeed] = useState("1.0");
 
  useEffect(() => {
    const mockRecordings = [
      { 
        id: '1', 
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
        id: '2', 
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
        id: '3', 
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
        id: '4', 
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
        id: '5', 
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
        id: '6', 
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
        id: '7', 
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
        id: '8', 
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

    const foundRecording = mockRecordings.find(r => r.id === recordingId);
    setRecordingData(foundRecording || mockRecordings[0]);
 
    if (foundRecording) {
      const [mins, secs] = foundRecording.duration.split(':').map(Number);
      setDuration(mins * 60 + secs);
    }
  }, [recordingId]);

  const handleBack = () => {
    navigate('/user/recordings');
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      toast.success('Playing recording');
    }
  };

  const handleDownload = () => {
    toast.success('Download started');
  };

  const handleFavorite = () => {
    if (recordingData) {
      setRecordingData({ ...recordingData, favorite: !recordingData.favorite });
      toast.success(recordingData.favorite ? 'Removed from favorites' : 'Added to favorites');
    }
  };

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
 
  useEffect(() => {
    if (isPlaying && currentTime < duration) {
      const interval = setInterval(() => {
        setCurrentTime(prev => Math.min(prev + 1, duration));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentTime, duration]);

  if (!recordingData) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading recording...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
 
      <div className="flex-1 relative bg-gradient-to-br from-gray-900 to-black">
 
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryGradient(recordingData.category)} opacity-30 backdrop-blur-sm`} />
            <div className="relative text-center text-white z-10">
              <motion.div
                animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }}
                transition={{ repeat: isPlaying ? Infinity : 0, duration: 2 }}
              >
                <Video className="w-32 h-32 mx-auto mb-6 opacity-50" />
              </motion.div>
              <h2 className="text-4xl font-bold mb-2">{recordingData.title}</h2>
              <p className="text-xl text-white/80 mb-4">with {recordingData.instructor}</p>
              <div className="flex items-center justify-center gap-4">
                <Badge className="bg-purple-500/90 text-white text-base px-4 py-2">
                  <Video className="w-4 h-4 mr-2" />
                  RECORDING
                </Badge>
                <Badge className="bg-white/20 text-white text-base px-4 py-2">
                  <Eye className="w-4 h-4 mr-2" />
                  {recordingData.views} views
                </Badge>
              </div>
              <p className="text-sm text-white/60 mt-4">
                {isPlaying ? 'Now playing...' : 'Video recording ready to play'}
              </p>
            </div>
          </div>
        </div>
 
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md rounded-xl p-4 text-white max-w-sm">
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ background: `linear-gradient(135deg, ${getCategoryColor(recordingData.category)}, ${getCategoryColor(recordingData.category)}dd)` }}
            >
              {recordingData.instructor.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <p className="font-semibold">{recordingData.instructor}</p>
              <p className="text-xs text-white/70">Instructor</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <Badge 
                style={{ 
                  backgroundColor: `${getCategoryColor(recordingData.category)}20`, 
                  color: getCategoryColor(recordingData.category) 
                }}
              >
                {recordingData.category}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{recordingData.duration} duration</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{recordingData.rating} rating</span>
            </div>
          </div>
        </div>
 
        {recordingData.progress > 0 && (
          <div className="absolute top-4 right-4 bg-purple-500/90 backdrop-blur-md rounded-xl px-4 py-2 text-white">
            <div className="text-xs mb-1">Your Progress</div>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all"
                  style={{ width: `${recordingData.progress}%` }}
                />
              </div>
              <span className="text-sm font-bold">{recordingData.progress}%</span>
            </div>
          </div>
        )}
      </div>
 
      <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-t border-gray-800">
 
        <div className="px-6 pt-4">
          <div className="flex items-center gap-3 text-white text-sm mb-2">
            <span className="font-mono">{formatTime(currentTime)}</span>
            <div className="flex-1">
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden cursor-pointer group">
                <motion.div 
                  className={`h-full bg-gradient-to-r ${getCategoryGradient(recordingData.category)} transition-all`}
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
            </div>
            <span className="font-mono">{recordingData.duration}</span>
          </div>
        </div>
 
        <div className="px-6 pb-6 pt-2">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
 
              <Button
                onClick={handleBack}
                className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
 
              <Button
                onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all"
              >
                <SkipBack className="w-6 h-6" />
              </Button>
 
              <Button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca] text-white transition-all shadow-lg"
              >
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
              </Button>
 
              <Button
                onClick={() => setCurrentTime(Math.min(duration, currentTime + 10))}
                className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all"
              >
                <SkipForward className="w-6 h-6" />
              </Button>
 
              <Button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-14 h-14 rounded-full ${
                  isMuted 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gray-700 hover:bg-gray-600'
                } text-white transition-all`}
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </Button>
 
              <Button
                onClick={() => setShowSettings(!showSettings)}
                className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all"
              >
                <Settings className="w-6 h-6" />
              </Button>
            </div>
 
            <div className="text-center text-white hidden lg:block">
              <p className="font-semibold text-lg">{recordingData.title}</p>
              <p className="text-sm text-white/60">Recorded on {recordingData.date}</p>
            </div>
 
            <div className="flex items-center gap-4">
 
              <Button 
                onClick={handleFavorite}
                className={`w-14 h-14 rounded-full ${
                  recordingData.favorite 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gray-700 hover:bg-gray-600'
                } text-white transition-all`}
              >
                <Heart className={`w-6 h-6 ${recordingData.favorite ? 'fill-white' : ''}`} />
              </Button>
 
              <Button className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all">
                <Maximize2 className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>
 
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl"
            >
              <Card className="w-full shadow-2xl border-t-4 border-t-[#ff691d] bg-gradient-to-br from-gray-900 to-gray-800 rounded-t-3xl rounded-b-none">
                <CardHeader className="relative border-b border-gray-700 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-[#610981] to-[#8b0fa8] shadow-lg">
                        <Settings className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-2xl text-white">Playback Settings</CardTitle>
                    </div>
                    <Button
                      onClick={() => setShowSettings(false)}
                      className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all p-0"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6 max-h-[70vh] overflow-y-auto pb-6">
 
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-[#ff691d]" />
                      <label className="text-sm font-semibold text-white">Video Quality</label>
                    </div>
                    <Select value={videoQuality} onValueChange={setVideoQuality}>
                      <SelectTrigger className="w-full h-11 bg-gray-800/50 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="hd">1080p HD (Recommended)</SelectItem>
                        <SelectItem value="sd">720p SD</SelectItem>
                        <SelectItem value="low">480p Low (Save bandwidth)</SelectItem>
                        <SelectItem value="auto">Auto (Adaptive)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
 
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Play className="w-5 h-5 text-[#ff691d]" />
                      <label className="text-sm font-semibold text-white">Playback Speed</label>
                    </div>
                    <Select value={playbackSpeed} onValueChange={setPlaybackSpeed}>
                      <SelectTrigger className="w-full h-11 bg-gray-800/50 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="0.5">0.5x (Slower)</SelectItem>
                        <SelectItem value="0.75">0.75x</SelectItem>
                        <SelectItem value="1.0">1.0x (Normal)</SelectItem>
                        <SelectItem value="1.25">1.25x</SelectItem>
                        <SelectItem value="1.5">1.5x (Faster)</SelectItem>
                        <SelectItem value="2.0">2.0x</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
 
                  <div className="p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700">
                    <p className="text-sm font-semibold text-white mb-3">Recording Details</p>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Recorded:</span>
                        <span className="font-medium">{recordingData.date}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Views:</span>
                        <span className="font-medium">{recordingData.views}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Rating:</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{recordingData.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
 
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => {
                        toast.success('Settings applied');
                        setShowSettings(false);
                      }}
                      className="flex-1 bg-gradient-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca] text-white h-11 font-semibold shadow-lg"
                    >
                      Apply Settings
                    </Button>
                    <Button
                      onClick={() => setShowSettings(false)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white h-11 font-semibold"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}