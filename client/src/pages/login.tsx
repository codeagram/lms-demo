import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, isLoginPending } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login({ email, password });
      toast({
        title: "Login Successful",
        description: "Welcome to Loan Management System",
        variant: "default",
      });
      // Force page reload to ensure proper state update
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
    }
  };

  const fillDemoCredentials = (role: 'admin' | 'staff') => {
    if (role === 'admin') {
      setEmail('admin@lms.com');
      setPassword('admin123');
    } else {
      setEmail('staff@lms.com');
      setPassword('staff123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(145deg, hsl(215, 20%, 98%) 0%, hsl(215, 16%, 87%) 100%)' }}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#A855F7' }}>
            <Building2 className="text-white text-2xl" size={32} />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Loan Management System
          </CardTitle>
          <CardDescription>
            Professional Finance Platform
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@lms.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
            </div>
            
            <Button
              type="submit"
              className="lara-button-primary w-full"
              disabled={isLoginPending}
            >
              {isLoginPending ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
            <p><strong>Demo Accounts:</strong></p>
            <div className="flex space-x-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fillDemoCredentials('admin')}
                className="text-xs"
              >
                Admin Demo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fillDemoCredentials('staff')}
                className="text-xs"
              >
                Staff Demo
              </Button>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              <p><strong>Admin:</strong> admin@lms.com / admin123</p>
              <p><strong>Staff:</strong> staff@lms.com / staff123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
