import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmail(email, password);
        toast.success("Connexion réussie");
      } else {
        await signUpWithEmail(email, password);
        toast.success("Compte créé avec succès");
      }
      onSuccess();
    } catch (error: any) {
      console.error(error);
      const msg = error.message || "Une erreur est survenue.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Connexion avec Google réussie");
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error("Échec de la connexion Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm shadow-2xl">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-white/10 shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
          {isLogin ? 'Bienvenue' : 'Créer un compte'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-8 text-sm">
          {isLogin ? 'Connectez-vous pour gérer votre établissement.' : 'Rejoignez-nous et monétisez votre Wi-Fi.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="vous@exemple.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-70 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
          >
            {loading ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLogin ? (
              <><LogIn size={18} /> Se connecter</>
            ) : (
              <><UserPlus size={18} /> S'inscrire</>
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 dark:bg-white/10"></div>
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">OU</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-white/10"></div>
        </div>

        <button 
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuer avec Google
        </button>

        <div className="mt-8 text-center text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            {isLogin ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}
          </span>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
          >
            {isLogin ? "S'inscrire" : "Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}
