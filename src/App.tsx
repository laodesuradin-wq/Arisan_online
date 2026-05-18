import React, { useState, useRef, useEffect } from "react";
import { Member, ArisanRound } from "./types";
import { UserPlus, Trash2, Trophy, Users, Dices, RotateCcw, Award, Wallet, Plus, Minus, Banknote, LogIn, LogOut } from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [members, setMembers] = useState<Member[]>([]);
  const [history, setHistory] = useState<ArisanRound[]>([]);
  const [newMemberName, setNewMemberName] = useState("");
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<Member | null>(null);
  const [shuffleName, setShuffleName] = useState<string>("");
  const [iuranAmount, setIuranAmount] = useState<number>(50000);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const addMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    
    const newMember: Member = {
      id: crypto.randomUUID(),
      name: newMemberName.trim(),
      hasWon: false,
      joinDate: new Date().toISOString(),
      saldo: 0
    };
    
    setMembers([...members, newMember]);
    setNewMemberName("");
  };

  const updateMemberSaldo = (id: string, delta: number) => {
    setMembers(members.map(m => m.id === id ? { ...m, saldo: Math.max(0, (m.saldo || 0) + delta) } : m));
  };

  const removeMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
    // Optionally we could remove them from history if they haven't won yet, but maybe fine.
  };

  const drawWinner = () => {
    const eligibleMembers = members.filter(m => !m.hasWon);
    if (eligibleMembers.length === 0) return;

    setIsDrawing(true);
    setCurrentWinner(null);
    let shuffleCount = 0;
    const maxShuffles = 20;
    const intervalTime = 100;

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * eligibleMembers.length);
      setShuffleName(eligibleMembers[randomIndex].name);
      shuffleCount++;

      if (shuffleCount >= maxShuffles) {
        clearInterval(interval);
        
        // Pick actual winner
        const finalWinnerIndex = Math.floor(Math.random() * eligibleMembers.length);
        const winner = eligibleMembers[finalWinnerIndex];
        
        setCurrentWinner(winner);
        setIsDrawing(false);
        setShuffleName("");

        // Update member status
        setMembers(members.map(m => m.id === winner.id ? { ...m, hasWon: true } : m));

        // Add to history
        const round: ArisanRound = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          winnerId: winner.id,
          winnerName: winner.name,
        };
        setHistory([round, ...history]);

        // Fire confetti
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
        });
      }
    }, intervalTime);
  };

  const resetArisan = () => {
    if (window.confirm("Apakah Anda yakin ingin mereset data arisan?")) {
      setMembers([]);
      setHistory([]);
      setCurrentWinner(null);
    }
  };

  const resetPemenangMenu = () => {
     if (window.confirm("Apakah Anda yakin ingin mereset status pemenang? Semua anggota akan bisa diundi kembali.")) {
       setMembers(members.map(m => ({ ...m, hasWon: false })));
       setHistory([]);
       setCurrentWinner(null);
     }
  };

  const eligibleCount = members.filter(m => !m.hasWon).length;
  const totalSaldo = members.reduce((acc, m) => acc + (m.saldo || 0), 0);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-md py-6 px-4 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Dices className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-tight">Arisan Online</h1>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="flex items-center gap-2 bg-indigo-700/50 px-4 py-2 rounded-lg border border-indigo-500/30 flex-1 md:flex-none justify-center">
             <Wallet className="w-5 h-5 text-indigo-200" />
             <div className="flex flex-col">
               <span className="text-[10px] text-indigo-200 font-medium uppercase tracking-wider leading-none">Total Saldo Kas</span>
               <span className="font-bold whitespace-nowrap leading-tight">{formatRupiah(totalSaldo)}</span>
             </div>
           </div>
           <button 
             onClick={resetPemenangMenu}
             className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 transition-colors px-3 py-2 rounded-md text-sm font-medium flex-shrink-0"
           >
             <RotateCcw className="w-4 h-4" />
             <span className="hidden sm:inline">Reset Ronde</span>
           </button>
           {isLoggedIn ? (
             <button 
               onClick={() => setIsLoggedIn(false)}
               className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 transition-colors px-3 py-2 rounded-md text-sm font-medium flex-shrink-0"
             >
               <LogOut className="w-4 h-4" />
               <span className="hidden sm:inline">Logout</span>
             </button>
            ) : (
             <button 
               onClick={() => setIsLoggedIn(true)}
               className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 transition-colors px-3 py-2 rounded-md text-sm font-medium flex-shrink-0"
             >
               <LogIn className="w-4 h-4" />
               <span className="hidden sm:inline">Login</span>
             </button>
            )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input & Member List */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h2 className="font-semibold text-lg">Daftar Peserta</h2>
              <span className="ml-auto bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
                {members.length} Orang
              </span>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4 bg-neutral-100 p-3 rounded-lg border border-neutral-200">
                <Banknote className="w-4 h-4 text-neutral-500" />
                <span className="text-sm font-medium text-neutral-700">Nominal Iuran (Default):</span>
                <input
                  type="number"
                  value={iuranAmount}
                  onChange={(e) => setIuranAmount(Number(e.target.value) || 0)}
                  className="w-28 border border-neutral-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  step="10000"
                />
              </div>

              <form onSubmit={addMember} className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  placeholder="Nama Peserta Baru..." 
                  className="flex-1 border border-neutral-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!newMemberName.trim()}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </form>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                <AnimatePresence>
                  {members.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      className="text-center py-8 text-neutral-500 text-sm"
                    >
                      Belum ada peserta. Tambahkan peserta untuk memulai.
                    </motion.div>
                  ) : (
                    members.map(member => (
                      <motion.div 
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`flex flex-col gap-3 p-4 rounded-lg border ${member.hasWon ? 'bg-indigo-50 border-indigo-100 text-indigo-800' : 'bg-white border-neutral-200'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${member.hasWon ? 'bg-indigo-200 text-indigo-700' : 'bg-neutral-100 text-neutral-600'}`}>
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className={`font-medium leading-tight ${member.hasWon ? 'line-through opacity-70' : ''}`}>
                                {member.name}
                              </span>
                              <span className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                                <Banknote className="w-3 h-3" />
                                Saldo: {formatRupiah(member.saldo || 0)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {member.hasWon && <Trophy className="w-4 h-4 text-amber-500" />}
                            <button 
                              onClick={() => removeMember(member.id)}
                              className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                              aria-label="Hapus peserta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-100/50">
                          <span className="text-xs font-medium text-neutral-500">Kelola Saldo</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateMemberSaldo(member.id, -iuranAmount)}
                              className="w-7 h-7 flex items-center justify-center rounded bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors disabled:opacity-50"
                              title="Tarik Iuran"
                              disabled={(member.saldo || 0) < iuranAmount}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-medium w-12 text-center text-neutral-600">
                              {formatRupiah(iuranAmount).replace(',00', '').replace('Rp', '')}
                            </span>
                            <button
                              onClick={() => updateMemberSaldo(member.id, iuranAmount)}
                              className="w-7 h-7 flex items-center justify-center rounded bg-neutral-100 text-indigo-600 hover:bg-indigo-100 transition-colors"
                              title="Setor Iuran"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
              {members.length > 0 && (
                <div className="mt-6 pt-4 border-t border-neutral-100 flex justify-end">
                   <button onClick={resetArisan} className="text-red-600 text-sm font-medium hover:text-red-700">
                     Reset Semua Data
                   </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Draw & History */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Kocok Widget - Top priority action */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
             
             {/* Draw area */}
             {!currentWinner && !isDrawing && (
               <div className="text-center space-y-6">
                 <div className="bg-indigo-50 w-20 h-20 mx-auto rounded-full flex items-center justify-center">
                    <Award className="w-10 h-10 text-indigo-600" />
                 </div>
                 <div>
                   <h3 className="text-xl font-semibold mb-2">Siap untuk Mengocok?</h3>
                   <p className="text-neutral-500 text-sm">
                     Terdapat {eligibleCount} peserta yang belum menang.
                   </p>
                 </div>
               </div>
             )}

             {isDrawing && (
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="inline-block"
                  >
                    <Dices className="w-16 h-16 text-indigo-600" />
                  </motion.div>
                  <p className="text-neutral-500 font-medium">Mengocok...</p>
                  <motion.div 
                    key={shuffleName}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="text-3xl font-bold text-indigo-700 mt-4"
                  >
                    {shuffleName}
                  </motion.div>
                </div>
             )}

             {currentWinner && !isDrawing && (
               <motion.div 
                 initial={{ scale: 0.8, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="text-center space-y-4 z-10"
               >
                  <div className="inline-block p-4 bg-amber-100 text-amber-600 rounded-full mb-2">
                    <Trophy className="w-12 h-12" />
                  </div>
                  <h3 className="text-neutral-500 font-medium tracking-wide uppercase text-sm">Selamat Kepada</h3>
                  <div className="text-4xl font-extrabold text-neutral-900 break-words max-w-[400px]">
                    {currentWinner.name}
                  </div>
               </motion.div>
             )}

             <div className="mt-8 z-10">
                <button 
                  onClick={drawWinner}
                  disabled={isDrawing || eligibleCount === 0}
                  className="bg-indigo-600 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed flex items-center gap-3"
                >
                  <Dices className="w-6 h-6" />
                  {isDrawing ? "Mengocok..." : currentWinner ? "Kocok Lagi" : "Kocok Sekarang!"}
                </button>
             </div>
          </div>

          {/* History Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex-1">
            <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-indigo-600" />
              <h2 className="font-semibold text-lg">Riwayat Pemenang</h2>
            </div>
            <div className="p-0">
               {history.length === 0 ? (
                 <div className="p-8 text-center text-neutral-500 text-sm">
                   Belum ada riwayat pemenang.
                 </div>
               ) : (
                 <div className="divide-y divide-neutral-100">
                    <AnimatePresence>
                      {history.map((round, index) => (
                        <motion.div 
                          key={round.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-4 md:px-6 flex items-center gap-4 hover:bg-neutral-50 transition-colors"
                        >
                          <div className="bg-neutral-100 text-neutral-500 font-mono text-sm px-2 py-1 rounded w-8 text-center flex-shrink-0">
                            #{history.length - index}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-neutral-900 truncate text-lg">
                              {round.winnerName}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {new Date(round.date).toLocaleString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="text-amber-500 bg-amber-50 p-2 rounded-full hidden sm:block">
                            <Award className="w-5 h-5" />
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                 </div>
               )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
