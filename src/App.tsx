import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Terminal, 
  Award, 
  Zap, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  RotateCcw, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  ArrowRight,
  Sparkles,
  Info,
  Layers,
  Flame,
  Check,
  Timer,
  TrendingUp
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from "recharts";
import PromptCanvas from "./components/PromptCanvas";
import LoginScreen from "./components/LoginScreen";
import { Level, EvaluationResult, UserStats, VisualElement } from "./types";

// Firebase Imports
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  handleFirestoreError, 
  OperationType 
} from "./firebase";
import { 
  setDoc, 
  getDoc, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";

// Define target image path constants
import targetLevel1 from "./assets/images/level1_autumn_fruit_1781794213032.jpg";
import targetLevel2 from "./assets/images/level2_cyberpunk_alley_1781794228835.jpg";
import targetLevel3 from "./assets/images/level3_lost_astronaut_1781794246577.jpg";
import targetLevel4 from "./assets/images/level4_forest_sanctuary_1781794261683.jpg";
import targetLevel5 from "./assets/images/level5_desert_oasis_1781800619895.jpg";
import targetLevel6 from "./assets/images/level6_volcano_caldera_1781800636569.jpg";
import targetLevel7 from "./assets/images/level7_subsea_coral_1781800652818.jpg";
import targetLevel8 from "./assets/images/level8_steampunk_workshop_1781800669316.jpg";
import targetLevel9 from "./assets/images/level9_retro_arcade_1781800683034.jpg";
import targetLevel10 from "./assets/images/level10_snowy_cabin_1781800699015.jpg";
import targetLevel11 from "./assets/images/level11_celestial_portal_1781800714595.jpg";
import targetDailyChallenge from "./assets/images/challenge_biomechanical_phoenix_1781800729961.jpg";

export default function App() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imageErrorMap, setImageErrorMap] = useState<Record<number, boolean>>({});
  const [compileError, setCompileError] = useState<string | null>(null);
  
  // Gameplay states
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [showResultPanel, setShowResultPanel] = useState<boolean>(false);
  const [showHints, setShowHints] = useState<boolean>(false);
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState<boolean>(false);
  const [isSkillGraphOpen, setIsSkillGraphOpen] = useState<boolean>(false);

  // Time Trial Mode states
  const [isTimeTrialMode, setIsTimeTrialMode] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timeTrialStatus, setTimeTrialStatus] = useState<"idle" | "running" | "success" | "failed">("idle");
  const [isTimeTrialNewRecord, setIsTimeTrialNewRecord] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  const getTimeLimitForLevel = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return 45;
      case "Medium": return 60;
      case "Hard": return 90;
      default: return 60;
    }
  };
  
  // Stats tracked via local storage
  const [stats, setStats] = useState<UserStats>({
    completedLevels: [],
    totalScore: 0,
    highScores: {},
    timeTrialBestTimes: {},
    timeTrialSuccesses: [],
    completedDailyChallenges: [],
    dailyHighScores: {}
  });

  // Firebase integration states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  // Daily Challenge states
  const [isDailyChallengeMode, setIsDailyChallengeMode] = useState<boolean>(false);
  const [dailyChallenge, setDailyChallenge] = useState<Level | null>(null);
  const [loadingDaily, setLoadingDaily] = useState<boolean>(false);

  const getTodayDateStr = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchDailyChallenge = async (currentUserArg: any) => {
    setLoadingDaily(true);
    const dateStr = getTodayDateStr();

    if (!currentUserArg && !isGuest) {
      const dayOfMonth = new Date().getDate();
      const templates = [
        {
          title: "The Biomechanical Phoenix",
          difficulty: "Hard",
          targetKeywords: ["phoenix", "biomechanical", "cybernetic", "gears", "lava", "copper", "wings"],
          hints: "Describe a mechanical fire bird with iron or copper joints and gears rising above magma lava flow.",
          description: "A majestic biomechanical phoenix made of intricate copper gears and cybernetic joints, spreading its fiery metallic wings over a glowing crater of volcanic lava.",
          proceduralTheme: "volcano_caldera"
        },
        {
          title: "Interstellar Tea Garden",
          difficulty: "Hard",
          targetKeywords: ["zen", "astronaut", "nebula", "cherry", "bonsai", "teapot", "cosmic"],
          hints: "Seat an astronaut in deep cosmic space next to a bonsai miniature tree in front of a swirling purple star gas cloud.",
          description: "An astronaut peacefully drinking tea in a cosmic zen garden, sitting cross-legged next to a glowing cherry blossom bonsai tree under a starry violet nebula.",
          proceduralTheme: "celestial_portal"
        },
        {
          title: "Steampunk Marine Laboratory",
          difficulty: "Hard",
          targetKeywords: ["submarine", "steampunk", "octopus", "brass", "glowing", "aquarium", "gears"],
          hints: "Focus on industrial gears, copper valves, steam and a colossal glowing water cylinder holding an octopus.",
          description: "A grand steampunk deep-sea laboratory with rotating brass gears, steam shafts, and an enormous glowing glass water tank holding an exotic bio-luminescent octopus.",
          proceduralTheme: "steampunk_workshop"
        },
        {
          title: "The Crystal Desert Oasis",
          difficulty: "Hard",
          targetKeywords: ["crystal", "prism", "desert", "pyramid", "glowing", "aurora", "dunes"],
          hints: "Describe a colossal crystalline pyramid inside dry sand dunes refracting colorful rainbow prisms under a neon aurora.",
          description: "A glass-like crystalline pyramid standing in a glowing desert under a vibrant neon green aurora, casting refracting rainbow prisms onto sand dunes.",
          proceduralTheme: "desert_oasis"
        },
        {
          title: "Cyberpunk Greenhouse",
          difficulty: "Hard",
          targetKeywords: ["neon", "bioluminescent", "orchids", "cyberpunk", "hologram", "rain", "vines"],
          hints: "Portray glowing digital neon flowers inside a glass conservatory at night under rain droplets reflecting cyan hues.",
          description: "A retro-future cyberpunk glass greenhouse at night, packed with glowing bio-luminescent neon purple orchids and green holographic vines under trickling rain.",
          proceduralTheme: "cyberpunk_alley"
        },
        {
          title: "Lost Arctic Observatory",
          difficulty: "Hard",
          targetKeywords: ["cabin", "telescope", "snowy", "aurora", "stars", "constellations", "glowing"],
          hints: "Introduce a snow covered log cabin with an integrated copper retro telescope tracking cosmic constellations.",
          description: "A rustic wooden cabin adapted into an observatory with a massive copper telescope pointing at glowing blue stars and a swirling green polar aurora.",
          proceduralTheme: "snowy_cabin"
        },
        {
          title: "Atlantis Chrono-Reactor",
          difficulty: "Hard",
          targetKeywords: ["reactor", "coral", "turquoise", "submarine", "ruins", "underwater", "crystals"],
          hints: "Detail a subaquatic machine generator surrounded by turquoise ocean waters, corals, and gold marine relics.",
          description: "A turquoise deep sea reactor core surrounded by ancient submerged pillars, glowing subaquatic crystals, and schools of neon orange fish.",
          proceduralTheme: "subsea_coral"
        }
      ];

      const selectedTemplate = templates[dayOfMonth % templates.length];
      setDailyChallenge({
        id: 100,
        title: selectedTemplate.title,
        difficulty: selectedTemplate.difficulty as any,
        targetImageUrl: targetDailyChallenge,
        targetKeywords: selectedTemplate.targetKeywords,
        hints: selectedTemplate.hints,
        description: selectedTemplate.description,
        proceduralTheme: selectedTemplate.proceduralTheme
      });
      setLoadingDaily(false);
      return;
    }

    const challengeRef = doc(db, "dailyChallenges", dateStr);
    try {
      const snap = await getDoc(challengeRef);
      if (snap.exists()) {
        const data = snap.data();
        setDailyChallenge({
          id: 100,
          title: data.title,
          difficulty: data.difficulty as any || "Hard",
          targetImageUrl: data.targetImageUrl || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&h=400&q=80",
          targetKeywords: data.targetKeywords || [],
          hints: data.hints || "",
          description: data.description || "",
          proceduralTheme: data.proceduralTheme || "cyberpunk_alley"
        });
      } else {
        const dayOfMonth = new Date().getDate();
        const templates = [
          {
            title: "The Biomechanical Phoenix",
            difficulty: "Hard",
            targetKeywords: ["phoenix", "biomechanical", "cybernetic", "gears", "lava", "copper", "wings"],
            hints: "Describe a mechanical fire bird with iron or copper joints and gears rising above magma lava flow.",
            description: "A majestic biomechanical phoenix made of intricate copper gears and cybernetic joints, spreading its fiery metallic wings over a glowing crater of volcanic lava.",
            proceduralTheme: "volcano_caldera"
          },
          {
            title: "Interstellar Tea Garden",
            difficulty: "Hard",
            targetKeywords: ["zen", "astronaut", "nebula", "cherry", "bonsai", "teapot", "cosmic"],
            hints: "Seat an astronaut in deep cosmic space next to a bonsai miniature tree in front of a swirling purple star gas cloud.",
            description: "An astronaut peacefully drinking tea in a cosmic zen garden, sitting cross-legged next to a glowing cherry blossom bonsai tree under a starry violet nebula.",
            proceduralTheme: "celestial_portal"
          },
          {
            title: "Steampunk Marine Laboratory",
            difficulty: "Hard",
            targetKeywords: ["submarine", "steampunk", "octopus", "brass", "glowing", "aquarium", "gears"],
            hints: "Focus on industrial gears, copper valves, steam and a colossal glowing water cylinder holding an octopus.",
            description: "A grand steampunk deep-sea laboratory with rotating brass gears, steam shafts, and an enormous glowing glass water tank holding an exotic bio-luminescent octopus.",
            proceduralTheme: "steampunk_workshop"
          },
          {
            title: "The Crystal Desert Oasis",
            difficulty: "Hard",
            targetKeywords: ["crystal", "prism", "desert", "pyramid", "glowing", "aurora", "dunes"],
            hints: "Describe a colossal crystalline pyramid inside dry sand dunes refracting colorful rainbow prisms under a neon aurora.",
            description: "A glass-like crystalline pyramid standing in a glowing desert under a vibrant neon green aurora, casting refracting rainbow prisms onto sand dunes.",
            proceduralTheme: "desert_oasis"
          },
          {
            title: "Cyberpunk Greenhouse",
            difficulty: "Hard",
            targetKeywords: ["neon", "bioluminescent", "orchids", "cyberpunk", "hologram", "rain", "vines"],
            hints: "Portray glowing digital neon flowers inside a glass conservatory at night under rain droplets reflecting cyan hues.",
            description: "A retro-future cyberpunk glass greenhouse at night, packed with glowing bio-luminescent neon purple orchids and green holographic vines under trickling rain.",
            proceduralTheme: "cyberpunk_alley"
          },
          {
            title: "Lost Arctic Observatory",
            difficulty: "Hard",
            targetKeywords: ["cabin", "telescope", "snowy", "aurora", "stars", "constellations", "glowing"],
            hints: "Introduce a snow covered log cabin with an integrated copper retro telescope tracking cosmic constellations.",
            description: "A rustic wooden cabin adapted into an observatory with a massive copper telescope pointing at glowing blue stars and a swirling green polar aurora.",
            proceduralTheme: "snowy_cabin"
          },
          {
            title: "Atlantis Chrono-Reactor",
            difficulty: "Hard",
            targetKeywords: ["reactor", "coral", "turquoise", "submarine", "ruins", "underwater", "crystals"],
            hints: "Detail a subaquatic machine generator surrounded by turquoise ocean waters, corals, and gold marine relics.",
            description: "A turquoise deep sea reactor core surrounded by ancient submerged pillars, glowing subaquatic crystals, and schools of neon orange fish.",
            proceduralTheme: "subsea_coral"
          }
        ];

        const selectedTemplate = templates[dayOfMonth % templates.length];
        const newChallenge = {
          id: 100,
          title: selectedTemplate.title,
          difficulty: selectedTemplate.difficulty as any,
          targetImageUrl: targetDailyChallenge,
          targetKeywords: selectedTemplate.targetKeywords,
          hints: selectedTemplate.hints,
          description: selectedTemplate.description,
          proceduralTheme: selectedTemplate.proceduralTheme,
          dateStr: dateStr
        };

        if (currentUserArg) {
          try {
            await setDoc(challengeRef, newChallenge);
          } catch (seedErr: any) {
            if (seedErr instanceof Error && (seedErr.message.includes("permission") || seedErr.message.includes("Permission") || (seedErr as any).code === "permission-denied")) {
              try {
                handleFirestoreError(seedErr, OperationType.WRITE, `dailyChallenges/${dateStr}`);
              } catch (thrownErr) {
                console.error("Seeding check permissions successfully registered:", seedErr);
              }
            } else {
              console.error("Failed to globally seed daily challenge:", seedErr);
            }
          }
        }
        setDailyChallenge(newChallenge);
      }
    } catch (err: any) {
      if (err instanceof Error && (err.message.includes("permission") || err.message.includes("Permission") || (err as any).code === "permission-denied")) {
        try {
          handleFirestoreError(err, OperationType.GET, `dailyChallenges/${dateStr}`);
        } catch (thrownErr) {
          console.error("Daily challenge get permissions successfully registered:", err);
          setDailyChallenge({
            id: 100,
            title: "The Biomechanical Phoenix",
            difficulty: "Hard",
            targetImageUrl: targetDailyChallenge,
            targetKeywords: ["phoenix", "biomechanical", "cybernetic", "gears", "lava", "copper", "wings"],
            hints: "Describe a mechanical fire bird with iron or copper joints and gears rising above magma lava flow.",
            description: "A majestic biomechanical phoenix made of intricate copper gears and cybernetic joints, spreading its fiery metallic wings over a glowing crater of volcanic lava.",
            proceduralTheme: "volcano_caldera"
          });
        }
      } else {
        console.error("Firestore Daily Challenge retrieval fail:", err);
        setDailyChallenge({
          id: 100,
          title: "The Biomechanical Phoenix",
          difficulty: "Hard",
          targetImageUrl: targetDailyChallenge,
          targetKeywords: ["phoenix", "biomechanical", "cybernetic", "gears", "lava", "copper", "wings"],
          hints: "Describe a mechanical fire bird with iron or copper joints and gears rising above magma lava flow.",
          description: "A majestic biomechanical phoenix made of intricate copper gears and cybernetic joints, spreading its fiery metallic wings over a glowing crater of volcanic lava.",
          proceduralTheme: "volcano_caldera"
        });
      }
    } finally {
      setLoadingDaily(false);
    }
  };

  useEffect(() => {
    fetchDailyChallenge(currentUser);
  }, [currentUser, isGuest]);

  // Unified saveStats supporting local cache and cloud database
  const saveStats = async (newStats: UserStats, optionalUser: any = auth.currentUser) => {
    setStats(newStats);
    localStorage.setItem("promptmaster_user_stats", JSON.stringify(newStats));

    if (optionalUser) {
      setIsSyncing(true);
      const userRef = doc(db, "users", optionalUser.uid);
      try {
        await updateDoc(userRef, {
          completedLevels: newStats.completedLevels || [],
          totalScore: newStats.totalScore || 0,
          highScores: newStats.highScores || {},
          timeTrialBestTimes: newStats.timeTrialBestTimes || {},
          timeTrialSuccesses: newStats.timeTrialSuccesses || [],
          completedDailyChallenges: newStats.completedDailyChallenges || [],
          dailyHighScores: newStats.dailyHighScores || {},
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        // If updating failed (possibly because document doesn't exist yet but user is signed in), fallback to setDoc
        try {
          await setDoc(userRef, {
            uid: optionalUser.uid,
            email: optionalUser.email || "",
            displayName: optionalUser.displayName || "Explorer",
            photoURL: optionalUser.photoURL || "",
            completedLevels: newStats.completedLevels || [],
            totalScore: newStats.totalScore || 0,
            highScores: newStats.highScores || {},
            timeTrialBestTimes: newStats.timeTrialBestTimes || {},
            timeTrialSuccesses: newStats.timeTrialSuccesses || [],
            completedDailyChallenges: newStats.completedDailyChallenges || [],
            dailyHighScores: newStats.dailyHighScores || {},
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (setErr) {
          try {
            handleFirestoreError(setErr, OperationType.WRITE, `users/${optionalUser.uid}`);
          } catch (e) {
            console.error("Firestore user profile initial setup error:", e);
          }
        }
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Google portal sign-in error:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  };

  // Auth changed hook to manage real-time synchronization
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsSyncing(true);
        setIsGuest(false);

        const userRef = doc(db, "users", user.uid);
        try {
          const docSnap = await getDoc(userRef);

          const localStatsSaved = localStorage.getItem("promptmaster_user_stats");
          let currentLocalStats: UserStats = {
            completedLevels: [],
            totalScore: 0,
            highScores: {},
            timeTrialBestTimes: {},
            timeTrialSuccesses: [],
            completedDailyChallenges: [],
            dailyHighScores: {}
          };
          if (localStatsSaved) {
            try {
              currentLocalStats = JSON.parse(localStatsSaved);
            } catch (e) {
              console.error("Corrupted stats format:", e);
            }
          }

          if (docSnap.exists()) {
            const data = docSnap.data();

            const mergedCompleted = Array.from(new Set([
              ...(data.completedLevels || []),
              ...(currentLocalStats.completedLevels || [])
            ]));

            const mergedTrialSuccess = Array.from(new Set([
              ...(data.timeTrialSuccesses || []),
              ...(currentLocalStats.timeTrialSuccesses || [])
            ]));

            const mergedDailyCompletions = Array.from(new Set([
              ...(data.completedDailyChallenges || []),
              ...(currentLocalStats.completedDailyChallenges || [])
            ]));

            const mergedHighScores: Record<string, number> = { ...(data.highScores || {}) };
            Object.entries(currentLocalStats.highScores || {}).forEach(([key, val]) => {
              mergedHighScores[key] = Math.max(mergedHighScores[key] || 0, val as number);
            });

            const mergedDailyHighScores: Record<string, number> = { ...(data.dailyHighScores || {}) };
            Object.entries(currentLocalStats.dailyHighScores || {}).forEach(([key, val]) => {
              mergedDailyHighScores[key] = Math.max(mergedDailyHighScores[key] || 0, val as number);
            });

            const mergedTrialTimes: Record<string, number> = { ...(data.timeTrialBestTimes || {}) };
            Object.entries(currentLocalStats.timeTrialBestTimes || {}).forEach(([key, val]) => {
              mergedTrialTimes[key] = Math.max(mergedTrialTimes[key] || 0, val as number);
            });

            const mergedTotalScore = 
              Object.values(mergedHighScores).reduce((sum, val) => sum + (val as number), 0) +
              Object.values(mergedDailyHighScores).reduce((sum, val) => sum + (val as number), 0);

            const mergedStats: UserStats = {
              completedLevels: mergedCompleted,
              totalScore: mergedTotalScore,
              highScores: mergedHighScores,
              timeTrialBestTimes: mergedTrialTimes,
              timeTrialSuccesses: mergedTrialSuccess,
              completedDailyChallenges: mergedDailyCompletions,
              dailyHighScores: mergedDailyHighScores
            };

            await saveStats(mergedStats, user);
          } else {
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email || "",
              displayName: user.displayName || "Explorer",
              photoURL: user.photoURL || "",
              completedLevels: currentLocalStats.completedLevels || [],
              totalScore: currentLocalStats.totalScore || 0,
              highScores: currentLocalStats.highScores || {},
              timeTrialBestTimes: currentLocalStats.timeTrialBestTimes || {},
              timeTrialSuccesses: currentLocalStats.timeTrialSuccesses || [],
              completedDailyChallenges: currentLocalStats.completedDailyChallenges || [],
              dailyHighScores: currentLocalStats.dailyHighScores || {},
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            await saveStats(currentLocalStats, user);
          }
        } catch (error) {
          try {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          } catch (jsonErr) {
            console.error("Firestore loading error:", jsonErr);
          }
        } finally {
          setIsSyncing(false);
        }
      } else {
        setCurrentUser(null);
        const saved = localStorage.getItem("promptmaster_user_stats");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setStats({
              completedLevels: parsed.completedLevels || [],
              totalScore: parsed.totalScore || 0,
              highScores: parsed.highScores || {},
              timeTrialBestTimes: parsed.timeTrialBestTimes || {},
              timeTrialSuccesses: parsed.timeTrialSuccesses || [],
              completedDailyChallenges: parsed.completedDailyChallenges || [],
              dailyHighScores: parsed.dailyHighScores || {}
            });
          } catch (e) {
            console.error("Local storage recovery fallback error:", e);
          }
        } else {
          setStats({
            completedLevels: [],
            totalScore: 0,
            highScores: {},
            timeTrialBestTimes: {},
            timeTrialSuccesses: [],
            completedDailyChallenges: [],
            dailyHighScores: {}
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Load level metadata on mount
  useEffect(() => {
    fetch("/api/levels")
      .then((res) => res.json())
      .then((data: Level[]) => {
        // Map dynamic imported URLs to metadata; fallback to server-set URLs for levels 5-11
        const mappedLevels = data.map((l) => {
          let url = l.targetImageUrl || "";
          if (l.id === 1) url = targetLevel1;
          else if (l.id === 2) url = targetLevel2;
          else if (l.id === 3) url = targetLevel3;
          else if (l.id === 4) url = targetLevel4;
          else if (l.id === 5) url = targetLevel5;
          else if (l.id === 6) url = targetLevel6;
          else if (l.id === 7) url = targetLevel7;
          else if (l.id === 8) url = targetLevel8;
          else if (l.id === 9) url = targetLevel9;
          else if (l.id === 10) url = targetLevel10;
          else if (l.id === 11) url = targetLevel11;
          return { ...l, targetImageUrl: url };
        });
        setLevels(mappedLevels);
      })
      .catch((err) => {
        console.error("Failed fetching levels from API, applying placeholders:", err);
        // Robust fallback schema matching backend
        setLevels([
          {
            id: 1,
            title: "The Autumn Fruit",
            difficulty: "Easy",
            targetImageUrl: targetLevel1,
            targetKeywords: ["apple", "red", "wooden", "table", "rustic"],
            hints: "Describe a main red object (apple) resting on a specific texture and material surface (rustic wood table).",
            description: "A ripe red apple resting on a rustic wooden table with realistic grain.",
            proceduralTheme: "autumn_fruit"
          },
          {
            id: 2,
            title: "Cyberpunk Alley",
            difficulty: "Medium",
            targetImageUrl: targetLevel2,
            targetKeywords: ["rainy", "alley", "neon", "purple", "cyan", "cyberpunk"],
            hints: "Incorporate weather conditions (rain, wet floor), futuristic vibes (cyberpunk alley), and bright glowing signage (neon cyan and purple signs).",
            description: "A narrow rainy cyberpunk neon alley with glowing purple and cyan signs reflecting on wet asphalt.",
            proceduralTheme: "cyberpunk_alley"
          },
          {
            id: 3,
            title: "Lost Astronaut",
            difficulty: "Hard",
            targetImageUrl: targetLevel3,
            targetKeywords: ["astronaut", "floating", "space", "cosmic", "yellow", "balloon"],
            hints: "Center a human in a suit (astronaut) floating in a starry dark sky (cosmic deep space), holding a striking contrast item (yellow balloon).",
            description: "An astronaut floating in deep cosmic starry space holding a glowing yellow balloon.",
            proceduralTheme: "lost_astronaut"
          },
          {
            id: 4,
            title: "Forest Sanctuary",
            difficulty: "Hard",
            targetImageUrl: targetLevel4,
            targetKeywords: ["temple", "golden", "misty", "emerald", "forest", "minimalist"],
            hints: "Detail a small golden sacred building (minimalist temple/pagoda) tucked inside an emerald green fog weather environment (misty ancient forest).",
            description: "A minimalist golden temple nestled inside a misty emerald forest with lush green canopies.",
            proceduralTheme: "forest_sanctuary"
          },
          {
            id: 5,
            title: "Desert Oasis",
            difficulty: "Easy",
            targetImageUrl: targetLevel5,
            targetKeywords: ["palm", "oasis", "dunes", "pool", "desert", "sun"],
            hints: "Mention a liquid body (oasis pool), desert environment (golden sand dunes), local vegetation (palm trees), and overhead sky element (blazing sun).",
            description: "A serene desert oasis pool surrounded by green palm trees nestled in golden sand dunes under a blazing sun.",
            proceduralTheme: "desert_oasis"
          },
          {
            id: 6,
            title: "Volcano Caldera",
            difficulty: "Medium",
            targetImageUrl: targetLevel6,
            targetKeywords: ["lava", "magma", "smoke", "volcano", "crater", "ash", "glowing"],
            hints: "Include active magma/lava flow, hot conditions (glowing), dark rocks/crater walls, and heavy atmospheric emissions (smoke and ash).",
            description: "An active volcanic crater with bright orange glowing lava bubbling up amidst dark basalt rocks and pillars of dark smoke.",
            proceduralTheme: "volcano_caldera"
          },
          {
            id: 7,
            title: "Subsea Coral Reef",
            difficulty: "Easy",
            targetImageUrl: targetLevel7,
            targetKeywords: ["fish", "coral", "reef", "submarine", "bubbles", "ocean", "turquoise"],
            hints: "Describe underwater features (coral reef), clear seawater (turquoise ocean), dynamic aquatic creatures (fish), and underwater physics (bubbles).",
            description: "An underwater tropical paradise filled with colorful neon corals, tiny yellow fish swimming through turquoise water and bubbles.",
            proceduralTheme: "subsea_coral"
          },
          {
            id: 8,
            title: "Steampunk Workshop",
            difficulty: "Medium",
            targetImageUrl: targetLevel8,
            targetKeywords: ["gears", "steampunk", "pipes", "brass", "valve", "steam", "lantern"],
            hints: "Focus on metallic retro-tech elements (brass pipes and gears/cogs), mechanical actuators (valves), and local lighting conditions (warm glowing lantern and steam particles).",
            description: "A cozy steampunk machine room with heavy brass cogs, pipes expelling steam, and warm glowing lanterns reflecting on copper panels.",
            proceduralTheme: "steampunk_workshop"
          },
          {
            id: 9,
            title: "Retro Arcade",
            difficulty: "Medium",
            targetImageUrl: targetLevel9,
            targetKeywords: ["arcade", "joystick", "cabinet", "retro", "glowing", "neon", "pixel"],
            hints: "Include vintage gaming elements (retro arcade cabinet box), physical controls (joystick), glowing display symbols (pixel art), and ambient illumination (neon glow).",
            description: "A vintage arcade cabinet with glowing joystick, coin slot, neon side art, and pixel symbols on the screen.",
            proceduralTheme: "retro_arcade"
          },
          {
            id: 10,
            title: "Snowy Cozy Cabin",
            difficulty: "Medium",
            targetImageUrl: targetLevel10,
            targetKeywords: ["cabin", "snowy", "pines", "smoke", "winter", "warm", "chimney"],
            hints: "Mention a timber wood building (cabin), cold climate settings (winter snow), surround vegetation (snowy pine trees), chimney exhaust (cozy smoke), and internal ambience (warm windows glow).",
            description: "A picturesque winter wooden cabin surrounded by snowy pine trees with warm light shining from windows and cozy chimney smoke.",
            proceduralTheme: "snowy_cabin"
          },
          {
            id: 11,
            title: "Celestial Portal",
            difficulty: "Hard",
            targetImageUrl: targetLevel11,
            targetKeywords: ["portal", "ring", "energy", "floating", "crystals", "obelisk", "stars"],
            hints: "Detail an gateway structure (stone ring portal), energy emissions (plasma energy), floating crystal nodes (amethyst crystals), background sky (starry voids), and tall pillars (obelisk).",
            description: "A gigantic stone ring portal radiating cosmic blue plasma energy, surrounded by floating amethyst crystals and ancient obelisks.",
            proceduralTheme: "celestial_portal"
          }
        ]);
      });
  }, []);

  const activeLevel = isDailyChallengeMode ? dailyChallenge : levels[currentLevelIdx];

  // Core timer ticking logic
  useEffect(() => {
    if (isTimeTrialMode && timeTrialStatus === "running") {
      if (timeLeft <= 0) {
        setTimeTrialStatus("failed");
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }
  }, [timeLeft, isTimeTrialMode, timeTrialStatus]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Sync level changes and mode toggling with timer reset
  useEffect(() => {
    if (activeLevel) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsTimeTrialNewRecord(false);
      setPrompt("");
      setEvaluation(null);
      setCompileError(null);
      setShowResultPanel(false);
      
      if (isTimeTrialMode) {
        setTimeTrialStatus("idle");
        setTimeLeft(getTimeLimitForLevel(activeLevel.difficulty));
      }
    }
  }, [currentLevelIdx, isTimeTrialMode]);

  const handleToggleTimeTrial = () => {
    const nextMode = !isTimeTrialMode;
    setIsTimeTrialMode(nextMode);
    setPrompt("");
    setEvaluation(null);
    setCompileError(null);
    setShowResultPanel(false);
    setIsNewHighScore(false);
    setIsTimeTrialNewRecord(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (nextMode && activeLevel) {
      setTimeTrialStatus("idle");
      setTimeLeft(getTimeLimitForLevel(activeLevel.difficulty));
    } else {
      setTimeTrialStatus("idle");
    }
  };

  const handleStartTrial = () => {
    if (!activeLevel) return;

    setPrompt("");
    setEvaluation(null);
    setShowResultPanel(false);
    setIsNewHighScore(false);
    setIsTimeTrialNewRecord(false);
    setTimeTrialStatus("running");
    
    const limit = getTimeLimitForLevel(activeLevel.difficulty);
    setTimeLeft(limit);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Submit prompt for evaluation
  const handleSubmitPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading || !activeLevel) return;

    setIsLoading(true);
    setEvaluation(null);
    setCompileError(null);
    setIsNewHighScore(false);
    setIsTimeTrialNewRecord(false);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelId: activeLevel.id,
          prompt: prompt,
          challengeDetails: isDailyChallengeMode ? dailyChallenge : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`API server responded with error status: ${response.status}`);
      }

      const result: EvaluationResult = await response.json();
      setEvaluation(result);
      setShowResultPanel(true);

      let updatedStats = { ...stats };

      if (isDailyChallengeMode) {
        // Daily Challenge Mode custom handling
        const dateStr = getTodayDateStr();
        const prevBest = stats.dailyHighScores?.[dateStr] || 0;
        const dailyHighsCopy = { ...(stats.dailyHighScores || {}) };
        
        if (result.score > prevBest) {
          dailyHighsCopy[dateStr] = result.score;
          setIsNewHighScore(prevBest > 0);
        }

        const completedDailies = Array.from(new Set([
          ...(stats.completedDailyChallenges || []),
          ...(result.score >= 50 ? [dateStr] : [])
        ]));

        const standardTotal: number = Object.values(stats.highScores || {}).reduce<number>((sum: number, val: any) => sum + (val as number), 0);
        const dailyTotal: number = Object.values(dailyHighsCopy).reduce<number>((sum: number, val: any) => sum + (val as number), 0);
        const totalScore: number = standardTotal + dailyTotal;

        updatedStats = {
          ...stats,
          completedDailyChallenges: completedDailies,
          dailyHighScores: dailyHighsCopy,
          totalScore
        };
      } else {
        // Handle normal / time trial modes scoring and level unlocks
        const prevBest = stats.highScores[activeLevel.id] || 0;
        const scoresCopy = { ...stats.highScores };
        
        if (result.score > prevBest) {
          scoresCopy[activeLevel.id] = result.score;
          setIsNewHighScore(prevBest > 0);
        }

        // If score meets or exceeds 50% match threshold
        let completedCopy = [...stats.completedLevels];
        if (result.score >= 50 && !completedCopy.includes(activeLevel.id)) {
          completedCopy.push(activeLevel.id);
        }

        const standardTotal: number = Object.values(scoresCopy).reduce<number>((sum: number, val: any) => sum + (val as number), 0);
        const dailyTotal: number = Object.values(stats.dailyHighScores || {}).reduce<number>((sum: number, val: any) => sum + (val as number), 0);
        const totalScore: number = standardTotal + dailyTotal;

        // TIME TRIAL SPECIFIC EVALUATION SUCCESS
        if (isTimeTrialMode && timeTrialStatus === "running") {
          if (result.score >= 50) {
            // Stop timer countdown immediately
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setTimeTrialStatus("success");

            const prevBestRemaining = stats.timeTrialBestTimes?.[activeLevel.id] || 0;
            const bestTimesCopy = { ...(stats.timeTrialBestTimes || {}) };
            let isNewRecord = false;
            
            if (timeLeft > prevBestRemaining) {
              bestTimesCopy[activeLevel.id] = timeLeft;
              isNewRecord = prevBestRemaining > 0;
            }
            setIsTimeTrialNewRecord(isNewRecord);

            const successListCopy = [...(stats.timeTrialSuccesses || [])];
            if (!successListCopy.includes(activeLevel.id)) {
              successListCopy.push(activeLevel.id);
            }

            updatedStats = {
              ...stats,
              completedLevels: completedCopy,
              highScores: scoresCopy,
              totalScore,
              timeTrialBestTimes: bestTimesCopy,
              timeTrialSuccesses: successListCopy
            };
          } else {
            // Submitted but didn't reach 50% -- regular high score still saves
            updatedStats = {
              ...stats,
              completedLevels: completedCopy,
              highScores: scoresCopy,
              totalScore
            };
          }
        } else {
          // Normal mode submission state save
          updatedStats = {
            ...stats,
            completedLevels: completedCopy,
            highScores: scoresCopy,
            totalScore
          };
        }
      }

      // Sync stats atomically (either to localStorage or cloud Firestore)
      await saveStats(updatedStats);

      // Record successful user solution details in Firestore if signed in
      if (currentUser && result.score >= 50) {
        const solId = `sol_${activeLevel.id}_${Date.now()}`;
        const solRef = doc(db, "users", currentUser.uid, "solutions", solId);
        try {
          await setDoc(solRef, {
            levelId: activeLevel.id,
            levelTitle: activeLevel.title,
            prompt: prompt,
            score: result.score,
            submittedAt: serverTimestamp()
          });
        } catch (solErr) {
          try {
            handleFirestoreError(solErr, OperationType.CREATE, `users/${currentUser.uid}/solutions/${solId}`);
          } catch (e) {
            console.error("Firestore user solution logging failure:", e);
          }
        }
      }

    } catch (err) {
      console.error("Prompt compiler failure:", err);
      setCompileError(err instanceof Error ? err.message : "Failed to compile prompt. Please verify server connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset current level input
  const handleReset = () => {
    setPrompt("");
    setEvaluation(null);
    setShowResultPanel(false);
    setIsNewHighScore(false);
    setIsTimeTrialNewRecord(false);

    if (isTimeTrialMode && activeLevel) {
      setTimeTrialStatus("idle");
      setTimeLeft(getTimeLimitForLevel(activeLevel.difficulty));
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Switch level handlers
  const selectLevelIdx = (index: number) => {
    // Level boundary rule: can select if Level 1, or previous level is completed!
    const targetLevelId = levels[index].id;
    const isUnlocked = index === 0 || stats.completedLevels.includes(levels[index - 1].id);
    
    if (isUnlocked) {
      setCurrentLevelIdx(index);
      handleReset();
    }
    setIsLevelDropdownOpen(false);
  };

  const handleNextLevel = () => {
    if (currentLevelIdx < levels.length - 1) {
      selectLevelIdx(currentLevelIdx + 1);
    }
  };

  // Radar data progress calculation across Easy, Medium, and Hard
  const easyLevels = levels.filter(l => l.difficulty === "Easy");
  const easyScore = easyLevels.length > 0 
    ? Math.round(easyLevels.reduce((acc, l) => acc + (stats.highScores[l.id] || 0), 0) / easyLevels.length)
    : 0;

  const mediumLevels = levels.filter(l => l.difficulty === "Medium");
  const mediumScore = mediumLevels.length > 0 
    ? Math.round(mediumLevels.reduce((acc, l) => acc + (stats.highScores[l.id] || 0), 0) / mediumLevels.length)
    : 0;

  const hardLevels = levels.filter(l => l.difficulty === "Hard");
  const hardScore = hardLevels.length > 0 
    ? Math.round(hardLevels.reduce((acc, l) => acc + (stats.highScores[l.id] || 0), 0) / hardLevels.length)
    : 0;

  const radarData = [
    { subject: "Easy", score: easyScore, fullMark: 100 },
    { subject: "Medium", score: mediumScore, fullMark: 100 },
    { subject: "Hard", score: hardScore, fullMark: 100 },
  ];

  if (!currentUser && !isGuest) {
    return (
      <LoginScreen 
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }} 
        onProceedAsGuest={() => {
          setIsGuest(true);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans select-none antialiased relative overflow-x-hidden">
      {/* HEADER SECTION */}
      <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-6 border-b border-zinc-800 bg-[#0c0c0e] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center font-bold text-lg text-white font-sans shrink-0">
            P
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 font-sans">
            PromptMaster<span className="text-indigo-400">.ai</span>
          </h1>

          {/* Level selection and dropdown combo */}
          {levels.length > 0 && activeLevel ? (
            <div className="relative ml-2">
              <button
                onClick={() => setIsLevelDropdownOpen(!isLevelDropdownOpen)}
                className="flex items-center space-x-1.5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 transition-colors cursor-pointer text-xs font-mono text-zinc-300"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isDailyChallengeMode ? `Daily: ${activeLevel.title}` : `Level ${activeLevel.id}: ${activeLevel.title}`}</span>
                <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${isLevelDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isLevelDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute left-0 mt-2 w-64 bg-[#0c0c0e]/95 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden z-50 p-1 font-mono backdrop-blur-md"
                  >
                    <div className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-500 tracking-wider border-b border-zinc-800 mb-1">
                      Select Mission
                    </div>
                    {dailyChallenge && (
                      <button
                        onClick={() => {
                          setIsDailyChallengeMode(true);
                          setIsLevelDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-colors text-xs border ${
                          isDailyChallengeMode
                            ? "bg-indigo-600/15 border-indigo-500/25 text-indigo-400 font-bold"
                            : "bg-zinc-950/45 border-zinc-800 text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                        } mb-2`}
                      >
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                          <span>Daily Challenge</span>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0 text-[10px]">
                          {stats.completedDailyChallenges?.includes(getTodayDateStr()) ? (
                            <span className="text-emerald-400 font-bold bg-emerald-950/20 px-1 py-0.5 rounded border border-emerald-500/20">
                              {stats.dailyHighScores?.[getTodayDateStr()] || 0}%
                            </span>
                          ) : (
                            <span className="text-amber-400 font-medium">New</span>
                          )}
                        </div>
                      </button>
                    )}
                    {levels.map((lvl, index) => {
                      const isUnlocked = index === 0 || stats.completedLevels.includes(levels[index - 1].id);
                      const isLvlCompleted = stats.completedLevels.includes(lvl.id);
                      const bestScore = stats.highScores[lvl.id] || 0;

                      return (
                        <button
                          key={lvl.id}
                          disabled={!isUnlocked}
                          onClick={() => {
                            setIsDailyChallengeMode(false);
                            selectLevelIdx(index);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-colors text-xs ${
                            index === currentLevelIdx && !isDailyChallengeMode
                              ? "bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 animate-none"
                              : isUnlocked
                              ? "hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                              : "opacity-40 cursor-not-allowed text-zinc-650"
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            {isLvlCompleted ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <div className={`w-1.5 h-1.5 rounded-full ${isUnlocked ? 'bg-indigo-500' : 'bg-zinc-650'} shrink-0`} />
                            )}
                            <span className="truncate max-w-[120px]">
                              {lvl.id}. {lvl.title}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1.5 shrink-0 text-[10px]">
                            {stats.timeTrialSuccesses?.includes(lvl.id) && (
                              <span className="text-amber-400 font-bold bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-500/25 flex items-center gap-0.5 shrink-0" title="Time Trial completed records">
                                <Timer className="w-2.5 h-2.5 animate-pulse" />
                                <span>{stats.timeTrialBestTimes?.[lvl.id] || 0}s</span>
                              </span>
                            )}
                            {bestScore > 0 ? (
                              <span className="text-zinc-350 font-bold bg-zinc-900/60 px-1.5 py-0.5 rounded border border-zinc-800">
                                {bestScore}%
                              </span>
                            ) : null}
                            <span className={`px-1 rounded uppercase ${
                              lvl.difficulty === "Easy" ? "text-emerald-400" :
                              lvl.difficulty === "Medium" ? "text-amber-400" : "text-rose-400"
                            }`}>
                              [{lvl.difficulty}]
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : null}
        </div>

        {/* Dynamic header stats block matching theme */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Overall Rank</span>
            <span className="text-sm font-mono text-emerald-400 font-bold">
              {stats.totalScore >= 300 ? "Diamond II" : stats.totalScore >= 200 ? "Gold III" : stats.totalScore >= 100 ? "Silver II" : "Bronze I"} • {stats.totalScore} XP
            </span>
          </div>

          {/* Interactive Skill Rating radar chart trigger */}
          <div className="relative">
            <button
              onClick={() => setIsSkillGraphOpen(!isSkillGraphOpen)}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer text-xs font-mono ${
                isSkillGraphOpen 
                  ? "bg-indigo-950/45 border-indigo-500/40 text-indigo-400 font-bold shadow-sm shadow-indigo-500/10"
                  : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-300"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden min-[400px]:inline">Skill Rating</span>
              <ChevronDown className={`w-3 h-3 text-zinc-504 transition-transform duration-300 ${isSkillGraphOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isSkillGraphOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2.5 w-64 sm:w-72 bg-[#0c0c0e]/95 border border-zinc-805 rounded-xl shadow-2xl overflow-hidden z-50 p-4 font-mono backdrop-blur-md"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                      Skill Progress Graph
                    </span>
                    <span className="text-[9px] text-zinc-500 font-bold">
                      {stats.totalScore} XP
                    </span>
                  </div>

                  {/* RADAR CHART VISUALIZATION */}
                  <div className="h-40 w-full flex items-center justify-center select-none" style={{ minWidth: '150px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                        <PolarGrid stroke="#27272a" />
                        <PolarAngleAxis 
                          dataKey="subject" 
                          tick={{ fill: "#a1a1aa", fontSize: 9, fontWeight: 500 }} 
                        />
                        <PolarRadiusAxis 
                          angle={30} 
                          domain={[0, 100]} 
                          tick={false}
                          axisLine={false}
                        />
                        <Radar
                          name="Skill Score"
                          dataKey="score"
                          stroke="#6366f1"
                          fill="#6366f1"
                          fillOpacity={0.25}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* LEGEND & DETAILS */}
                  <div className="mt-2 space-y-1.5 border-t border-zinc-850 pt-3 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Easy:
                      </span>
                      <span className="text-zinc-300 font-bold">{easyScore}% Avg Match</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Medium:
                      </span>
                      <span className="text-zinc-300 font-bold">{mediumScore}% Avg Match</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Hard:
                      </span>
                      <span className="text-zinc-300 font-bold">{hardScore}% Avg Match</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-2 border-t border-zinc-850 text-center">
                    <p className="text-[8px] text-zinc-500 leading-relaxed font-sans">
                      Averages automatically scale as you submit higher semantic accuracy.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-8 w-[1px] bg-zinc-800 hidden sm:block"></div>
          <div className="hidden sm:flex gap-4">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase text-zinc-500">Accuracy</span>
              <span className="text-sm font-bold italic underline decoration-indigo-500">
                {(() => {
                  const scores = Object.values(stats.highScores) as number[];
                  if (scores.length === 0) return "92%";
                  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                  return `${avg}%`;
                })()}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase text-zinc-500">Streak</span>
              <span className="text-sm font-bold text-zinc-150">
                {stats.completedLevels.length * 4 || 12}
              </span>
            </div>
          </div>

          {/* Firestore Auth Status & Control Panel */}
          <div className="h-8 w-[1px] bg-zinc-800 hidden sm:block"></div>
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "User"}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full border border-indigo-500/35"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold font-sans text-white uppercase shrink-0">
                    {currentUser.displayName ? currentUser.displayName[0] : "P"}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-semibold leading-none text-zinc-100 max-w-[85px] truncate">
                    {currentUser.displayName || "Prompter"}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {isSyncing ? (
                      <span className="text-[9px] text-indigo-400 font-mono flex items-center gap-0.5 animate-pulse shrink-0">
                        <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                        Syncing...
                      </span>
                    ) : (
                      <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-0.5 shrink-0">
                        <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                        Cloud
                      </span>
                    )}
                    <span className="text-[8px] text-zinc-600">•</span>
                    <button
                      onClick={handleSignOut}
                      className="text-[9px] font-mono text-zinc-500 hover:text-rose-400 cursor-pointer underline decoration-zinc-700 hover:decoration-rose-500"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : isGuest ? (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold font-sans text-zinc-400 uppercase shrink-0">
                  G
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-semibold leading-none text-zinc-300">
                    Guest Miner
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[9px] text-zinc-500 font-mono flex items-center gap-0.5 shrink-0">
                      Offline
                    </span>
                    <span className="text-[8px] text-zinc-600">•</span>
                    <button
                      onClick={() => setIsGuest(false)}
                      className="text-[9px] font-mono text-zinc-400 hover:text-indigo-400 cursor-pointer underline decoration-zinc-700 hover:decoration-indigo-500"
                    >
                      Save Progress
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="flex items-center gap-1.5 bg-indigo-950/20 hover:bg-indigo-950/45 text-indigo-300 border border-indigo-900/40 hover:border-indigo-500/40 rounded-lg px-2.5 py-1.5 transition-all text-xs cursor-pointer font-sans font-medium hover:text-white"
              >
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden min-[350px]:inline">Sync Progress</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      {levels.length === 0 || !activeLevel ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 font-mono">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mb-4" />
          <p className="text-sm text-zinc-400">Loading scenario objective...</p>
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
          
          {/* LEFT WINDOW: THE GOAL (Target Description & Card) */}
          <section className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Target Objective
              </h2>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] border border-zinc-700 font-mono">
                {isDailyChallengeMode ? "DAILY_CHALLENGE" : `LVL_${activeLevel.id}`} — {activeLevel.difficulty}
              </span>
            </div>

            <div className="relative flex-1 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col overflow-hidden shadow-xl shadow-black/25">
              {/* Scenario indicator */}
              <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <span className="text-[11px] font-medium text-white">Scenario: {activeLevel.title}</span>
              </div>

              {/* Target Image preview wrapper */}
              <div className="relative aspect-square w-full bg-[#111113] bg-[radial-gradient(#1e1e24_1px,transparent_1px)] [background-size:20px_20px] overflow-hidden flex items-center justify-center border-b border-zinc-800">
                {!imageErrorMap[activeLevel.id] ? (
                  <img
                    src={activeLevel.targetImageUrl}
                    alt={activeLevel.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-103"
                    onError={() => {
                      setImageErrorMap((prev) => ({ ...prev, [activeLevel.id]: true }));
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/45 to-zinc-900 flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <BookOpen className="w-12 h-12 text-indigo-500 animate-pulse" />
                    <div className="space-y-1">
                      <h5 className="font-mono text-sm font-bold text-zinc-200">Target Design Loaded</h5>
                      <p className="text-xs text-zinc-500 max-w-xs">Study the visual composition above and recreate it using your prompt skills.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Content Information */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4 bg-zinc-900/40">
                <div className="space-y-2">
                  <h3 className="text-base font-extrabold tracking-tight text-white flex items-center">
                    <Sparkles className="w-4 h-4 text-indigo-400 mr-2" />
                    {activeLevel.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950/80 p-3 rounded-lg border border-zinc-800">
                    <span className="text-[10px] font-mono text-indigo-400 font-semibold block mb-1">OBJECTIVE //</span>
                    Analyze the target image closely and write a prompt in the terminal to visually reconstruct the elements and match the target key concepts!
                  </p>
                </div>

                {/* Target keyword list tracker */}
                <div className="space-y-2 font-mono">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center">
                    <Layers className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                    Target Key Concepts ({activeLevel.targetKeywords.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeLevel.targetKeywords.map((kw) => {
                      const isMatched = evaluation ? evaluation.matchedKeywords.includes(kw) : false;
                      return (
                        <span
                          key={kw}
                          className={`text-[10px] px-2.5 py-1 rounded-md border transition-all duration-300 ${
                            isMatched
                              ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/25 shadow-md font-bold"
                              : "bg-zinc-900/60 text-zinc-500 border-zinc-800"
                          }`}
                        >
                          {kw.toUpperCase()}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Hints toggle container */}
                <div className="border-t border-zinc-800/80 pt-3">
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="flex items-center justify-between w-full text-xs font-mono text-zinc-400 hover:text-indigo-400 transition-colors py-1.5 cursor-pointer"
                  >
                    <span className="flex items-center">
                      <HelpCircle className="w-3.5 h-3.5 mr-2 text-indigo-400" />
                      Get Hints & Synonym Clues
                    </span>
                    {showHints ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <AnimatePresence>
                    {showHints && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950 border border-zinc-800 p-3 rounded-lg mt-2 font-sans">
                          {activeLevel.hints}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT WINDOW: THE OUTPUT CANVAS */}
          <section className="flex flex-col gap-4 bg-[#070708] rounded-xl p-0">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Generation Preview
              </h2>
              <div className="flex gap-2 items-center">
                <span className="text-[10px] text-zinc-500 uppercase font-mono">Engine Active</span>
              </div>
            </div>

            <div className="relative flex-1 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col justify-between overflow-hidden shadow-xl shadow-black/25 min-h-[400px]">
              {/* Dynamic canvas component container */}
              <div className="p-4 bg-black/10 flex-1 flex flex-col justify-center items-center">
                <PromptCanvas
                  elements={evaluation ? evaluation.visualElements : []}
                  theme={activeLevel.proceduralTheme}
                  score={evaluation ? evaluation.score : 0}
                  isLoading={isLoading}
                  error={compileError}
                />
              </div>

              {/* Progress Summary overlay elements representation */}
              {evaluation && !isLoading && (
                <div className="absolute bottom-4 right-4 bg-black/85 border border-zinc-700/85 p-3 rounded-lg backdrop-blur-md w-48 shadow-2xl font-mono">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Semantic Match</h3>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-1000" 
                      style={{ width: `${evaluation.score}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-indigo-400 font-bold">{evaluation.score}%</span>
                    <span className="text-zinc-500 uppercase italic">Match</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* SYSTEM DOCK TERMINAL (Prompt Control Center - Spannable Full Width) */}
          <section className="lg:col-span-2">
            <footer className="p-6 bg-[#0c0c0e] border border-zinc-800 rounded-xl flex flex-col gap-4">
              
              {/* Header inside terminal section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-850 pb-3">
                <div className="flex flex-wrap items-center gap-4">
                  <label htmlFor="prompt" className="text-xs font-bold text-zinc-500 uppercase tracking-tighter flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3"/>
                    </svg>
                    Input Terminal
                  </label>

                  <div className="hidden sm:block h-4 w-[1px] bg-zinc-800"></div>

                  {/* TIME TRIAL OPTIONAL MODE TOGGLE */}
                  <button
                    type="button"
                    onClick={handleToggleTimeTrial}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isTimeTrialMode
                        ? "bg-indigo-950/45 border-indigo-500/40 text-indigo-400 font-bold shadow-sm shadow-indigo-505/10"
                        : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Timer className={`w-3.5 h-3.5 ${isTimeTrialMode ? 'text-indigo-400 animate-pulse' : 'text-zinc-500'}`} />
                    <span>Time Trial Mode</span>
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  {isTimeTrialMode && (
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-zinc-550 font-bold uppercase tracking-wide text-[10px]">TIME RECORD:</span>
                      <span className="text-amber-400 font-bold">
                        {stats.timeTrialBestTimes?.[activeLevel.id] 
                          ? `${stats.timeTrialBestTimes[activeLevel.id]}s remaining` 
                          : "No Record"}
                      </span>
                    </div>
                  )}
                  <span className="text-[10px] font-mono text-zinc-600">Tokens: {prompt.length}/300</span>
                </div>
              </div>

              {/* Dynamic body depend on Time Trial status */}
              {isTimeTrialMode && timeTrialStatus === "idle" ? (
                <div className="flex flex-col items-center justify-center p-6 bg-zinc-950 rounded-lg border border-zinc-850 text-center min-h-[140px] relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-60"></div>
                  <Timer className="w-8 h-8 text-indigo-400 animate-bounce mb-2" />
                  <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wide">Time Trial Challenge ARMED</h4>
                  <p className="text-[11px] text-zinc-500 max-w-md mt-1 mb-3 leading-relaxed">
                    You have <span className="text-indigo-400 font-bold">{getTimeLimitForLevel(activeLevel.difficulty)} seconds</span> to write a prompt and reach a semantic fidelity score of <span className="text-emerald-400 font-bold">50% or more</span>.
                  </p>
                  <button
                    type="button"
                    onClick={handleStartTrial}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-indigo-600/15 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Start Countdown!
                  </button>
                </div>
              ) : isTimeTrialMode && timeTrialStatus === "failed" ? (
                <div className="flex flex-col items-center justify-center p-6 bg-rose-950/10 rounded-lg border border-rose-900/30 text-center min-h-[140px] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-rose-500 opacity-60"></div>
                  <XCircle className="w-8 h-8 text-rose-500 mb-2 animate-pulse" />
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">TIME LIMIT EXCEEDED</h4>
                  <p className="text-[11px] text-zinc-450 max-w-sm mt-1 mb-3 font-sans">
                    Your countdown expired before compiling a match above the 50% threshold. Refine your keywords or synonym clues!
                  </p>
                  <button
                    type="button"
                    onClick={handleStartTrial}
                    className="px-6 py-2 bg-rose-600 hover:bg-rose-550 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-rose-500/10 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Retry Trial Challenge
                  </button>
                </div>
              ) : isTimeTrialMode && timeTrialStatus === "success" ? (
                <div className="flex flex-col items-center justify-center p-6 bg-emerald-950/10 rounded-lg border border-emerald-900/30 text-center min-h-[140px] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-500 opacity-60"></div>
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2 animate-bounce" />
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Time Trial Success!</h4>
                  <div className="text-[11px] text-zinc-400 max-w-md mt-1 mb-4 space-y-1 font-mono">
                    <p>
                      You hit 50%+ match with <span className="text-emerald-400 font-bold">{timeLeft} seconds</span> remaining!
                    </p>
                    {isTimeTrialNewRecord && (
                      <p className="text-amber-400 font-bold uppercase tracking-widest text-[9px] animate-pulse">
                        ⭐ NEW TIME TRIAL SPEED RECORD!
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleStartTrial}
                      className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs font-bold uppercase rounded-lg cursor-pointer transition-all"
                    >
                      Compete Again
                    </button>
                    {currentLevelIdx < levels.length - 1 ? (
                      <button
                        type="button"
                        onClick={handleNextLevel}
                        className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-555 text-white text-xs font-sans font-bold uppercase rounded-lg cursor-pointer shadow-md shadow-emerald-500/10 transition-all flex items-center gap-1"
                      >
                        Next Mission
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitPrompt} className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value.slice(0, 300))}
                      disabled={isLoading}
                      placeholder={isTimeTrialMode ? "TYPE RAPIDLY! Hit 50% score match as fast as possible!" : "Describe the scene in detail... e.g., 'Cinematic low-angle shot of a rainy alleyway in Tokyo 2077, glowing pink neon signs, wet pavement reflections, hyper-realistic, 8k.'"}
                      className="w-full min-h-[96px] bg-black border border-zinc-800 rounded-lg p-4 font-mono text-sm text-indigo-100 placeholder:text-zinc-700/60 focus:outline-none focus:border-indigo-500/50 resize-none transition-all duration-300"
                    />
                    <div className="absolute bottom-3 right-3 flex gap-2 select-none">
                      <div className="px-2 py-1 bg-zinc-900 rounded border border-zinc-800 text-[10px] text-zinc-500 font-mono">300 LIMIT</div>
                    </div>
                  </div>

                  <div className="flex sm:flex-row md:flex-col gap-2 shrink-0 justify-end md:justify-start">
                    {/* COUNTDOWN TIMER WIDGET FOR ACTIVE RUNS */}
                    {isTimeTrialMode && timeTrialStatus === "running" && (
                      <div className={`px-4 py-2.5 rounded-lg border flex flex-col items-center justify-center font-mono transition-all duration-300 ${
                        timeLeft <= 15
                          ? "bg-rose-950/20 border-rose-500/40 text-rose-500 animate-pulse"
                          : "bg-zinc-950 border-zinc-850 text-indigo-400"
                      }`}>
                        <span className="text-[8px] uppercase font-bold text-zinc-500 tracking-wider">COUNTDOWN</span>
                        <span className="text-xl font-bold tracking-tight">
                          00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={isLoading || !prompt}
                      className="px-4 py-3 bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-zinc-400 transition-colors flex items-center gap-1.5 justify-center cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Wipe Terminal
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isLoading || !prompt.trim()}
                      className="px-6 py-4 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 rounded-lg flex flex-col items-center justify-center gap-1 text-white font-sans w-full md:w-48 cursor-pointer shadow-lg shadow-indigo-600/10 group"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2 py-1">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs font-bold uppercase tracking-widest text-zinc-200">Iterating...</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-xs font-bold uppercase tracking-widest text-center leading-normal">Generate</span>
                          <span className="text-[10px] text-indigo-300 font-medium opacity-80 group-hover:opacity-100 italic block leading-none">Run Evaluation</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </footer>
          </section>
        </main>
      )}

      {/* DETAILED RESULTS & SLIDE-OVER EVALUATION MODULE */}
      <AnimatePresence>
        {showResultPanel && evaluation && activeLevel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-full max-w-lg bg-[#0c0c0e] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl font-mono text-left"
            >
              {/* Header result */}
              <div className="bg-[#111113] px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <span className="text-xs font-bold text-zinc-300">COMPILER_EVALUATION_REPORT</span>
                </div>
                {evaluation.isAiEvaluated ? (
                  <span className="text-[9px] bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded font-black flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" />
                    GEMINI SEMANTIC EVAL
                  </span>
                ) : (
                  <span className="text-[9px] bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded font-bold">
                    LOCAL EVAL
                  </span>
                )}
              </div>

              {/* Dynamic matching scoring visual details */}
              <div className="p-6 space-y-6">
                
                {/* Score Gauge Row */}
                <div className="flex items-center space-x-6">
                  {/* Circular Match rating visualizer */}
                  <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="56" cy="56" r="48" fill="transparent" stroke="#1f2937" strokeWidth="6" />
                      <circle 
                        cx="56" 
                        cy="56" 
                        r="48" 
                        fill="transparent" 
                        stroke={evaluation.score >= 50 ? "#10b981" : "#ef4444"} 
                        strokeWidth="6" 
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={2 * Math.PI * 48 * (1 - evaluation.score / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-white leading-none">{evaluation.score}%</span>
                      <span className="text-[8px] text-zinc-500 mt-1">FIDELITY</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-indigo-450 font-bold uppercase tracking-wider block">MISSION COMPLETION:</span>
                    <h3 className="text-sm font-extrabold text-white leading-tight">
                      {evaluation.score >= 50 ? (
                        <span className="text-emerald-400 flex items-center font-bold">
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          SUCCESS // NEXT LEVEL UNLOCKED
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center font-bold">
                          <XCircle className="w-4 h-4 mr-1.5" />
                          FAIL // SUB-50% FIDELITY
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                      {evaluation.score >= 50 
                        ? "Terrific syntax parsing. Your keywords matched semantic vectors cleanly to unlock standard and auxiliary graphic elements."
                        : `Your accuracy score is slightly low. Complete the brief keywords list attributes to unlock Level ${activeLevel.id + 1}.`
                      }
                    </p>
                  </div>
                </div>

                {/* Checklist properties */}
                <div className="space-y-4">
                  {/* Matched Attributes */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">MATCHED CRITERIA</span>
                    {evaluation.matchedKeywords.length > 0 ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        {evaluation.matchedKeywords.map(kw => (
                          <div key={kw} className="flex items-center text-[10px] bg-emerald-950/15 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2" />
                            {kw.toUpperCase()}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-zinc-650">No matching tokens found in user input buffer.</p>
                    )}
                  </div>

                  {/* Missed Attributes */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">MISSING ATTRIBUTES</span>
                    {evaluation.missedKeywords.length > 0 ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        {evaluation.missedKeywords.map(kw => (
                          <div key={kw} className="flex items-center text-[10px] bg-red-950/15 border border-red-500/20 text-red-400 px-2 py-1 rounded">
                            <span className="w-1.5 h-1.5 bg-red-450 rounded-full mr-2 animate-pulse" />
                            {kw.toUpperCase()}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-emerald-400 font-bold">✓ PERFECT COMPLIANCE // 0 gaps remaining</p>
                    )}
                  </div>
                </div>

                {/* Dynamic feedback display block */}
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-850 space-y-1.5">
                  <span className="text-[9px] text-indigo-400 tracking-wider block font-bold uppercase flex items-center">
                    <Info className="w-3.5 h-3.5 mr-1" />
                    AI Vision Copilot Advice
                  </span>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                    {evaluation.feedback}
                  </p>
                </div>

                {/* Controls modal buttons */}
                <div className="flex items-center justify-end space-x-3 border-t border-zinc-850/80 pt-5">
                  {evaluation.score < 50 ? (
                    <button
                      onClick={() => setShowResultPanel(false)}
                      className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-bold text-white transition-all cursor-pointer"
                    >
                      RETRY_COMPILATION
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowResultPanel(false)}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-300 transition-all cursor-pointer"
                      >
                        STAY_HERE
                      </button>
                      
                      {currentLevelIdx < levels.length - 1 ? (
                        <button
                          onClick={() => {
                            setShowResultPanel(false);
                            handleNextLevel();
                          }}
                          className="px-5 py-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-650/25 flex items-center cursor-pointer"
                        >
                          NEXT_MISSION
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </button>
                      ) : (
                        <div className="text-emerald-400 font-bold text-xs bg-emerald-950/20 px-3 py-1.5 border border-emerald-500/25 rounded-md flex items-center">
                          <Award className="w-4 h-4 mr-1.5 animate-pulse" />
                          FINAL LEVEL MASTERED
                        </div>
                      )}
                    </>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
