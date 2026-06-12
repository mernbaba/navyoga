import { useState } from "react";
import { useNavigate } from "react-router";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Sparkles, Lock, Mail, Shield, GraduationCap, Phone, Settings, User, Zap, Heart, Crown } from "lucide-react";
import { toast } from "sonner";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<'admin' | 'tutor' | 'frontline' | 'operations' | 'user'>('admin');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple login without validation - any credentials work
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', selectedRole);
    
    if (selectedRole === 'admin') {
      toast.success('Welcome back, Super Admin!');
      navigate('/');
    } else if (selectedRole === 'tutor') {
      toast.success('Welcome back, Yoga Shikshak!');
      navigate('/tutor');
    } else if (selectedRole === 'frontline') {
      toast.success('Welcome back, Frontline Team!');
      navigate('/frontline');
    } else if (selectedRole === 'operations') {
      toast.success('Welcome back, Operations Team!');
      navigate('/operations');
    } else {
      toast.success('Welcome back, Sādhaka!');
      navigate('/user');
    }
  };

  const roles = [
    {
      id: 'admin' as const,
      name: 'Super Admin',
      icon: Shield,
      description: 'Full system access',
      color: '#610981',
      bgColor: '#61098110',
    },
    {
      id: 'tutor' as const,
      name: 'Yoga Shikshak',
      icon: GraduationCap,
      description: 'Manage classes & students',
      color: '#ff691d',
      bgColor: '#ff691d10',
    },
    {
      id: 'frontline' as const,
      name: 'Frontline',
      icon: Phone,
      description: 'Lead management',
      color: '#10b981',
      bgColor: '#10b98110',
    },
    {
      id: 'operations' as const,
      name: 'Operations',
      icon: Settings,
      description: 'Business operations',
      color: '#3b82f6',
      bgColor: '#3b82f610',
    },
    {
      id: 'user' as const,
      name: 'Student',
      icon: User,
      description: 'Sandeep Sandy',
      color: '#ff691d',
      bgColor: '#ff691d10',
    },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff5f0 0%, #ffffff 50%, #f8f0ff 100%)' }}>
 
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #ff691d 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #610981 0%, transparent 70%)' }} />
      <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #ffac96 0%, transparent 70%)' }} />
 
      <div className="absolute top-20 left-20 w-16 h-16 rounded-full opacity-10 animate-pulse" style={{ backgroundColor: '#ff691d' }} />
      <div className="absolute top-40 right-32 w-12 h-12 rounded-full opacity-10 animate-pulse" style={{ backgroundColor: '#610981', animationDelay: '1s' }} />
      <div className="absolute bottom-32 right-20 w-20 h-20 rounded-full opacity-10 animate-pulse" style={{ backgroundColor: '#ffac96', animationDelay: '2s' }} />
      <div className="absolute bottom-40 left-32 w-10 h-10 rounded-full opacity-10 animate-pulse" style={{ backgroundColor: '#ff691d', animationDelay: '1.5s' }} />

      <div className="w-full max-w-6xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
 
          <div className="hidden lg:block space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border-2" style={{ borderColor: '#ff691d20', backgroundColor: '#ff691d10' }}>
                <Sparkles className="w-5 h-5" style={{ color: '#ff691d' }} />
                <span className="text-sm font-semibold" style={{ color: '#ff691d' }}>Welcome to Navyoga Wellness</span>
              </div>
              
              <h1 className="text-5xl font-bold leading-tight" style={{ color: '#610981' }}>
                Transform Your<br />
                <span style={{ color: '#ff691d' }}>Yoga Journey</span>
              </h1>
              
              <p className="text-lg text-gray-600">
                Access your personalized dashboard and manage your yoga practice with ease.
              </p>
            </div>
 
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl border" style={{ borderColor: '#ff691d20', backgroundColor: 'white' }}>
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#ff691d20' }}>
                  <Zap className="w-6 h-6" style={{ color: '#ff691d' }} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: '#610981' }}>Live Interactive Classes</h3>
                  <p className="text-sm text-gray-600">Join real-time sessions with expert instructors</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl border" style={{ borderColor: '#61098120', backgroundColor: 'white' }}>
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#61098120' }}>
                  <Heart className="w-6 h-6" style={{ color: '#610981' }} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: '#610981' }}>Self-Paced Learning</h3>
                  <p className="text-sm text-gray-600">Practice at your own pace with recorded sessions</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl border" style={{ borderColor: '#ffac9620', backgroundColor: 'white' }}>
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#ffac9620' }}>
                  <GraduationCap className="w-6 h-6" style={{ color: '#ff691d' }} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: '#610981' }}>Teacher Training</h3>
                  <p className="text-sm text-gray-600">Become a certified yoga instructor</p>
                </div>
              </div>
            </div>
          </div>
 
          <div className="w-full">
            <Card className="w-full shadow-2xl border-0" style={{ backgroundColor: 'white' }}>
              <CardHeader className="space-y-4 text-center pb-6">
                <div className="flex justify-center">
                  <div className="p-4 rounded-2xl shadow-lg" style={{ background: 'linear-gradient(135deg, #ff691d 0%, #610981 100%)' }}>
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold" style={{ color: '#610981' }}>
                    Sign In
                  </CardTitle>
                  <CardDescription className="text-base mt-2 text-gray-600">
                    Enter your credentials to access your account
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
 
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#610981' }}>
                      <Mail className="w-4 h-4" style={{ color: '#ff691d' }} />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="text"
                      placeholder="your.email@navyoga.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 border-2 border-gray-200 focus:border-[#ff691d] transition-colors bg-gray-50 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#610981' }}>
                      <Lock className="w-4 h-4" style={{ color: '#ff691d' }} />
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 border-2 border-gray-200 focus:border-[#610981] transition-colors bg-gray-50 focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-end text-sm">
                    <a 
                      href="#" 
                      className="font-semibold hover:underline transition-colors" 
                      style={{ color: '#ff691d' }}
                    >
                      Forgot password?
                    </a>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    style={{ 
                      background: 'linear-gradient(135deg, #ff691d 0%, #610981 100%)',
                      color: 'white'
                    }}
                  >
                    Sign In
                  </Button>
                </form>
 
                <div className="pt-4 border-t text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <a href="#" className="font-semibold hover:underline" style={{ color: '#610981' }}>
                      Contact Admin
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
 
            <div className="lg:hidden mt-6 text-center">
              <p className="text-sm text-gray-600">
                © 2026 Navyoga Wellness. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
 
      <div className="absolute top-10 left-10 opacity-5 hidden xl:block">
        <Crown className="w-24 h-24" style={{ color: '#ff691d' }} />
      </div>
      <div className="absolute bottom-10 right-10 opacity-5 hidden xl:block">
        <Heart className="w-20 h-20" style={{ color: '#610981' }} />
      </div>
    </div>
  );
}