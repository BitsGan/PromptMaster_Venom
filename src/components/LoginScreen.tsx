import React, { useState } from "react";
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  db
} from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Mail, Lock, Eye, EyeOff, User, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";

interface LoginScreenProps {
  onAuthSuccess: (user: any) => void;
  onProceedAsGuest: () => void;
}

export default function LoginScreen({ onAuthSuccess, onProceedAsGuest }: LoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const displayAlert = (text: string, type: "success" | "error" = "error") => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 5000);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        onAuthSuccess(result.user);
      }
    } catch (err: any) {
      console.error(err);
      displayAlert(err.message || "Could not authenticate with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      displayAlert("Please fill in both email and password");
      return;
    }
    
    setIsLoading(true);
    try {
      if (isSignUp) {
        // Registering a new account
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (result.user) {
          const nameToSet = displayName.trim() || "Explorer";
          const photoURLToSet = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(nameToSet)}`;
          
          try {
            await updateProfile(result.user, {
              displayName: nameToSet,
              photoURL: photoURLToSet
            });
          } catch (profileErr) {
            console.error("Error setting displayName profile:", profileErr);
          }

          // Pre-seed profile on the database immediately to bypass fallback values during auth timing
          try {
            const userRef = doc(db, "users", result.user.uid);
            await setDoc(userRef, {
              uid: result.user.uid,
              email: result.user.email || email.trim(),
              displayName: nameToSet,
              photoURL: photoURLToSet,
              completedLevels: [],
              totalScore: 0,
              highScores: {},
              timeTrialBestTimes: {},
              timeTrialSuccesses: [],
              completedDailyChallenges: [],
              dailyHighScores: {},
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } catch (dbErr) {
            console.error("Failed to seed new user profile during signup:", dbErr);
          }

          onAuthSuccess(result.user);
        }
      } else {
        // Logging in
        const result = await signInWithEmailAndPassword(auth, email, password);
        if (result.user) {
          onAuthSuccess(result.user);
        }
      }
    } catch (err: any) {
      console.error(err);
      let standardMsg = err.message || "Authentication failed";
      if (err.code === "auth/invalid-credential") {
        standardMsg = "Invalid email or password combination.";
      } else if (err.code === "auth/email-already-in-use") {
        standardMsg = "This email is already registered.";
      } else if (err.code === "auth/weak-password") {
        standardMsg = "Password must be at least 6 characters.";
      }
      displayAlert(standardMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      displayAlert("Please enter your registered email address.");
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      displayAlert("We've dispatched a password reset link to your email/Gmail!", "success");
      setIsForgotPassword(false);
    } catch (err: any) {
      console.error(err);
      displayAlert(err.message || "Failed to deliver reset email. Verify your inputs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/25 via-[#09090c] to-[#040406] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background ambient grids and spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        
        {/* LOGO AREA */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl font-extrabold text-2xl text-white shadow-lg shadow-indigo-500/20 mb-3">
            P
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-sans">
            PromptMaster<span className="text-indigo-400">.ai</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-mono tracking-wide uppercase">
            Visual Prompt Engineering Academy
          </p>
        </div>

        {/* CONTAINER CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative"
        >
          {/* SUCCESS / ERROR ALERTS */}
          <AnimatePresence>
            {alertMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-3 rounded-lg border text-xs font-mono mb-4 text-left ${
                  alertMsg.type === "success" 
                    ? "bg-emerald-950/30 border-emerald-500/20 text-emerald-400" 
                    : "bg-rose-950/30 border-rose-500/20 text-rose-400"
                }`}
              >
                {alertMsg.text}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isForgotPassword ? (
              // PASSWORD RESET SCREEN
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="text-left space-y-1">
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin-reverse" />
                    Reset Password
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Enter your registered Gmail or email address below. We will send a secure link to reset your credentials.
                  </p>
                </div>

                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full bg-[#111115] border border-zinc-800 focus:border-indigo-500/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-750 text-white font-medium text-xs rounded-xl py-3 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isLoading ? "Sending..." : "Submit Recovery Request"}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setAlertMsg(null);
                    }}
                    className="w-full text-center text-xs text-zinc-400 hover:text-white cursor-pointer underline font-mono"
                  >
                    Back to Sign In
                  </button>
                </form>
              </motion.div>
            ) : (
              // MAIN SIGN-IN / SIGN-UP FORM
              <motion.div
                key="auth"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-5"
              >
                {/* SELECTOR TAB */}
                <div className="grid grid-cols-2 p-1 bg-zinc-950/60 border border-zinc-850 rounded-xl">
                  <button
                    onClick={() => {
                      setIsSignUp(false);
                      setAlertMsg(null);
                    }}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      !isSignUp ? "bg-zinc-850 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setIsSignUp(true);
                      setAlertMsg(null);
                    }}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      isSignUp ? "bg-zinc-850 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Register
                  </button>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {isSignUp && (
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block font-bold">Display Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your Prompter Nickname"
                          className="w-full bg-[#111115] border border-zinc-800 focus:border-indigo-500/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-650 outline-none transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block font-bold">Email/Gmail</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="username@gmail.com"
                        className="w-full bg-[#111115] border border-zinc-800 focus:border-indigo-500/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-650 outline-none transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block font-bold">Password</label>
                      {!isSignUp && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgotPassword(true);
                            setAlertMsg(null);
                          }}
                          className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#111115] border border-zinc-800 focus:border-indigo-500/50 rounded-xl pl-9 pr-10 py-2.5 text-sm text-zinc-200 placeholder-zinc-650 outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-zinc-500 hover:text-zinc-300 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-750 text-white font-medium text-xs rounded-xl py-3 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
                  >
                    {isLoading ? "Validating Account..." : isSignUp ? "Create Academy Account" : "Access Academy Hub"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="relative flex items-center justify-center py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-800"></div>
                  </div>
                  <span className="relative bg-zinc-900 px-3 text-[10px] uppercase font-mono text-zinc-500 tracking-wider">
                    Or secure sync
                  </span>
                </div>

                {/* SIGN IN WITH GOOGLE/GMAILS */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full bg-zinc-950/50 hover:bg-zinc-800/60 border border-zinc-800 hover:border-indigo-500/30 text-zinc-200 font-sans font-medium text-xs rounded-xl py-3 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span>Connect with Google Gmail</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 pt-5 border-t border-zinc-850/80 text-center">
            <button
              onClick={onProceedAsGuest}
              className="text-xs text-zinc-500 hover:text-zinc-350 underline cursor-pointer hover:font-bold"
            >
              Explore Academy missions as Guest
            </button>
          </div>
        </motion.div>

        {/* FOOTER DETAILS */}
        <p className="text-[10px] text-zinc-600 font-mono text-center mt-6 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
          End-to-end encrypted profile hosting via Firebase Firestore
        </p>
      </div>
    </div>
  );
}
