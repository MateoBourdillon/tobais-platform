import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, KeyRound, Shield, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/layout/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import { authEmailSchema, validateEmail, checkEmailAvailability, isEmailLike } from "@/features/auth/validation/email";
import { EmailVerification } from "@/components/auth/email-verification";

type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password' | 'verify-email';

interface AuthState {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  newPassword: string;
  confirmPassword: string;
  code: string;
  mode: AuthMode;
  message: string;
  error: string;
  isLoading: boolean;
  emailValidation: {
    isValid: boolean;
    error: string;
    isChecking: boolean;
    isAvailable: boolean;
  };
  showPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
}

export default function AuthPage() {
  const { t } = useLanguage();
  
  const [state, setState] = useState<AuthState>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    newPassword: '',
    confirmPassword: '',
    code: '',
    mode: 'login',
    message: '',
    error: '',
    isLoading: false,
    emailValidation: {
      isValid: true,
      error: '',
      isChecking: false,
      isAvailable: true
    },
    showPassword: false,
    showNewPassword: false,
    showConfirmPassword: false
  });

  // Check URL parameter to set initial mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const email = urlParams.get('email');
    
    if (mode === 'register') {
      setState(prev => ({ ...prev, mode: 'register' }));
    } else if (mode === 'verify-email') {
      setState(prev => ({ 
        ...prev, 
        mode: 'verify-email',
        email: email || ''
      }));
    }
  }, []);

  // Email validation with debounce
  const validateEmailWithDebounce = useCallback(
    async (email: string, mode: AuthMode) => {
      if (!email.trim()) {
        setState(prev => ({
          ...prev,
          emailValidation: { isValid: true, error: '', isChecking: false, isAvailable: true }
        }));
        return;
      }

      // For login, check format if it looks like an email
      if (mode === 'login' && isEmailLike(email)) {
        const validation = validateEmail(email);
        setState(prev => ({
          ...prev,
          emailValidation: {
            isValid: validation.isValid,
            error: validation.isValid ? '' : validation.error || t('auth.errors.emailInvalid'),
            isChecking: false,
            isAvailable: true
          }
        }));
        return;
      }

      // For register, validate format first
      const validation = validateEmail(email);
      if (!validation.isValid) {
        setState(prev => ({
          ...prev,
          emailValidation: {
            isValid: false,
            error: validation.error || t('auth.errors.emailInvalid'),
            isChecking: false,
            isAvailable: true
          }
        }));
        return;
      }

      // For register, check availability
      if (mode === 'register') {
        setState(prev => ({
          ...prev,
          emailValidation: { isValid: true, error: '', isChecking: true, isAvailable: true }
        }));

        const availability = await checkEmailAvailability(email);
        setState(prev => ({
          ...prev,
          emailValidation: {
            isValid: availability.available,
            error: availability.available ? '' : t('auth.errors.emailAlreadyInUse'),
            isChecking: false,
            isAvailable: availability.available
          }
        }));
      } else {
        setState(prev => ({
          ...prev,
          emailValidation: { isValid: true, error: '', isChecking: false, isAvailable: true }
        }));
      }
    },
    [t]
  );

  // Debounced email validation
  useEffect(() => {
    if (!state.email) return;
    
    const timeoutId = setTimeout(() => {
      validateEmailWithDebounce(state.email, state.mode);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state.email, state.mode, validateEmailWithDebounce]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: { username: string; password: string }) =>
      fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => {
        if (!res.ok) throw new Error('Login failed');
        return res.json();
      }),
    onSuccess: () => {
      window.location.href = '/admin';
    },
    onError: (error: any) => {
      setState(prev => ({
        ...prev,
        error: error.message || 'Error de inicio de sesión',
        isLoading: false
      }));
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: { username: string; email: string; password: string; firstName: string; lastName: string }) =>
      fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.message || 'Registration failed') });
        }
        return res.json();
      }),
    onSuccess: (response: any) => {
      console.log('Registration response:', response);
      
      // Check if email verification is required
      if (response.requiresEmailVerification && response.email) {
        // Set success message and redirect to verification
        setState(prev => ({
          ...prev,
          message: 'Registration successful! Please check your email for verification code.',
          error: '',
          isLoading: false
        }));
        
        // Redirect to email verification page after brief delay
        setTimeout(() => {
          console.log('Redirecting to verification page...');
          window.location.href = `/auth?mode=verify-email&email=${encodeURIComponent(response.email)}`;
        }, 1500);
      } else {
        // Fallback: only redirect to dashboard if email is already verified
        window.location.href = '/dashboard';
      }
    },
    onError: (error: any) => {
      setState(prev => ({
        ...prev,
        error: error.message || 'Error de registro',
        isLoading: false
      }));
    }
  });

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) =>
      fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      }).then(res => {
        if (!res.ok) throw new Error('Failed to send code');
        return res.json();
      }),
    onSuccess: () => {
      setState(prev => ({
        ...prev,
        mode: 'reset-password',
        message: 'Revisa tu correo electrónico para el código de restablecimiento',
        error: '',
        isLoading: false
      }));
    },
    onError: (error: any) => {
      setState(prev => ({
        ...prev,
        error: error.message || 'Error al enviar código',
        isLoading: false
      }));
    }
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (data: { email: string; code: string; newPassword: string }) =>
      fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => {
        if (!res.ok) throw new Error('Failed to reset password');
        return res.json();
      }),
    onSuccess: () => {
      setState(prev => ({
        ...prev,
        mode: 'login',
        message: 'Contraseña restablecida exitosamente. Ahora puedes iniciar sesión.',
        error: '',
        email: '',
        code: '',
        newPassword: '',
        confirmPassword: '',
        isLoading: false
      }));
    },
    onError: (error: any) => {
      setState(prev => ({
        ...prev,
        error: error.message || t('auth.errors.resetPassword', 'Error resetting password'),
        isLoading: false
      }));
    }
  });

  // Resend OTP mutation
  const resendOTPMutation = useMutation({
    mutationFn: (data: { email: string; type: string }) =>
      fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => {
        if (!res.ok) throw new Error('Failed to resend code');
        return res.json();
      }),
    onSuccess: () => {
      setState(prev => ({
        ...prev,
        message: t('auth.messages.codeSent', 'New code sent to your email'),
        error: '',
        isLoading: false
      }));
    },
    onError: (error: any) => {
      setState(prev => ({
        ...prev,
        error: error.message || t('auth.errors.sendingCode', 'Error sending code'),
        isLoading: false
      }));
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, error: '', message: '', isLoading: true }));

    if (state.mode === 'login') {
      if (!state.email || !state.password) {
        setState(prev => ({ 
          ...prev, 
          error: t('auth.errors.emailPasswordRequired', 'Email and password are required'),
          isLoading: false 
        }));
        return;
      }
      
      // Validate email format if it looks like an email
      if (isEmailLike(state.email) && !state.emailValidation.isValid) {
        setState(prev => ({ 
          ...prev, 
          error: state.emailValidation.error || t('auth.errors.emailInvalid'),
          isLoading: false 
        }));
        return;
      }
      
      // Normalize email before sending to server
      let identifierToSend = state.email;
      if (isEmailLike(state.email)) {
        const validation = validateEmail(state.email);
        if (validation.isValid && validation.normalized) {
          identifierToSend = validation.normalized;
        }
      }
      
      loginMutation.mutate({ username: identifierToSend, password: state.password });
    } 
    else if (state.mode === 'register') {
      if (!state.username || !state.email || !state.password || !state.firstName || !state.lastName) {
        setState(prev => ({ 
          ...prev, 
          error: t('auth.errors.allFieldsRequired', 'All fields are required'),
          isLoading: false 
        }));
        return;
      }
      
      // Validate email format and availability
      if (!state.emailValidation.isValid) {
        setState(prev => ({ 
          ...prev, 
          error: state.emailValidation.error || t('auth.errors.emailInvalid'),
          isLoading: false 
        }));
        return;
      }
      
      if (state.password.length < 8) {
        setState(prev => ({ 
          ...prev, 
          error: t('auth.errors.passwordTooShort', 'Password must be at least 8 characters'),
          isLoading: false 
        }));
        return;
      }
      
      // Normalize email before sending to server
      const validation = validateEmail(state.email);
      const normalizedEmail = validation.normalized || state.email;
      
      registerMutation.mutate({
        username: state.username,
        email: normalizedEmail,
        password: state.password,
        firstName: state.firstName,
        lastName: state.lastName
      });
    } 
    else if (state.mode === 'forgot-password') {
      if (!state.email) {
        setState(prev => ({ 
          ...prev, 
          error: t('auth.errors.emailRequired', 'Email is required'),
          isLoading: false 
        }));
        return;
      }
      
      // Validate email format
      if (!state.emailValidation.isValid) {
        setState(prev => ({ 
          ...prev, 
          error: state.emailValidation.error || t('auth.errors.emailInvalid'),
          isLoading: false 
        }));
        return;
      }
      
      // Normalize email before sending to server
      const validation = validateEmail(state.email);
      const normalizedEmail = validation.normalized || state.email;
      
      forgotPasswordMutation.mutate(normalizedEmail);
    }
    else if (state.mode === 'reset-password') {
      if (!state.email || !state.code || !state.newPassword) {
        setState(prev => ({ 
          ...prev, 
          error: t('auth.errors.allFieldsRequired', 'All fields are required'),
          isLoading: false 
        }));
        return;
      }
      if (state.newPassword !== state.confirmPassword) {
        setState(prev => ({ 
          ...prev, 
          error: t('auth.errors.passwordMismatch', 'Passwords do not match'),
          isLoading: false 
        }));
        return;
      }
      if (state.newPassword.length < 8) {
        setState(prev => ({ 
          ...prev, 
          error: t('auth.errors.passwordTooShort', 'Password must be at least 8 characters'),
          isLoading: false 
        }));
        return;
      }
      resetPasswordMutation.mutate({
        email: state.email,
        code: state.code,
        newPassword: state.newPassword
      });
    }
  };

  const handleResendOTP = () => {
    if (!state.email) return;
    setState(prev => ({ ...prev, isLoading: true }));
    resendOTPMutation.mutate({
      email: state.email,
      type: 'password-reset'
    });
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-900">
      {/* Navbar */}
      <Navbar />
      
      {/* Hero section with consistent styling */}
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 dark:from-slate-800 dark:via-blue-800 dark:to-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-violet-600/20" />
        
        <div className="relative z-10 px-4 py-16 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white rounded-sm" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg blur-lg opacity-30 animate-pulse" />
            </div>
            <h1 className="ml-3 text-2xl font-bold text-white">TOBAIS</h1>
          </div>
          <p className="text-slate-300 text-sm">{t('hero.subtitle', 'Digital Marketing Solutions')}</p>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <div className="w-full max-w-md">
          {/* Auth Card */}
          <Card className="border border-slate-200/20 dark:border-slate-700/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-xl">
            <CardHeader className="text-center space-y-4 pb-6">
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                {state.mode === 'login' ? t('auth.loginTitle', 'Welcome Back') :
                 state.mode === 'register' ? t('auth.registerTitle', 'Create Account') :
                 state.mode === 'forgot-password' ? t('auth.forgotPasswordTitle', 'Reset Password') :
                 state.mode === 'verify-email' ? 'Verify Your Email' :
                 t('auth.resetPasswordTitle', 'Create New Password')}
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 text-base">
                {state.mode === 'login' ? t('auth.loginSubtitle', 'Sign in to access your account') :
                 state.mode === 'register' ? t('auth.registerSubtitle', 'Join TOBAIS to transform your digital presence') :
                 state.mode === 'forgot-password' ? t('auth.forgotPasswordSubtitle', 'Enter your email to receive a verification code') :
                 state.mode === 'verify-email' ? 'Enter the verification code sent to your email' :
                 t('auth.resetPasswordSubtitle', 'Enter the code and your new password')}
              </CardDescription>
            </CardHeader>
          
          <CardContent className="px-6 pb-6">
            {/* Show email verification form if in verify-email mode */}
            {state.mode === 'verify-email' && (
              <EmailVerification />
            )}
            
            {/* Regular auth forms */}
            {state.mode !== 'verify-email' && (
            <>
            {/* Tabs para alternar entre Login y Register */}
            {(['login', 'register'].includes(state.mode)) && (
              <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1.5 mb-6">
                <button
                  type="button"
                  onClick={() => setState(prev => ({ ...prev, mode: 'login', error: '', message: '' }))}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    state.mode === 'login'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {t('auth.loginTitle', 'Welcome Back')}
                </button>
                <button
                  type="button"
                  onClick={() => setState(prev => ({ ...prev, mode: 'register', error: '', message: '' }))}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    state.mode === 'register'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {t('auth.registerTitle', 'Create Account')}
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Username field (solo para register) */}
              {state.mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-700 dark:text-slate-300 font-medium">{t('auth.username', 'Username')}</Label>
                  <Input
                    id="username"
                    type="text"
                    value={state.username}
                    onChange={(e) => setState(prev => ({ ...prev, username: e.target.value }))}
                    placeholder={t('auth.placeholders.username', 'your@email.com')}
                    className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-500 dark:focus:border-violet-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-violet-500"
                    required
                  />
                </div>
              )}

              {/* Email field */}
              {(['login', 'register', 'forgot-password', 'reset-password'].includes(state.mode)) && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">
                    {t('auth.email', 'Email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={state.email}
                    onChange={(e) => setState(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={t('auth.placeholders.email', 'your@email.com')}
                    className={`h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-500 dark:focus:border-violet-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-violet-500 disabled:opacity-50 ${
                      state.emailValidation.error ? 'border-red-500 dark:border-red-400' : ''
                    }`}
                    disabled={state.mode === 'reset-password'}
                    required
                  />
                  {state.emailValidation.isChecking && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <span className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></span>
                      {t('auth.errors.emailCheckingAvailability', 'Checking email availability...')}
                    </p>
                  )}
                  {state.emailValidation.error && !state.emailValidation.isChecking && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {state.emailValidation.error}
                    </p>
                  )}
                </div>
              )}

              {/* Name fields (solo para register) */}
              {state.mode === 'register' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-700 dark:text-slate-300 font-medium">{t('auth.firstName', 'First Name')}</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={state.firstName}
                      onChange={(e) => setState(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder={t('auth.placeholders.firstName', 'John')}
                      className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-500 dark:focus:border-violet-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-violet-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-700 dark:text-slate-300 font-medium">{t('auth.lastName', 'Last Name')}</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={state.lastName}
                      onChange={(e) => setState(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder={t('auth.placeholders.lastName', 'Doe')}
                      className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-500 dark:focus:border-violet-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-violet-500"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Password field */}
              {(['login', 'register'].includes(state.mode)) && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium">{t('auth.password', 'Password')}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={state.showPassword ? "text" : "password"}
                      value={state.password}
                      onChange={(e) => setState(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••"
                      className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-500 dark:focus:border-violet-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-violet-500 pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      onClick={() => setState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                    >
                      {state.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {state.mode === 'register' && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {t('auth.passwordRequirements', 'Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.')}
                    </p>
                  )}
                </div>
              )}

              {/* OTP Code field */}
              {state.mode === 'reset-password' && (
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-slate-700 dark:text-slate-300 font-medium">{t('auth.verificationCode', 'Verification Code')}</Label>
                  <Input
                    id="code"
                    type="text"
                    value={state.code}
                    onChange={(e) => setState(prev => ({ ...prev, code: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    placeholder="123456"
                    className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-500 dark:focus:border-violet-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-violet-500 text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('auth.codeHelp', 'Enter the 6-digit code sent to your email')}</p>
                </div>
              )}

              {/* New Password fields */}
              {state.mode === 'reset-password' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-slate-700 dark:text-slate-300 font-medium">{t('auth.newPassword', 'New Password')}</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={state.showNewPassword ? "text" : "password"}
                        value={state.newPassword}
                        onChange={(e) => setState(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="••••••••"
                        className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-500 dark:focus:border-violet-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-violet-500 pr-10"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        onClick={() => setState(prev => ({ ...prev, showNewPassword: !prev.showNewPassword }))}
                      >
                        {state.showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-300 font-medium">{t('auth.confirmPassword', 'Confirm Password')}</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={state.showConfirmPassword ? "text" : "password"}
                        value={state.confirmPassword}
                        onChange={(e) => setState(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="••••••••"
                        className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-500 dark:focus:border-violet-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-violet-500 pr-10"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        onClick={() => setState(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                      >
                        {state.showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Messages */}
              {state.message && (
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300">
                  <AlertDescription>{state.message}</AlertDescription>
                </Alert>
              )}

              {state.error && (
                <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}

              {/* Submit button */}
              <Button 
                type="submit" 
                disabled={state.isLoading}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-violet-600 dark:from-violet-600 dark:to-blue-600 hover:from-blue-700 hover:to-violet-700 dark:hover:from-violet-700 dark:hover:to-blue-700 text-white font-medium shadow-sm transition-all duration-200"
              >
                {state.isLoading ? t('auth.processing', 'Processing...') : 
                  state.mode === 'login' ? t('auth.loginButton', 'Sign In') :
                  state.mode === 'register' ? t('auth.registerButton', 'Sign Up') :
                  state.mode === 'forgot-password' ? t('auth.forgotPasswordButton', 'Send Code') :
                  state.mode === 'reset-password' ? t('auth.resetPasswordButton', 'Reset Password') :
                  t('common.continue', 'Continue')
                }
              </Button>

              {/* Mode switching */}
              <div className="text-center space-y-2">
                {state.mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setState(prev => ({ 
                      ...prev, 
                      mode: 'forgot-password', 
                      error: '', 
                      message: '' 
                    }))}
                    className="text-sm text-blue-600 dark:text-violet-400 hover:text-blue-700 dark:hover:text-violet-300 underline-offset-4 hover:underline transition-colors"
                  >
                    {t('auth.forgotPasswordLink', 'Forgot your password?')}
                  </button>
                )}

                {state.mode === 'forgot-password' && (
                  <button
                    type="button"
                    onClick={() => setState(prev => ({ 
                      ...prev, 
                      mode: 'login', 
                      error: '', 
                      message: '' 
                    }))}
                    className="text-sm text-blue-600 dark:text-violet-400 hover:text-blue-700 dark:hover:text-violet-300 underline-offset-4 hover:underline transition-colors"
                  >
                    {t('auth.backToLogin', 'Back to login')}
                  </button>
                )}

                {state.mode === 'reset-password' && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={state.isLoading}
                      className="text-sm text-blue-600 dark:text-violet-400 hover:text-blue-700 dark:hover:text-violet-300 underline-offset-4 hover:underline transition-colors disabled:opacity-50"
                    >
                      {t('auth.resendCode', 'Resend code')}
                    </button>
                    <br />
                    <button
                      type="button"
                      onClick={() => setState(prev => ({ 
                        ...prev, 
                        mode: 'login', 
                        error: '', 
                        message: '',
                        code: '',
                        newPassword: '',
                        confirmPassword: ''
                      }))}
                      className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    >
                      {t('auth.backToLogin', 'Back to login')}
                    </button>
                  </div>
                )}
              </div>
            </form>
            </>
            )}
          </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
            <p>{t('footer.copyright', '© 2025 TOBAIS. All rights reserved.')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}