import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Sparkles, Lock, Mail, ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

export function LoginMinimal() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole] = useState<'admin' | 'tutor' | 'frontline' | 'operations' | 'user'>('admin');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', selectedRole);
    
    if (selectedRole === 'admin') {
      toast.success('Welcome back!');
      navigate('/');
    } else if (selectedRole === 'tutor') {
      toast.success('Welcome back!');
      navigate('/tutor');
    } else if (selectedRole === 'frontline') {
      toast.success('Welcome back!');
      navigate('/frontline');
    } else if (selectedRole === 'operations') {
      toast.success('Welcome back!');
      navigate('/operations');
    } else {
      toast.success('Welcome back!');
      navigate('/user');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white p-4 relative overflow-hidden">
 
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-5" style={{ backgroundColor: '#ff691d' }} />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full blur-3xl opacity-5" style={{ backgroundColor: '#610981' }} />
      
 
      <div className="absolute top-10 right-10 w-2 h-2 rounded-full" style={{ backgroundColor: '#ff691d' }} />
      <div className="absolute bottom-10 left-10 w-2 h-2 rounded-full" style={{ backgroundColor: '#610981' }} />
      <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#ffac96' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
 
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6" style={{ backgroundColor: '#ff691d' }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: '#610981' }}>
            NavYoga Academy
          </h1>
          <p className="text-gray-500">Welcome back</p>
        </motion.div>
 
        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          onSubmit={handleLogin} 
          className="space-y-6"
        >
   
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="you@navyoga.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 pl-12 pr-4 border-gray-200 rounded-xl text-base focus:border-[#ff691d] focus:ring-[#ff691d] transition-all"
              />
            </div>
          </div>
 
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 pl-12 pr-12 border-gray-200 rounded-xl text-base focus:border-[#610981] focus:ring-[#610981] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
 
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-gray-300 text-[#ff691d] focus:ring-[#ff691d]" 
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
            </label>
            <a 
              href="#" 
              className="text-sm font-medium hover:underline transition-colors" 
              style={{ color: '#ff691d' }}
            >
              Forgot password?
            </a>
          </div>
 
          <Button 
            type="submit" 
            className="w-full h-14 text-base font-semibold rounded-xl group transition-all duration-300 hover:shadow-lg"
            style={{ 
              backgroundColor: '#ff691d',
              color: 'white'
            }}
          >
            <span>Sign In</span>
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
 
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or continue with</span>
            </div>
          </div>
 
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              className="h-12 px-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-gray-700 font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              className="h-12 px-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-gray-700 font-medium"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              Facebook
            </button>
          </div>
        </motion.form>
 
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="#" className="font-semibold hover:underline" style={{ color: '#610981' }}>
              Sign up
            </a>
          </p>
        </motion.div>
 
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center mt-12 text-xs text-gray-400"
        >
          © 2026 NavYoga Academy. All rights reserved.
        </motion.div>
      </motion.div>
    </div>
  );
}
