import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Video, Mic, MicOff, VideoOff, PhoneOff, MessageSquare, UserCircle, Settings, Maximize2, ArrowLeft, Clock, X, Camera, Speaker, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

export function UserClassSession() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [classData, setClassData] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
 
  const [selectedCamera, setSelectedCamera] = useState("default");
  const [selectedMicrophone, setSelectedMicrophone] = useState("default");
  const [selectedSpeaker, setSelectedSpeaker] = useState("default");
  const [videoQuality, setVideoQuality] = useState("hd");
  const [enableNoiseCancellation, setEnableNoiseCancellation] = useState(true);
 
  useEffect(() => {
    const mockClasses = [
      { 
        id: '1', 
        name: 'Advanced Hatha Yoga', 
        instructor: 'Priya Sharma', 
        duration: '60 min',
        enrolled: '24/30',
      },
      { 
        id: '2', 
        name: 'Pranayama Basics', 
        instructor: 'Rahul Kumar', 
        duration: '45 min',
        enrolled: '18/25',
      },
      { 
        id: '3', 
        name: 'Meditation & Mindfulness', 
        instructor: 'Anita Verma', 
        duration: '30 min',
        enrolled: '32/40',
      },
      { 
        id: '4', 
        name: 'Power Yoga Flow', 
        instructor: 'Vikram Singh', 
        duration: '75 min',
        enrolled: '20/25',
      },
    ];

    const foundClass = mockClasses.find(c => c.id === classId);
    setClassData(foundClass || mockClasses[0]);
  }, [classId]);

  const handleLeaveClass = () => {
    toast.success('You have left the class');
    navigate('/user/classes');
  };

  if (!classData) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading class session...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
 
      <div className="flex-1 relative bg-gradient-to-br from-gray-900 to-black">
    
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-orange-900/30 backdrop-blur-sm" />
            <div className="relative text-center text-white z-10">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Video className="w-32 h-32 mx-auto mb-6 opacity-50" />
              </motion.div>
              <h2 className="text-4xl font-bold mb-2">{classData.name}</h2>
              <p className="text-xl text-white/80 mb-4">with {classData.instructor}</p>
              <div className="flex items-center justify-center gap-4">
                <Badge className="bg-green-500/90 text-white text-base px-4 py-2">
                  <div className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse" />
                  LIVE
                </Badge>
                <Badge className="bg-white/20 text-white text-base px-4 py-2">
                  {classData.enrolled} participants
                </Badge>
              </div>
              <p className="text-sm text-white/60 mt-4">Live video streaming in progress...</p>
            </div>
          </div>
        </div>
 
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-4 right-4 w-64 h-48 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20"
        >
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            {isVideoOn ? (
              <div className="text-center text-white">
                <UserCircle className="w-20 h-20 mx-auto mb-2 opacity-50" />
                <p className="text-sm">You</p>
              </div>
            ) : (
              <div className="text-center text-white">
                <VideoOff className="w-20 h-20 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Camera Off</p>
              </div>
            )}
          </div>
        </motion.div>
 
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md rounded-xl p-4 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-sm font-bold">{classData.instructor.split(' ').map((n: string) => n[0]).join('')}</span>
            </div>
            <div>
              <p className="font-semibold">{classData.instructor}</p>
              <p className="text-xs text-white/70">Instructor</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            <span>{classData.duration} session</span>
          </div>
        </div>
 
        <div className="absolute bottom-24 left-4 bg-red-500/90 backdrop-blur-md rounded-full px-4 py-2 text-white font-semibold flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
          <span>LIVE • 23:45</span>
        </div>
      </div>
 
      <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 p-6 border-t border-gray-800">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
 
            <Button
              onClick={handleLeaveClass}
              className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
 
            <Button
              onClick={() => setIsMuted(!isMuted)}
              className={`w-14 h-14 rounded-full ${
                isMuted 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-gray-700 hover:bg-gray-600'
              } text-white transition-all`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>
 
            <Button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`w-14 h-14 rounded-full ${
                !isVideoOn 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-gray-700 hover:bg-gray-600'
              } text-white transition-all`}
            >
              {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>
 
            <Button
              onClick={() => setShowSettings(!showSettings)}
              className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all"
            >
              <Settings className="w-6 h-6" />
            </Button>
          </div>
 
          <div className="text-center text-white">
            <p className="font-semibold text-lg">{classData.name}</p>
            <p className="text-sm text-white/60">Live Session</p>
          </div>
 
          <div className="flex items-center gap-4">
 
            <Button className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all">
              <MessageSquare className="w-6 h-6" />
            </Button>
 
            <Button className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all">
              <Maximize2 className="w-6 h-6" />
            </Button>
 
            <Button
              onClick={handleLeaveClass}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
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
                      <CardTitle className="text-2xl text-white">Session Settings</CardTitle>
                    </div>
                    <Button
                      onClick={() => setShowSettings(false)}
                      className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all p-0"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6 max-h-[70vh] overflow-y-auto">
 
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-[#ff691d]" />
                      <label className="text-sm font-semibold text-white">Camera</label>
                    </div>
                    <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                      <SelectTrigger className="w-full h-11 bg-gray-800/50 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="default">Built-in Camera (Default)</SelectItem>
                        <SelectItem value="camera1">HD Webcam Pro</SelectItem>
                        <SelectItem value="camera2">External USB Camera</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
 
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mic className="w-5 h-5 text-[#ff691d]" />
                      <label className="text-sm font-semibold text-white">Microphone</label>
                    </div>
                    <Select value={selectedMicrophone} onValueChange={setSelectedMicrophone}>
                      <SelectTrigger className="w-full h-11 bg-gray-800/50 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="default">Built-in Microphone (Default)</SelectItem>
                        <SelectItem value="microphone1">USB Microphone</SelectItem>
                        <SelectItem value="microphone2">Wireless Headset</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
 
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Speaker className="w-5 h-5 text-[#ff691d]" />
                      <label className="text-sm font-semibold text-white">Speaker</label>
                    </div>
                    <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
                      <SelectTrigger className="w-full h-11 bg-gray-800/50 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="default">Built-in Speakers (Default)</SelectItem>
                        <SelectItem value="speaker1">Bluetooth Headphones</SelectItem>
                        <SelectItem value="speaker2">External Speakers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
 
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
                      </SelectContent>
                    </Select>
                  </div>
 
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${enableNoiseCancellation ? 'bg-gradient-to-br from-green-500 to-teal-500' : 'bg-gray-700'} transition-all`}>
                        <Mic className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Noise Cancellation</p>
                        <p className="text-xs text-gray-400">Reduce background noise</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEnableNoiseCancellation(!enableNoiseCancellation)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        enableNoiseCancellation ? 'bg-gradient-to-r from-[#610981] to-[#8b0fa8]' : 'bg-gray-600'
                      }`}
                    >
                      <motion.div
                        animate={{ x: enableNoiseCancellation ? 28 : 2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-1 left-0 w-5 h-5 bg-white rounded-full shadow-lg"
                      />
                    </button>
                  </div>
 
                  <div className="flex gap-3 pt-4 pb-2">
                    <Button
                      onClick={() => {
                        toast.success('Settings saved successfully');
                        setShowSettings(false);
                      }}
                      className="flex-1 bg-gradient-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca] text-white h-11 font-semibold shadow-lg"
                    >
                      Save Changes
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