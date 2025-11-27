import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Check,
  RefreshCw,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Repeat,
  LayoutDashboard,
  BarChart2,
  TrendingUp,
  Trophy,
  Dumbbell,
  Utensils,
  Timer,
  CalendarDays,
} from "lucide-react";

const apiKey = ""; // La clé API sera injectée automatiquement par l'environnement

// --- AJOUT : Citations de secours ---
const FALLBACK_QUOTES = [
  "Le succès, c'est tomber sept fois, se relever huit.",
  "Votre temps est limité, ne le gâchez pas.",
  "La seule façon de faire du bon travail est d'aimer ce que vous faites.",
  "Ce qui ne nous tue pas nous rend plus fort.",
  "La simplicité est la sophistication suprême.",
  "Agissez comme s'il était impossible d'échouer.",
  "Le meilleur moment pour planter un arbre était il y a 20 ans.",
  "Ne rêvez pas votre vie, vivez vos rêves.",
  "La discipline est le pont entre les objectifs et les accomplissements.",
  "Un voyage de mille lieues commence toujours par un premier pas.",
];

const DAILY_HABITS = [
  {
    id: "habit-1",
    text: "8h de sommeil minimum",
    completed: false,
    isHabit: true,
  },
  { id: "habit-2", text: "Boire 2L d'eau", completed: false, isHabit: true },
  {
    id: "habit-3",
    text: "Être gentil avec les autres",
    completed: false,
    isHabit: true,
  },
  {
    id: "habit-4",
    text: "Entraînement / Sport",
    completed: false,
    isHabit: true,
  },
  {
    id: "habit-5",
    text: "Apprendre une nouvelle compétence",
    completed: false,
    isHabit: true,
  },
  {
    id: "habit-6",
    text: "Moins de 2h d'écran",
    completed: false,
    isHabit: true,
  },
];

const DAYS_OF_WEEK = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

export default function App() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // --- Helpers de Date ---
  const getDateKey = (date) => date.toISOString().split("T")[0];
  const selectedDateKey = getDateKey(selectedDate);
  const isToday = getDateKey(new Date()) === selectedDateKey;
  const currentDayName = DAYS_OF_WEEK[selectedDate.getDay()];

  // --- Gestion des Tâches ---
  const [allTasks, setAllTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("zen-tasks");
      let parsed = saved ? JSON.parse(saved) : {};
      if (Array.isArray(parsed)) {
        const todayKey = new Date().toISOString().split("T")[0];
        parsed = { [todayKey]: parsed };
      }
      return parsed;
    } catch (e) {
      return {};
    }
  });
  const [newTask, setNewTask] = useState("");

  // --- Gestion Fitness & Plan ---
  // fitnessData stocke l'historique (repas, completion)
  const [fitnessData, setFitnessData] = useState(() => {
    try {
      const saved = localStorage.getItem("zen-fitness");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // weeklyPlan stocke les séances récurrentes { "Lundi": [...], "Mardi": [...] }
  const [weeklyPlan, setWeeklyPlan] = useState(() => {
    try {
      const saved = localStorage.getItem("zen-weekly-plan");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // États Formulaire Fitness
  const [newWorkoutName, setNewWorkoutName] = useState("");
  const [newWorkoutTime, setNewWorkoutTime] = useState("");
  const [targetDay, setTargetDay] = useState(currentDayName); // Jour par défaut = jour affiché
  const [isRecurrent, setIsRecurrent] = useState(false);

  // --- IA State ---
  const [quote, setQuote] = useState("La discipline est mère du succès.");
  const [loadingQuote, setLoadingQuote] = useState(false);

  // --- Variables Dérivées ---
  const currentTasks = allTasks[selectedDateKey] || DAILY_HABITS;
  const currentFitnessLog = fitnessData[selectedDateKey] || {
    meals: 0,
    completedIds: [],
    customWorkouts: [],
  };

  // Fusionner le plan récurrent et les séances ponctuelles pour l'affichage
  const getWorkoutsForDay = () => {
    const dayName = DAYS_OF_WEEK[selectedDate.getDay()];
    // 1. Séances récurrentes pour ce jour de la semaine
    const recurrent = weeklyPlan[dayName] || [];
    // 2. Séances ponctuelles ajoutées spécifiquement à cette date
    const custom = currentFitnessLog.customWorkouts || [];

    return [...recurrent, ...custom];
  };

  const workoutsToDisplay = getWorkoutsForDay();

  // --- Effets ---
  useEffect(() => {
    localStorage.setItem("zen-tasks", JSON.stringify(allTasks));
  }, [allTasks]);
  useEffect(() => {
    localStorage.setItem("zen-fitness", JSON.stringify(fitnessData));
  }, [fitnessData]);
  useEffect(() => {
    localStorage.setItem("zen-weekly-plan", JSON.stringify(weeklyPlan));
  }, [weeklyPlan]);

  // Met à jour le "targetDay" quand on change de date dans le calendrier
  useEffect(() => {
    setTargetDay(DAYS_OF_WEEK[selectedDate.getDay()]);
  }, [selectedDate]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    fetchMotivation();
    return () => clearInterval(timer);
  }, []);

  // --- Fonctions IA ---
  const fetchMotivation = async () => {
    setLoadingQuote(true);
    let aiSuccess = false;
    try {
      if (apiKey) {
        const prompt =
          "Génère une citation courte (max 15 mots) stoïque et motivante en français. Pas de guillemets.";
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          }
        );
        if (response.ok) {
          const data = await response.json();
          const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (aiText) {
            setQuote(aiText.trim());
            setLoadingQuote(false);
            aiSuccess = true;
          }
        }
      }
    } catch (e) {}
    if (!aiSuccess) {
      setTimeout(() => {
        setQuote(
          FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]
        );
        setLoadingQuote(false);
      }, 400);
    }
  };

  // --- Fonctions Tâches ---
  const updateTasksForSelectedDate = (newTaskList) => {
    setAllTasks((prev) => ({ ...prev, [selectedDateKey]: newTaskList }));
  };
  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const updated = [
      ...currentTasks,
      { id: Date.now(), text: newTask, completed: false, isHabit: false },
    ];
    updateTasksForSelectedDate(updated);
    setNewTask("");
  };
  const toggleTask = (id) => {
    const updated = currentTasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    updateTasksForSelectedDate(updated);
  };
  const deleteTask = (id) => {
    const updated = currentTasks.filter((t) => t.id !== id);
    updateTasksForSelectedDate(updated);
  };

  // --- Fonctions Fitness ---

  const addWorkout = (e) => {
    e.preventDefault();
    if (!newWorkoutName.trim()) return;

    const newWorkout = {
      id: Date.now(),
      name: newWorkoutName,
      time: newWorkoutTime || "30",
      recurrent: isRecurrent,
    };

    if (isRecurrent) {
      // Ajouter au PLAN HEBDOMADAIRE (Recurrent)
      setWeeklyPlan((prev) => ({
        ...prev,
        [targetDay]: [...(prev[targetDay] || []), newWorkout],
      }));
    } else {
      // Ajouter UNIQUEMENT pour la date sélectionnée (Non-Recurrent)
      // Attention: Si l'utilisateur a choisi "Lundi" dans le menu mais qu'on affiche "Mardi",
      // pour simplifier ici, on ajoute au jour sélctionné dans le menu déroulant
      // MAIS pour éviter la complexité de calcul de date, on va l'ajouter à la date selectionnée actuellement
      // si le jour correspond, sinon on avertit ou on simplifie.

      // Simplification : Si non récurrent, on l'ajoute à la date que l'utilisateur regarde actuellement
      const log = fitnessData[selectedDateKey] || {
        meals: 0,
        completedIds: [],
        customWorkouts: [],
      };
      const newCustomWorkouts = [...(log.customWorkouts || []), newWorkout];

      setFitnessData((prev) => ({
        ...prev,
        [selectedDateKey]: { ...log, customWorkouts: newCustomWorkouts },
      }));
    }

    setNewWorkoutName("");
    setNewWorkoutTime("");
  };

  const toggleWorkoutCompletion = (id) => {
    const log = fitnessData[selectedDateKey] || {
      meals: 0,
      completedIds: [],
      customWorkouts: [],
    };
    const completedIds = log.completedIds || [];

    let newCompletedIds;
    if (completedIds.includes(id)) {
      newCompletedIds = completedIds.filter((idx) => idx !== id);
    } else {
      newCompletedIds = [...completedIds, id];
    }

    setFitnessData((prev) => ({
      ...prev,
      [selectedDateKey]: { ...log, completedIds: newCompletedIds },
    }));
  };

  const deleteWorkout = (id, isRecurrentItem) => {
    if (isRecurrentItem) {
      // Supprimer du PLAN
      const dayName = DAYS_OF_WEEK[selectedDate.getDay()];
      const updatedDayPlan = (weeklyPlan[dayName] || []).filter(
        (w) => w.id !== id
      );
      setWeeklyPlan((prev) => ({ ...prev, [dayName]: updatedDayPlan }));
    } else {
      // Supprimer du LOG quotidien
      const log = fitnessData[selectedDateKey] || {
        meals: 0,
        completedIds: [],
        customWorkouts: [],
      };
      const updatedCustom = (log.customWorkouts || []).filter(
        (w) => w.id !== id
      );
      setFitnessData((prev) => ({
        ...prev,
        [selectedDateKey]: { ...log, customWorkouts: updatedCustom },
      }));
    }
  };

  const updateMeals = (increment) => {
    const log = fitnessData[selectedDateKey] || {
      meals: 0,
      completedIds: [],
      customWorkouts: [],
    };
    const newCount = Math.max(0, (log.meals || 0) + increment);
    setFitnessData((prev) => ({
      ...prev,
      [selectedDateKey]: { ...log, meals: newCount },
    }));
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  // --- HEADER Component ---
  const Header = () => {
    const displayDate = isToday
      ? "Aujourd'hui"
      : new Intl.DateTimeFormat("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(selectedDate);

    return (
      <header className="flex flex-col md:flex-row justify-between items-center bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-6">
        <div className="flex flex-col items-center md:items-start w-full md:w-auto">
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight mb-2">
            Mon Espace Zen
          </h1>
          <div className="flex items-center gap-3 bg-stone-50 rounded-lg p-1 border border-stone-200">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 hover:bg-stone-200 rounded-md transition-colors text-stone-600"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2 px-2 min-w-[180px] justify-center text-stone-600 font-medium capitalize">
              <Calendar size={16} />
              {displayDate}
            </div>
            <button
              onClick={() => changeDate(1)}
              className="p-2 hover:bg-stone-200 rounded-md transition-colors text-stone-600"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(new Date())}
              className="text-xs text-emerald-600 mt-2 flex items-center gap-1 hover:underline"
            >
              <RotateCcw size={12} /> Revenir à aujourd'hui
            </button>
          )}
        </div>
      </header>
    );
  };

  // --- VIEWS ---

  const renderDashboard = () => {
    const progress =
      currentTasks.length === 0
        ? 0
        : Math.round(
            (currentTasks.filter((t) => t.completed).length /
              currentTasks.length) *
              100
          );
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <Header />
        <section className="bg-emerald-900 text-emerald-50 rounded-2xl p-8 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles size={120} />
          </div>
          <div className="relative z-10 text-center">
            <h2 className="text-emerald-300 text-xs font-bold tracking-widest uppercase mb-3">
              Conseil du Jour
            </h2>
            <p
              className={`text-xl md:text-2xl font-serif italic leading-relaxed transition-opacity duration-300 ${
                loadingQuote ? "opacity-50" : "opacity-100"
              }`}
            >
              "{quote}"
            </p>
            <button
              onClick={fetchMotivation}
              disabled={loadingQuote}
              className="mt-6 flex items-center gap-2 mx-auto text-sm text-emerald-300 hover:text-white transition-colors"
            >
              <RefreshCw
                size={14}
                className={loadingQuote ? "animate-spin" : ""}
              />{" "}
              Nouvelle inspiration
            </button>
          </div>
        </section>
        <main className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-stone-700 flex items-center gap-2">
              Objectifs
            </h2>
            <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              {progress}%
            </div>
          </div>
          <div className="p-4">
            <form onSubmit={addTask} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Nouvelle tâche..."
                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl transition-colors shadow-md shadow-emerald-200"
              >
                <Plus size={24} />
              </button>
            </form>
            {currentTasks.length === 0 ? (
              <div className="text-center py-8 text-stone-400">
                Aucune tâche.
              </div>
            ) : (
              <ul className="space-y-2">
                {currentTasks.map((task) => (
                  <li
                    key={task.id}
                    className={`group flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                      task.completed
                        ? "bg-stone-50"
                        : "hover:bg-white hover:shadow-sm border border-transparent hover:border-stone-100"
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          task.completed
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-stone-300 text-transparent hover:border-emerald-400"
                        }`}
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                      <div className="flex flex-col">
                        <span
                          className={`text-lg transition-all duration-200 ${
                            task.completed
                              ? "text-stone-400 line-through"
                              : "text-stone-700"
                          }`}
                        >
                          {task.text}
                        </span>
                        {task.isHabit && (
                          <span className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                            <Repeat size={10} /> Habitude quotidienne
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-stone-300 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    );
  };

  const renderFitness = () => {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <Header />

        {/* Nutrition */}
        <section className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
              <Utensils size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-700">Repas</h2>
              <p className="text-xs text-stone-400">Total aujourd'hui</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => updateMeals(-1)}
              className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:bg-stone-50"
            >
              -
            </button>
            <span className="text-3xl font-bold text-stone-800 w-8 text-center">
              {currentFitnessLog.meals || 0}
            </span>
            <button
              onClick={() => updateMeals(1)}
              className="w-10 h-10 rounded-full bg-orange-500 text-white shadow-md flex items-center justify-center hover:bg-orange-600"
            >
              +
            </button>
          </div>
        </section>

        {/* Workout Plan */}
        <section className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="p-6 border-b border-stone-100 bg-stone-50/50">
            <h2 className="text-xl font-bold text-stone-700 mb-4 flex items-center gap-2">
              Planifier une séance
            </h2>

            <form onSubmit={addWorkout} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWorkoutName}
                  onChange={(e) => setNewWorkoutName(e.target.value)}
                  placeholder="Nom (ex: Jambes)"
                  className="flex-[2] bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <input
                  type="number"
                  value={newWorkoutTime}
                  onChange={(e) => setNewWorkoutTime(e.target.value)}
                  placeholder="Min"
                  className="w-20 bg-white border border-stone-200 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={targetDay}
                    onChange={(e) => setTargetDay(e.target.value)}
                    className="w-full appearance-none bg-white border border-stone-200 rounded-xl px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-stone-600"
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                  <CalendarDays
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsRecurrent(!isRecurrent)}
                  className={`flex items-center gap-2 px-4 rounded-xl border transition-all ${
                    isRecurrent
                      ? "bg-blue-50 border-blue-200 text-blue-600"
                      : "bg-white border-stone-200 text-stone-400"
                  }`}
                >
                  <Repeat size={18} />
                  <span className="text-sm font-medium hidden md:inline">
                    Récurrent
                  </span>
                </button>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl transition-colors shadow-md shadow-blue-200 flex justify-center items-center"
                >
                  <Plus size={24} />
                </button>
              </div>
            </form>
          </div>

          <div className="p-4">
            <div className="mb-2 text-xs font-bold text-stone-400 uppercase tracking-wider">
              Séances du {currentDayName}
            </div>
            {workoutsToDisplay.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-sm">
                Rien de prévu pour {currentDayName}.
              </div>
            ) : (
              <ul className="space-y-1">
                {workoutsToDisplay.map((workout) => {
                  const isCompleted = (
                    currentFitnessLog.completedIds || []
                  ).includes(workout.id);
                  return (
                    <li
                      key={workout.id}
                      className={`group flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                        isCompleted
                          ? "bg-blue-50 border border-blue-100"
                          : "bg-white border border-stone-100 hover:border-blue-200"
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <button
                          onClick={() => toggleWorkoutCompletion(workout.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                            isCompleted
                              ? "bg-blue-500 border-blue-500 text-white"
                              : "border-stone-300 text-transparent hover:border-blue-400"
                          }`}
                        >
                          <Check size={14} strokeWidth={3} />
                        </button>
                        <div className="flex flex-col">
                          <span
                            className={`text-lg transition-all duration-200 ${
                              isCompleted
                                ? "text-stone-400 line-through"
                                : "text-stone-700"
                            }`}
                          >
                            {workout.name}
                          </span>
                          <div className="flex gap-3">
                            <span className="text-xs text-stone-400 flex items-center gap-1">
                              <Timer size={10} /> {workout.time} min
                            </span>
                            {workout.recurrent && (
                              <span className="text-xs text-blue-400 flex items-center gap-1">
                                <Repeat size={10} /> Hebdomadaire
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          deleteWorkout(workout.id, workout.recurrent)
                        }
                        className="text-stone-300 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    );
  };

  const renderRecap = () => {
    // Calcul simplifié pour le bilan
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <header className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight mb-2">
            Bilan
          </h1>
          <p className="text-stone-500">
            Continuez vos efforts sur le long terme.
          </p>
        </header>
        <div className="p-8 text-center text-stone-400 bg-white rounded-2xl border border-stone-100">
          <BarChart2 size={48} className="mx-auto mb-4 opacity-20" />
          <p>
            Les statistiques se remplissent au fur et à mesure de votre
            utilisation.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 to-stone-200 text-stone-800 font-sans p-4 md:p-8 pb-24 md:pb-8 flex justify-center items-start">
      <div className="max-w-3xl w-full">
        {currentView === "dashboard" && renderDashboard()}
        {currentView === "fitness" && renderFitness()}
        {currentView === "recap" && renderRecap()}
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-stone-200 shadow-2xl rounded-full px-6 py-3 flex gap-8 z-50">
        <button
          onClick={() => setCurrentView("dashboard")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentView === "dashboard"
              ? "text-emerald-600"
              : "text-stone-400 hover:text-stone-600"
          }`}
        >
          <LayoutDashboard size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wide">
            Journal
          </span>
        </button>
        <div className="w-px bg-stone-200 my-1"></div>
        <button
          onClick={() => setCurrentView("fitness")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentView === "fitness"
              ? "text-blue-600"
              : "text-stone-400 hover:text-stone-600"
          }`}
        >
          <Dumbbell size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wide">
            Sport
          </span>
        </button>
        <div className="w-px bg-stone-200 my-1"></div>
        <button
          onClick={() => setCurrentView("recap")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentView === "recap"
              ? "text-purple-600"
              : "text-stone-400 hover:text-stone-600"
          }`}
        >
          <BarChart2 size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wide">
            Bilan
          </span>
        </button>
      </div>
    </div>
  );
}
