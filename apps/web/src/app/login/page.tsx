'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authApi.login({ email, password });
      console.log('Login response:', response);
      
      const userData = response.data.data || response.data;
      console.log('User data:', userData);

      setAuth(
        {
          id: userData.user.id,
          email: userData.user.email,
          name: userData.user.name,
          role: userData.user.role,
        },
        userData.accessToken
      );

      toast.success(`Welcome back, ${userData.user.name}!`);
      return router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Login error:', err);
      const error = err as { response?: { data?: { message?: string } }, message?: string };
      toast.error(error.response?.data?.message || error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#F0F4F8] via-[#E2E8F0] to-[#F0F4F8]" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-[#0EA5E9]/10 blur-[100px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-[#0EA5E9]/10 blur-[100px]" />

      <Card className="relative w-full max-w-md mx-4 glass-card border-0 shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#0EA5E9] flex items-center justify-center pulse-glow">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <path d="M9 9h.01" />
              <path d="M15 9h.01" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold gradient-text">SREE ARUMUGAVADIVU</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Dental Clinic Management System
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@dentflow.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/30 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/30 transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-[#0EA5E9] to-[#0EA5E9] hover:from-[#0EA5E9] hover:to-[#0284C7] text-white font-semibold transition-all duration-300"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Internal clinic staff access only
          </p>
        </CardContent>
      </Card>
    </div>
  );
}