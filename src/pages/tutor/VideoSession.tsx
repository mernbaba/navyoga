import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  Circle,
  Clock,
  Users,
  MessageSquare,
  Send,
  Camera,
  Settings,
  Maximize2,
} from 'lucide-react';
import { classes, students } from '../../data/mockData';
 
export function VideoSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId');
  const classData = classes.find((c) => c.id === classId);

  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isRecording, setIsRecording] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'students' | 'chat'>('students');
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, student: 'Amit Kumar', message: 'Good morning!', time: '9:00 AM' },
    { id: 2, student: 'Neha Gupta', message: 'Ready for class', time: '9:01 AM' },
  ]);

 
  const enrolledStudents = students.filter((s) =>
    classData?.enrolledStudents.includes(s.id)
  );
 
  const [activeStudents] = useState(
    enrolledStudents.slice(0, Math.max(Math.floor(enrolledStudents.length * 0.8), 1))
  );
 
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);
 
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndSession = () => {
    if (window.confirm('Are you sure you want to end this class session?')) {
      navigate('/tutor/classes');
    }
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: chatMessages.length + 1,
        student: 'You (Instructor)',
        message: chatMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages([...chatMessages, newMessage]);
      setChatMessage('');
    }
  };

  if (!classData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Class not found</h2>
          <Button onClick={() => navigate('/tutor/classes')}>Back to Classes</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] bg-gray-900 flex flex-col overflow-hidden rounded-lg">
   
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">{classData.name}</h1>
            <p className="text-sm text-gray-400">{classData.type}</p>
          </div>
          {isRecording && (
            <Badge className="bg-red-500 text-white animate-pulse">
              <Circle className="w-3 h-3 mr-1 fill-white" />
              Recording
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5" />
            <span className="text-lg font-mono">{formatTime(sessionTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5" />
            <span>{activeStudents.length}/{enrolledStudents.length} Present</span>
          </div>
        </div>
      </div>
 
      <div className="flex-1 flex overflow-hidden min-h-0">
 
        <div className="flex-1 flex flex-col p-4">
 
          <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden relative mb-4">
            {isVideoOn ? (
              <div className="w-full h-full bg-linear-to-br from-purple-900 to-blue-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <Camera className="w-24 h-24 mx-auto mb-4 opacity-50" />
                  <p className="text-xl">Your Camera</p>
                  <p className="text-sm text-gray-300 mt-2">Live streaming to students</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <VideoOff className="w-24 h-24 mx-auto mb-4" />
                  <p className="text-xl">Camera Off</p>
                </div>
              </div>
            )}
 
            {isScreenSharing && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-blue-500 text-white">
                  <Monitor className="w-3 h-3 mr-1" />
                  Sharing Screen
                </Badge>
              </div>
            )}
 
            <button className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors">
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
 
          <div className="bg-gray-800 rounded-lg px-6 py-4 shrink-0">
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`${
                  isVideoOn
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-red-500 hover:bg-red-600'
                } text-white`}
                size="lg"
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>

              <Button
                onClick={() => setIsAudioOn(!isAudioOn)}
                className={`${
                  isAudioOn
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-red-500 hover:bg-red-600'
                } text-white`}
                size="lg"
              >
                {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>

              <Button
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className={`${
                  isScreenSharing
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                } text-white`}
                size="lg"
              >
                <Monitor className="w-5 h-5" />
              </Button>

              <Button
                onClick={() => setIsRecording(!isRecording)}
                className={`${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                } text-white`}
                size="lg"
              >
                <Circle className="w-5 h-5" />
              </Button>

              <Button
                className="bg-gray-700 hover:bg-gray-600 text-white"
                size="lg"
              >
                <Settings className="w-5 h-5" />
              </Button>

              <div className="h-8 w-px bg-gray-600 mx-2" />

              <Button
                onClick={handleEndSession}
                className="bg-red-500 hover:bg-red-600 text-white"
                size="lg"
              >
                <PhoneOff className="w-5 h-5 mr-2" />
                End Class
              </Button>
            </div>
          </div>
        </div>
 
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col shrink-0">
 
          <div className="flex border-b border-gray-700 shrink-0">
            <button
              onClick={() => setActiveTab('students')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'students'
                  ? 'text-white border-b-2 border-[#610981]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Students ({activeStudents.length})
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'text-white border-b-2 border-[#610981]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Chat
            </button>
          </div>
 
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'students' ? (
              <div className="space-y-2">
                {activeStudents.map((student) => (
                  <Card key={student.id} className="p-3 bg-gray-700 border-gray-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white text-sm">
                            {student.name}
                          </p>

                          {student.referralBadge && (
                            <Badge
                              className={`text-[10px] px-2 py-0.5 rounded-full ${
                                student.referralBadge === 'Top Referrer'
                                  ? 'bg-green-500/20 text-green-400'
                                  : student.referralBadge === 'Social Butterfly'
                                  ? 'bg-pink-500/20 text-pink-400'
                                  : student.referralBadge === 'First Steps'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}
                            >
                              {student.referralBadge}
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-gray-400">
                          {student.email}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Badge className="bg-green-500 w-2 h-2 rounded-full p-0" />
                      </div>
                    </div>
                  </Card>
                ))}
                {enrolledStudents.length > activeStudents.length && (
                  <div className="text-center text-gray-400 text-sm py-2">
                    {enrolledStudents.length - activeStudents.length} student(s) not joined yet
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-white text-sm">{msg.student}</p>
                      <span className="text-xs text-gray-400">{msg.time}</span>
                    </div>
                    <p className="text-sm text-gray-300">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
 
          {activeTab === 'chat' && (
            <div className="p-4 border-t border-gray-700 shrink-0">
              <div className="flex gap-2">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-[#610981] hover:bg-[#7a0a9f]"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}