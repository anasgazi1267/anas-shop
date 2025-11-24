import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { toast } from 'sonner';
import { UserCircle, Mail, Lock, User } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useUserAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(loginEmail, loginPassword);
      if (error) {
        toast.error(t('Login failed: ', 'লগইন ব্যর্থ হয়েছে: ') + error.message);
        setLoading(false);
        return;
      }

      // Check if user has admin role
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData.user) {
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userData.user.id)
          .eq('role', 'admin')
          .maybeSingle();

        toast.success(t('Login successful!', 'লগইন সফল হয়েছে!'));
        
        // Redirect based on role
        if (userRoles) {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      toast.error(t('Login failed: ', 'লগইন ব্যর্থ হয়েছে: ') + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signUp(signupEmail, signupPassword, signupName);
      if (error) {
        toast.error(t('Signup failed: ', 'সাইনআপ ব্যর্থ হয়েছে: ') + error.message);
      } else {
        toast.success(t('Signup successful! Please check your email.', 'সাইনআপ সফল হয়েছে! আপনার ইমেইল চেক করুন।'));
        navigate('/');
      }
    } catch (error: any) {
      toast.error(t('Signup failed: ', 'সাইনআপ ব্যর্থ হয়েছে: ') + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <UserCircle className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">
              {t('Welcome to Anas Shop', 'আনাস শপে স্বাগতম')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('Login or create an account', 'লগইন করুন অথবা নতুন একাউন্ট তৈরি করুন')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">{t('Login', 'লগইন')}</TabsTrigger>
                <TabsTrigger value="signup">{t('Sign Up', 'সাইনআপ')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">
                      <Mail className="inline h-4 w-4 mr-2" />
                      {t('Email', 'ইমেইল')}
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder={t('your@email.com', 'আপনার@ইমেইল.com')}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">
                      <Lock className="inline h-4 w-4 mr-2" />
                      {t('Password', 'পাসওয়ার্ড')}
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t('Logging in...', 'লগইন হচ্ছে...') : t('Login', 'লগইন')}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">
                      <User className="inline h-4 w-4 mr-2" />
                      {t('Full Name', 'পুরো নাম')}
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder={t('Your Name', 'আপনার নাম')}
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">
                      <Mail className="inline h-4 w-4 mr-2" />
                      {t('Email', 'ইমেইল')}
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder={t('your@email.com', 'আপনার@ইমেইল.com')}
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">
                      <Lock className="inline h-4 w-4 mr-2" />
                      {t('Password', 'পাসওয়ার্ড')}
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t('Signing up...', 'সাইনআপ হচ্ছে...') : t('Sign Up', 'সাইনআপ')}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}
