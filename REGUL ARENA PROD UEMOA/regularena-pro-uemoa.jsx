import React, { useState, useEffect } from 'react';
import { Menu, X, Globe, TrendingUp, Award, Users, BookOpen, Zap, BarChart3, Lock, LogOut, Bell, Settings, ChevronRight, Flame, Target, Lightbulb } from 'lucide-react';

export default function RegularenaProUEMOA() {
  const [currentPage, setCurrentPage] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userLevel, setUserLevel] = useState(12);
  const [xp, setXp] = useState(3420);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  // Simuler les animations au chargement
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoggedIn) setCurrentPage('home');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Composant d'authentification
  const LoginPage = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative overflow-hidden">
      {/* Fond animé avec grille */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-cyan-500/20 mix-blend-screen" />
        <svg className="absolute w-full h-full" viewBox="0 0 1000 1000">
          <defs>
            <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="1000" height="1000" fill="url(#grid)" className="text-cyan-400/30" />
        </svg>
      </div>

      {/* Contenu de connexion */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="backdrop-blur-lg bg-slate-900/40 border border-cyan-500/30 rounded-2xl p-8 shadow-2xl">
          {/* En-tête avec logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-cyan-500 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-slate-950 font-bold" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">REGULARENA</h1>
                <p className="text-xs text-cyan-400 font-semibold">PRO UEMOA</p>
              </div>
            </div>
            <p className="text-sm text-slate-300">Plateforme réglementaire pour les professionnels</p>
          </div>

          {/* Formulaire */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Identifiant professionnel</label>
              <input
                type="text"
                placeholder="Votre email institutionnel"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:border-cyan-500 focus:outline-none transition"
                onChange={(e) => setUserName(e.target.value || 'Professionnel UEMOA')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:border-cyan-500 focus:outline-none transition"
              />
            </div>
            <button
              onClick={() => setIsLoggedIn(true)}
              className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 text-slate-950 font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/50"
            >
              Accéder à la plateforme
            </button>
          </div>

          {/* Lien d'aide */}
          <p className="text-xs text-slate-400 text-center mt-6">
            Partenaire BCEAO • Protocole sécurisé • UEMOA & CEMAC
          </p>
        </div>
      </div>
    </div>
  );

  // Page d'accueil (avant connexion)
  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative overflow-hidden">
      {/* Fond avec éléments visuels */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 right-10 w-96 h-96 bg-cyan-500 rounded-full blur-3xl mix-blend-screen" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-green-500 rounded-full blur-3xl mix-blend-screen" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-lg sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <h1 className="font-black text-white text-lg">REGULARENA PRO</h1>
              <p className="text-xs text-cyan-400 font-bold">UEMOA</p>
            </div>
          </div>
          <button
            onClick={() => setIsLoggedIn(true)}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-cyan-500 text-slate-950 font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
          >
            Connexion
          </button>
        </div>
      </nav>

      {/* Contenu principal */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20 animate-fade-in">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight leading-tight">
            Maîtrisez la <span className="bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent">Réglementation</span> en Jouant
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Plateforme d'apprentissage réglementaire pour les professionnels de l'UEMOA. Quiz, défis, arènes de compétition et certifications BCEAO.
          </p>
          <button
            onClick={() => setIsLoggedIn(true)}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-cyan-500 text-slate-950 font-bold text-lg rounded-xl hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105"
          >
            Démarrer Maintenant
          </button>
        </div>

        {/* Caractéristiques clés */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: BookOpen, title: 'Quiz Réglementaires', desc: 'Basés sur le dispositif prudentiel BCEAO' },
            { icon: Flame, title: 'Arènes de Compétition', desc: 'Défis professionnels UEMOA vs CEMAC' },
            { icon: Award, title: 'Certifications', desc: 'Validées par les autorités monétaires' },
          ].map((feature, i) => (
            <div key={i} className="backdrop-blur-lg bg-slate-900/40 border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-500/50 transition group cursor-pointer">
              <feature.icon className="w-10 h-10 text-cyan-400 mb-3 group-hover:text-green-400 transition" />
              <h3 className="font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-300">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Statistiques */}
        <div className="grid md:grid-cols-4 gap-4 text-center">
          {[
            { label: 'Professionnels', value: '12,450+' },
            { label: 'Quiz Disponibles', value: '340' },
            { label: 'Pays UEMOA', value: '8' },
            { label: 'Partenaires', value: 'BCEAO' },
          ].map((stat, i) => (
            <div key={i} className="backdrop-blur-lg bg-slate-900/40 border border-cyan-500/20 rounded-lg p-4">
              <p className="text-2xl font-black text-cyan-400">{stat.value}</p>
              <p className="text-xs text-slate-300 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Dashboard Principal
  const Dashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Fond */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-500 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-20 w-96 h-96 bg-green-500 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-slate-950/80 backdrop-blur-lg border-r border-cyan-500/20 transition-all duration-300 flex flex-col fixed h-screen overflow-y-auto`}>
          {/* Logo */}
          <div className="p-6 border-b border-cyan-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Globe className="w-6 h-6 text-slate-950 font-bold" />
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className="font-black text-white text-sm">REGULARENA</h1>
                  <p className="text-xs text-cyan-400 font-bold">PRO</p>
                </div>
              )}
            </div>
          </div>

          {/* Menu principal */}
          <nav className="flex-1 p-4 space-y-2">
            {[
              { id: 'dashboard', icon: BarChart3, label: 'Tableau de Bord' },
              { id: 'quiz', icon: BookOpen, label: 'Quiz & Formation' },
              { id: 'arena', icon: Flame, label: 'L\'Arène' },
              { id: 'achievements', icon: Award, label: 'Réalisations' },
              { id: 'leaderboard', icon: TrendingUp, label: 'Classements' },
              { id: 'academy', icon: Lightbulb, label: 'Académie' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  currentPage === item.id
                    ? 'bg-gradient-to-r from-green-500/30 to-cyan-500/30 border border-cyan-500/50 text-cyan-300'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-semibold">{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* Profil utilisateur */}
          <div className="p-4 border-t border-cyan-500/20 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-white transition">
              <Settings className="w-5 h-5" />
              {sidebarOpen && <span className="text-sm font-semibold">Paramètres</span>}
            </button>
            <button
              onClick={() => setIsLoggedIn(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition"
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="text-sm font-semibold">Déconnexion</span>}
            </button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className={`${sidebarOpen ? 'ml-72' : 'ml-20'} flex-1 transition-all duration-300 flex flex-col`}>
          {/* Header */}
          <header className="bg-slate-950/80 backdrop-blur-lg border-b border-cyan-500/20 px-8 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-300 hover:text-white transition p-2 rounded-lg hover:bg-slate-800/50"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-6">
              <button className="relative p-2 text-slate-300 hover:text-white transition hover:bg-slate-800/50 rounded-lg">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-cyan-500 rounded-lg flex items-center justify-center text-slate-950 font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-white">{userName}</p>
                <p className="text-xs text-slate-400">Professionnel UEMOA</p>
              </div>
            </div>
          </header>

          {/* Contenu */}
          <div className="flex-1 overflow-y-auto p-8">
            {currentPage === 'dashboard' && <DashboardContent userLevel={userLevel} xp={xp} userName={userName} />}
            {currentPage === 'quiz' && <QuizContent />}
            {currentPage === 'arena' && <ArenaContent />}
            {currentPage === 'achievements' && <AchievementsContent />}
            {currentPage === 'leaderboard' && <LeaderboardContent />}
            {currentPage === 'academy' && <AcademyContent />}
          </div>
        </div>
      </div>
    </div>
  );

  // Contenu Dashboard
  const DashboardContent = ({ userLevel, xp, userName }) => (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête de bienvenue */}
      <div className="backdrop-blur-lg bg-gradient-to-r from-slate-900/40 to-blue-900/40 border border-cyan-500/20 rounded-xl p-8">
        <h2 className="text-3xl font-black text-white mb-2">Bienvenue, {userName.split(' ')[0]}</h2>
        <p className="text-slate-300">Poursuivez votre maîtrise de la réglementation BCEAO</p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { label: 'Niveau', value: userLevel, icon: Zap, color: 'from-amber-400 to-orange-500' },
          { label: 'Points XP', value: xp.toLocaleString(), icon: TrendingUp, color: 'from-green-400 to-cyan-500' },
          { label: 'Séries en cours', value: '7', icon: Flame, color: 'from-red-400 to-pink-500' },
          { label: 'Rang UEMOA', value: '#342', icon: Award, color: 'from-purple-400 to-blue-500' },
        ].map((stat, i) => (
          <div key={i} className="backdrop-blur-lg bg-slate-900/40 border border-cyan-500/20 rounded-lg p-6 group hover:border-cyan-500/50 transition">
            <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className="text-2xl font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Progression et objectifs */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Barre de progression */}
        <div className="backdrop-blur-lg bg-slate-900/40 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">Progression Niveau {userLevel}</h3>
            <span className="text-xs font-bold text-cyan-400">{Math.round((xp % 1000) / 10)}%</span>
          </div>
          <div className="w-full bg-slate-800/50 rounded-full h-3 overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${(xp % 1000) / 10}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-3">{xp % 1000} / 1000 XP pour le prochain niveau</p>
        </div>

        {/* Objectifs du jour */}
        <div className="backdrop-blur-lg bg-slate-900/40 border border-cyan-500/20 rounded-xl p-6">
          <h3 className="font-bold text-white mb-4">Objectifs du jour</h3>
          <div className="space-y-3">
            {[
              { task: '3 Quiz de 10 questions', done: true },
              { task: 'Défier 1 adversaire', done: false },
              { task: 'Lire un article BCEAO', done: true },
            ].map((obj, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 ${obj.done ? 'bg-green-500 border-green-500' : 'border-slate-600'}`}>
                  {obj.done && <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>}
                </div>
                <span className={`text-sm ${obj.done ? 'text-slate-400 line-through' : 'text-white'}`}>{obj.task}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Derniers quiz complétés */}
      <div className="backdrop-blur-lg bg-slate-900/40 border border-cyan-500/20 rounded-xl p-6">
        <h3 className="font-bold text-white mb-4">Quiz Récents</h3>
        <div className="space-y-3">
          {[
            { title: 'Dispositif prudentiel - Niveau 2', score: 18, total: 20, date: 'Aujourd\'hui' },
            { title: 'Code Pénal & Sanctions', score: 16, total: 20, date: 'Hier' },
            { title: 'Réglementation des Échanges', score: 19, total: 20, date: '2 jours' },
          ].map((quiz, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg hover:border-cyan-500/30 transition">
              <div>
                <p className="font-semibold text-white">{quiz.title}</p>
                <p className="text-xs text-slate-400">{quiz.date}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-400">{quiz.score}/{quiz.total}</p>
                <p className="text-xs text-slate-400">{Math.round((quiz.score / quiz.total) * 100)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Contenu Quiz
  const QuizContent = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-3xl font-black text-white">Quiz & Formation</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {[
          { title: 'Dispositif Prudentiel', level: 'Intermédiaire', questions: 45, color: 'from-blue-500 to-cyan-500' },
          { title: 'Code Pénal UEMOA', level: 'Avancé', questions: 60, color: 'from-purple-500 to-pink-500' },
          { title: 'Réglementation des Échanges', level: 'Débutant', questions: 30, color: 'from-green-500 to-emerald-500' },
          { title: 'Résidents & Ressortissants', level: 'Intermédiaire', questions: 40, color: 'from-orange-500 to-red-500' },
        ].map((quiz, i) => (
          <div key={i} className="backdrop-blur-lg bg-gradient-to-br from-slate-900/40 to-slate-900/20 border border-cyan-500/20 rounded-xl p-6 group hover:border-cyan-500/50 transition cursor-pointer">
            <div className={`w-14 h-14 bg-gradient-to-br ${quiz.color} rounded-lg flex items-center justify-center mb-4`}>
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-bold text-white mb-2">{quiz.title}</h3>
            <p className="text-xs text-slate-400 mb-4">{quiz.questions} questions • {quiz.level}</p>
            <button className="w-full py-2 bg-gradient-to-r from-green-500 to-cyan-500 text-slate-950 font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition">
              Commencer
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Contenu Arena
  const ArenaContent = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-3xl font-black text-white">L'Arène - Défis Professionnels</h2>
      <div className="backdrop-blur-lg bg-gradient-to-r from-slate-900/40 to-blue-900/40 border border-cyan-500/20 rounded-xl p-8 text-center">
        <Flame className="w-16 h-16 text-orange-400 mx-auto mb-4" />
        <h3 className="text-2xl font-black text-white mb-2">Prêt pour un Duel ?</h3>
        <p className="text-slate-300 mb-6">Affrontez d'autres professionnels UEMOA/CEMAC en temps réel</p>
        <button className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-orange-500/50 transition transform hover:scale-105">
          Chercher un Adversaire
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {[
          { title: 'Duels Rapides (2 min)', difficulty: 'Tous niveaux', players: '2,340 en ligne' },
          { title: 'Tournois UEMOA', difficulty: 'Compétitif', players: '5,120 participants' },
        ].map((mode, i) => (
          <div key={i} className="backdrop-blur-lg bg-slate-900/40 border border-cyan-500/20 rounded-xl p-6">
            <h3 className="font-bold text-white mb-2">{mode.title}</h3>
            <p className="text-sm text-slate-400 mb-4">{mode.difficulty} • {mode.players}</p>
            <button className="w-full py-2 bg-gradient-to-r from-green-500 to-cyan-500 text-slate-950 font-bold rounded-lg hover:shadow-lg transition">
              Participer
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Contenu Achievements
  const AchievementsContent = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-3xl font-black text-white">Réalisations & Badges</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { emoji: '🎓', title: 'Expert Réglementation', desc: 'Niveau 10 atteint', unlocked: true },
          { emoji: '🔥', title: 'Série de 7 jours', desc: 'Quiz quotidiens', unlocked: true },
          { emoji: '👑', title: 'Champion Arena', desc: '10 victoires', unlocked: false },
          { emoji: '🌍', title: 'Ambassadeur UEMOA', desc: 'Tous les pays visités', unlocked: false },
          { emoji: '⚡', title: 'Éclair Réglementaire', desc: 'Quiz en moins de 1 min', unlocked: true },
          { emoji: '📚', title: 'Bibliothèque', desc: '50 articles BCEAO lus', unlocked: false },
        ].map((badge, i) => (
          <div
            key={i}
            className={`backdrop-blur-lg rounded-xl p-6 border transition text-center ${
              badge.unlocked
                ? 'bg-slate-900/40 border-cyan-500/20 hover:border-cyan-500/50'
                : 'bg-slate-900/20 border-slate-700/30 opacity-50'
            }`}
          >
            <div className="text-4xl mb-3">{badge.emoji}</div>
            <h3 className="font-bold text-white mb-1">{badge.title}</h3>
            <p className="text-xs text-slate-400">{badge.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // Contenu Leaderboard
  const LeaderboardContent = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-3xl font-black text-white">Classement UEMOA</h2>
      <div className="backdrop-blur-lg bg-slate-900/40 border border-cyan-500/20 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-cyan-500/20">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-white">Votre classement: #342 / 12,450</span>
          </div>
          <div className="w-full bg-slate-800/50 rounded-full h-2">
            <div className="h-full bg-gradient-to-r from-green-500 to-cyan-500" style={{ width: '2.7%' }} />
          </div>
        </div>
        <div className="divide-y divide-slate-800/50">
          {[
            { rank: 1, name: 'Koné Mamadou', country: 'Mali', xp: '45,320' },
            { rank: 2, name: 'Diallo Fatoumata', country: 'Sénégal', xp: '44,890' },
            { rank: 3, name: 'Touré Ibrahim', country: 'Côte d\'Ivoire', xp: '43,720' },
            { rank: 342, name: userName, country: 'UEMOA', xp: xp.toString(), highlight: true },
          ].map((player, i) => (
            <div key={i} className={`px-6 py-4 flex items-center justify-between ${player.highlight ? 'bg-cyan-500/10 border-l-4 border-cyan-500' : ''}`}>
              <div className="flex items-center gap-4">
                <span className={`font-black text-lg ${player.rank <= 3 ? 'text-yellow-400' : 'text-slate-400'}`}>#{player.rank}</span>
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-cyan-500 rounded-lg flex items-center justify-center text-slate-950 font-bold text-sm">
                  {player.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white">{player.name}</p>
                  <p className="text-xs text-slate-400">{player.country}</p>
                </div>
              </div>
              <span className="font-bold text-green-400">{player.xp} XP</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Contenu Académie
  const AcademyContent = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-3xl font-black text-white">Académie Regularena</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {[
          {
            title: 'Dispositif Prudentiel BCEAO',
            modules: 12,
            duration: '24h',
            image: '📋',
          },
          {
            title: 'Code Pénal & Sanctions',
            modules: 8,
            duration: '16h',
            image: '⚖️',
          },
          {
            title: 'Gestion des Risques',
            modules: 10,
            duration: '20h',
            image: '⚠️',
          },
          {
            title: 'Conformité UEMOA',
            modules: 9,
            duration: '18h',
            image: '✅',
          },
        ].map((course, i) => (
          <div key={i} className="backdrop-blur-lg bg-gradient-to-br from-slate-900/40 to-slate-900/20 border border-cyan-500/20 rounded-xl p-6 group hover:border-cyan-500/50 transition">
            <div className="text-5xl mb-4">{course.image}</div>
            <h3 className="font-bold text-white mb-2">{course.title}</h3>
            <p className="text-xs text-slate-400 mb-4">{course.modules} modules • {course.duration}</p>
            <button className="w-full py-2 bg-gradient-to-r from-green-500 to-cyan-500 text-slate-950 font-bold rounded-lg hover:shadow-lg transition">
              Commencer
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Rendu principal
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@400;500;600;700&display=swap');

        * {
          font-family: 'Space Grotesk', sans-serif;
        }

        h1, h2, h3, h4, h5, h6 {
          font-family: 'Syne', sans-serif;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(34, 197, 94, 0.4);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 197, 94, 0.6);
        }
      `}</style>

      {!isLoggedIn ? (
        <>
          <HomePage />
          <div className="mt-0">
            <LoginPage />
          </div>
        </>
      ) : (
        <Dashboard />
      )}
    </>
  );
}
