import React, { useState, useRef, useEffect } from "react";
import { Member, ArisanRound, Transaction } from "./types";
import { UserPlus, Trash2, Trophy, Users, Dices, RotateCcw, Award, Wallet, Plus, Minus, Banknote, LogIn, LogOut, AlertCircle, Calendar, Bell, Clock, FileText, ArrowDownRight, ArrowUpRight, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [members, setMembers] = useState<Member[]>([]);
  const [history, setHistory] = useState<ArisanRound[]>([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'transactions'>('history');
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<Member | null>(null);
  const [shuffleName, setShuffleName] = useState<string>("");
  const [iuranAmount, setIuranAmount] = useState<number | string>(10000);
  const [memberIuranInputs, setMemberIuranInputs] = useState<Record<string, number | string>>({});
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [arisanInterval, setArisanInterval] = useState<number>(30); // dalam hari
  const [nextDrawDate, setNextDrawDate] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!nextDrawDate) {
      setTimeLeft("");
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(nextDrawDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft("Waktunya Mengocok!");
        clearInterval(interval);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft(`${days}h ${hours}j ${minutes}m ${seconds}d`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextDrawDate]);

  const setNextDraw = () => {
    const date = new Date();
    date.setDate(date.getDate() + arisanInterval);
    setNextDrawDate(date.toISOString());
  };

  const addMember = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newMemberName.trim();
    
    if (!name) {
      setErrorMessage("Nama peserta tidak boleh kosong.");
      return;
    }
    
    if (name.length < 3) {
      setErrorMessage("Nama peserta minimal 3 karakter.");
      return;
    }
    
    if (members.some(m => m.name.toLowerCase() === name.toLowerCase())) {
      setErrorMessage("Nama peserta sudah terdaftar.");
      return;
    }
    
    setErrorMessage("");

    const newMember: Member = {
      id: crypto.randomUUID(),
      name: name,
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

  const confirmAndUpdateSaldo = (member: Member, delta: number) => {
    const amount = Math.abs(delta);
    if (amount <= 0) {
      alert("Nominal transaksi harus lebih dari 0.");
      return;
    }
    
    updateMemberSaldo(member.id, delta);
    
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      memberId: member.id,
      memberName: member.name,
      type: delta > 0 ? 'IN' : 'OUT',
      amount: Math.abs(delta),
      date: new Date().toISOString(),
      description: delta > 0 ? 'Menabung' : 'Tarik tabungan'
    };
    setTransactions((prev) => [transaction, ...prev]);
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

        // Update member status and reset saldo
        setMembers(members.map(m => m.id === winner.id ? { ...m, hasWon: true, saldo: 0 } : { ...m, saldo: 0 }));

        // Add to history
        const round: ArisanRound = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          winnerId: winner.id,
          winnerName: winner.name,
        };
        setHistory([round, ...history]);
        
        // Reset transactions for the new round
        setTransactions([]);

        // Fire confetti
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
        });

        // Set next draw date
        setNextDraw();
      }
    }, intervalTime);
  };

  const resetArisan = () => {
    if (window.confirm("Apakah Anda yakin ingin mereset data arisan?")) {
      setMembers([]);
      setHistory([]);
      setTransactions([]);
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
      <header className="bg-indigo-600 text-white shadow-md py-3 px-4 md:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Dices className="w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight">Arisan Online</h1>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="flex items-center gap-2 bg-indigo-700/50 px-3 py-1.5 rounded-lg border border-indigo-500/30 flex-1 md:flex-none justify-center">
             <Wallet className="w-4 h-4 text-indigo-200" />
             <div className="flex flex-col">
               <span className="text-[9px] text-indigo-200 font-medium uppercase tracking-wider leading-none">Total Saldo Kas</span>
               <span className="font-bold text-sm whitespace-nowrap leading-tight">{formatRupiah(totalSaldo)}</span>
             </div>
           </div>
           <button 
             onClick={resetPemenangMenu}
             className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 transition-colors px-2.5 py-1.5 rounded-md text-xs font-medium flex-shrink-0"
           >
             <RotateCcw className="w-3.5 h-3.5" />
             <span className="hidden sm:inline">Reset Ronde</span>
           </button>
           {isLoggedIn ? (
             <button 
               onClick={() => setIsLoggedIn(false)}
               className="flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-800 transition-colors px-2.5 py-1.5 rounded-md text-xs font-medium flex-shrink-0"
             >
               <LogOut className="w-3.5 h-3.5" />
               <span className="hidden sm:inline">Logout</span>
             </button>
            ) : (
             <button 
               onClick={() => setIsLoggedIn(true)}
               className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 transition-colors px-2.5 py-1.5 rounded-md text-xs font-medium flex-shrink-0"
             >
               <LogIn className="w-3.5 h-3.5" />
               <span className="hidden sm:inline">Login</span>
             </button>
            )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Promotional Banner */}
        <div className="col-span-1 lg:col-span-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white rounded-xl shadow-md"
          >
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-white opacity-10 blur-2xl"></div>
            
            <div className="relative z-10 px-4 py-3 md:px-5 md:py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                <div className="hidden sm:flex flex-shrink-0 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full items-center justify-center border border-white/20">
                  <Award className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide text-white">Tabungan Pintar & Transparan</h3>
                  <p className="text-white/90 text-[11px] md:text-xs mt-0.5 max-w-3xl leading-relaxed">
                    Sistem otomatis mengecek dan men-update kalender setoran setiap harinya berdasarkan saldo riil yang ada. Tidak perlu repot cek mutasi manual.
                  </p>
                </div>
              </div>

              <div className="flex-shrink-0 flex gap-2">
                 <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors">
                   <Calendar className="w-4 h-4 text-pink-300" />
                 </div>
                 <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors">
                   <Wallet className="w-4 h-4 text-indigo-300" />
                 </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Left Column: Input & Member List */}
        <div className="lg:col-span-5 flex flex-col gap-4">

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h2 className="font-semibold text-base">Daftar Peserta</h2>
              <span className="ml-auto bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
                {members.length} Orang
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3 bg-neutral-100 p-2 rounded-lg border border-neutral-200">
                <Banknote className="w-4 h-4 text-neutral-500" />
                <span className="text-sm font-medium text-neutral-700">Nominal Tabungan Harian:</span>
                <input
                  type="number"
                  value={iuranAmount}
                  onChange={(e) => setIuranAmount(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-24 border border-neutral-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  step="10000"
                  min="0"
                />
              </div>

              <form onSubmit={addMember} className="flex flex-col gap-2 mb-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nama Peserta Baru..." 
                    className={`flex-1 border text-sm ${errorMessage ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-neutral-300 focus:ring-indigo-500 focus:border-indigo-500'} rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 transition-shadow`}
                    value={newMemberName}
                    onChange={(e) => {
                      setNewMemberName(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                  />
                  <button 
                    type="submit"
                    disabled={!newMemberName.trim()}
                    className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
                <AnimatePresence>
                  {errorMessage && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-500 text-xs flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errorMessage}
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
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
                        className={`flex flex-col gap-2 p-3 rounded-lg border ${member.hasWon ? 'bg-indigo-50 border-indigo-100 text-indigo-800' : 'bg-white border-neutral-200'} text-sm`}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMemberId(activeMemberId === member.id ? null : member.id);
                              }}
                              className={`p-1 transition-colors ${activeMemberId === member.id ? 'text-indigo-600' : 'text-neutral-400 hover:text-indigo-500'}`}
                              title="Tampilkan Progress Tabungan"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMemberId(member.id);
                                confirmAndUpdateSaldo(member, -(Number(memberIuranInputs[member.id] !== undefined ? memberIuranInputs[member.id] : iuranAmount) || 0));
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors disabled:opacity-50 flex-shrink-0"
                              title="Tarik Tabungan"
                              disabled={(member.saldo || 0) < (Number(memberIuranInputs[member.id] !== undefined ? memberIuranInputs[member.id] : iuranAmount) || 0)}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              value={memberIuranInputs[member.id] !== undefined ? memberIuranInputs[member.id] : iuranAmount}
                              onChange={(e) => setMemberIuranInputs({ ...memberIuranInputs, [member.id]: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0) })}
                              onFocus={() => setActiveMemberId(member.id)}
                              className="w-20 border border-neutral-300 rounded px-1 py-1 text-xs text-center bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                              step="10000"
                              min="0"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMemberId(member.id);
                                confirmAndUpdateSaldo(member, Number(memberIuranInputs[member.id] !== undefined ? memberIuranInputs[member.id] : iuranAmount) || 0);
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded bg-neutral-100 text-indigo-600 hover:bg-indigo-100 transition-colors flex-shrink-0"
                              title="Menabung"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Progress Tabungan (Tanggal Terceklis) */}
                        <AnimatePresence>
                          {activeMemberId === member.id && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-3 border-t border-neutral-100/50 mt-1">
                                <span className="text-[11px] font-medium text-neutral-500 mb-2 block flex items-center justify-between">
                                  <span>Progress Tabungan Harian (Berdasarkan Saldo)</span>
                                  <button onClick={() => setActiveMemberId(null)} className="text-neutral-400 hover:text-neutral-600">
                                    Tutup
                                  </button>
                                </span>
                                <div className="flex flex-wrap gap-1 pb-1">
                                  {(() => {
                                    const currentDate = new Date();
                                    const currentMonth = currentDate.getMonth();
                                    const currentYear = currentDate.getFullYear();
                                    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                                    const currentDayStr = currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
                                    const currentDay = currentDate.getDate();
                                    
                                    const depositTarget = Number(iuranAmount) || 10000;
                                    const totalDaysPaid = Math.floor((member.saldo || 0) / depositTarget);
                                    
                                    const checkedDays = new Set<number>();
                                    let remaining = totalDaysPaid;
                                    
                                    const inTx = transactions
                                      .filter(t => t.memberId === member.id && t.type === 'IN')
                                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                                      
                                    for (const t of inTx) {
                                      if (remaining <= 0) break;
                                      const d = new Date(t.date);
                                      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                                        let tDay = d.getDate();
                                        const daysForTx = Math.floor(t.amount / depositTarget);
                                        for (let i = 0; i < daysForTx; i++) {
                                          if (remaining <= 0) break;
                                          let checkDay = tDay + i;
                                          if (checkDay > daysInMonth) checkDay = checkDay - daysInMonth; 
                                          checkedDays.add(checkDay);
                                          remaining--;
                                        }
                                      }
                                    }
                                    
                                    let fallbackDay = 1;
                                    while (remaining > 0 && fallbackDay <= daysInMonth) {
                                      if (!checkedDays.has(fallbackDay)) {
                                        checkedDays.add(fallbackDay);
                                        remaining--;
                                      }
                                      fallbackDay++;
                                    }
                                    
                                    return (
                                      <>
                                        <div className="w-full text-[10px] text-neutral-400 mb-1 font-medium">Bulan: {currentDayStr}</div>
                                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                          const isChecked = checkedDays.has(day);
                                          const isToday = day === currentDay;
                                          return (
                                            <div 
                                              key={day} 
                                              className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${isChecked ? 'bg-indigo-500 text-white shadow-sm' : 'bg-neutral-100 text-neutral-400'} ${isToday && !isChecked ? 'ring-1 ring-indigo-400' : ''}`}
                                              title={`Tanggal ${day} ${isChecked ? '(Sudah Menabung)' : '(Belum)'}`}
                                            >
                                              {isChecked ? <Check className="w-3 h-3" /> : day}
                                            </div>
                                          );
                                        })}
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
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
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Jadwal & Pengingat Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h2 className="font-semibold text-base">Jadwal Arisan</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Periode Arisan</label>
                <select 
                  value={arisanInterval}
                  onChange={(e) => setArisanInterval(Number(e.target.value))}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                >
                  <option value={1}>1 Hari</option>
                  <option value={7}>1 Minggu</option>
                  <option value={14}>2 Minggu</option>
                  <option value={30}>1 Bulan</option>
                  <option value={90}>3 Bulan</option>
                  <option value={180}>6 Bulan</option>
                  <option value={365}>1 Tahun</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Jadwal Berikutnya</label>
                <button 
                  onClick={setNextDraw}
                  className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  {nextDrawDate ? "Perbarui Jadwal" : "Mulai Jadwal"}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {nextDrawDate && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="bg-white p-2.5 rounded-full shadow-sm">
                      <Bell className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-indigo-900 font-semibold">Pengingat Pengundian</p>
                      <p className="text-xs text-indigo-700 capitalize">
                        {new Date(nextDrawDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto text-center sm:text-right">
                    <span className="inline-block w-full sm:w-auto bg-white px-4 py-2 rounded-lg text-indigo-700 font-bold text-sm shadow-sm border border-indigo-100 font-mono tracking-wider">
                      {timeLeft}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Kocok Widget - Top priority action */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5 flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden">
             
             {/* Draw area */}
             {!currentWinner && !isDrawing && (
               <div className="text-center space-y-4">
                 <div className="bg-indigo-50 w-16 h-16 mx-auto rounded-full flex items-center justify-center">
                    <Award className="w-8 h-8 text-indigo-600" />
                 </div>
                 <div>
                   <h3 className="text-lg font-semibold mb-1">Siap untuk Mengocok?</h3>
                   <p className="text-neutral-500 text-xs">
                     Terdapat {eligibleCount} peserta yang belum menang.
                   </p>
                 </div>
               </div>
             )}

             {isDrawing && (
                <div className="text-center space-y-3">
                  <motion.div
                    animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="inline-block"
                  >
                    <Dices className="w-12 h-12 text-indigo-600" />
                  </motion.div>
                  <p className="text-neutral-500 font-medium text-sm">Mengocok...</p>
                  <motion.div 
                    key={shuffleName}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="text-2xl font-bold text-indigo-700 mt-2"
                  >
                    {shuffleName}
                  </motion.div>
                </div>
             )}

             {currentWinner && !isDrawing && (
               <motion.div 
                 initial={{ scale: 0.8, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="text-center space-y-3 z-10"
               >
                  <div className="inline-block p-3 bg-amber-100 text-amber-600 rounded-full mb-1">
                    <Trophy className="w-10 h-10" />
                  </div>
                  <h3 className="text-neutral-500 font-medium tracking-wide uppercase text-xs">Selamat Kepada</h3>
                  <div className="text-3xl font-extrabold text-neutral-900 break-words max-w-[400px]">
                    {currentWinner.name}
                  </div>
               </motion.div>
             )}

             <div className="mt-6 z-10">
                <button 
                  onClick={drawWinner}
                  disabled={isDrawing || eligibleCount === 0}
                  className="bg-indigo-600 text-white font-bold text-base px-6 py-3 rounded-lg shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Dices className="w-5 h-5" />
                  {isDrawing ? "Mengocok..." : currentWinner ? "Kocok Lagi" : "Kocok Sekarang!"}
                </button>
             </div>
          </div>

          {/* History Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex-1">
            <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200 flex items-center gap-4">
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 font-semibold text-base transition-colors ${activeTab === 'history' ? 'text-indigo-600' : 'text-neutral-400 hover:text-neutral-600'}`}
              >
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Riwayat Pemenang</span>
                <span className="sm:hidden">Pemenang</span>
              </button>
              <div className="w-px h-5 bg-neutral-300"></div>
              <button 
                onClick={() => setActiveTab('transactions')}
                className={`flex items-center gap-1.5 font-semibold text-base transition-colors ${activeTab === 'transactions' ? 'text-indigo-600' : 'text-neutral-400 hover:text-neutral-600'}`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Riwayat Transaksi</span>
                <span className="sm:hidden">Transaksi</span>
              </button>
            </div>

            <div className="p-0">
               {activeTab === 'history' ? (
                 history.length === 0 ? (
                   <div className="p-6 text-center text-neutral-500 text-sm">
                     Belum ada riwayat pemenang.
                   </div>
                 ) : (
                   <div className="divide-y divide-neutral-100 max-h-[500px] overflow-y-auto">
                      <AnimatePresence>
                        {history.map((round, index) => (
                          <motion.div 
                            key={round.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-3 md:px-4 flex items-center gap-3 hover:bg-neutral-50 transition-colors"
                          >
                            <div className="bg-neutral-100 text-neutral-500 font-mono text-xs px-2 py-1 rounded w-8 text-center flex-shrink-0">
                              #{history.length - index}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-neutral-900 truncate text-base">
                                {round.winnerName}
                              </p>
                              <p className="text-[10px] text-neutral-500">
                                {new Date(round.date).toLocaleString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="text-amber-500 bg-amber-50 p-1.5 rounded-full hidden sm:block">
                              <Award className="w-4 h-4" />
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                   </div>
                 )
               ) : (
                 transactions.length === 0 ? (
                   <div className="p-6 text-center text-neutral-500 text-sm">
                     Belum ada riwayat transaksi.
                   </div>
                 ) : (
                   <div className="divide-y divide-neutral-100 max-h-[500px] overflow-y-auto">
                      <AnimatePresence>
                        {transactions.map((tx) => (
                          <motion.div 
                            key={tx.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-3 md:px-4 flex items-center justify-between hover:bg-neutral-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-full ${tx.type === 'IN' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                {tx.type === 'IN' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-neutral-900 truncate text-sm">
                                  {tx.memberName}
                                </p>
                                <p className="text-[10px] text-neutral-500">
                                  {tx.description} • {new Date(tx.date).toLocaleString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className={`font-mono text-sm font-bold flex-shrink-0 ${tx.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {tx.type === 'IN' ? '+' : '-'}{formatRupiah(tx.amount)}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                   </div>
                 )
               )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
