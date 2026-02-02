import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Mail, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

export function EmailVerification() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const { user, refetch } = useAuth();
  const [location] = useLocation();

  useEffect(() => {
    // Get email from URL params or user
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    } else if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          email: email
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify email');
      }

      const data = await response.json();
      setMessage('Email verified successfully! Redirecting...');
      // Redirect to login page after successful verification
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to verify email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          type: 'email-verification'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resend verification code');
      }

      const data = await response.json();
      setMessage('Verification code sent! Check your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-3 mb-6">
        <div className="mx-auto w-12 h-12 bg-violet-100 dark:bg-violet-900 rounded-full flex items-center justify-center">
          <Mail className="h-6 w-6 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Check your email</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            We sent a verification code to{' '}
            <span className="font-medium text-slate-900 dark:text-white">{email}</span>
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        {message && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleVerifyEmail} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-slate-700 dark:text-slate-300 font-medium">
              Verification code
            </Label>
            <Input
              id="code"
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              className="text-center text-xl font-mono tracking-widest"
              disabled={isLoading}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
            disabled={isLoading || code.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </Button>
        </form>

        <div className="text-center space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Didn't receive the code?
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResendCode}
            disabled={isResending}
            className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-violet-900/20"
          >
            {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend code'
              )}
            </Button>
          </div>
      </div>
    </div>
  );
}