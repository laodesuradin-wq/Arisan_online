import React, { useState, useRef, useEffect } from "react";
import { Member, ArisanRound, Transaction, ChatMessage } from "./types";
import { UserPlus, Trash2, Trophy, Users, Dices, RotateCcw, Award, Wallet, Plus, Minus, Banknote, LogIn, LogOut, AlertCircle, Calendar, Bell, Clock, FileText, ArrowDownRight, ArrowUpRight, Check, Edit2, MessageCircle, X, Send, ImageIcon, Mic, Paperclip, IdCard, Download, Eye, EyeOff } from "lucide-react";
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
  const [currentUser, setCurrentUser] = useState<{ role: 'admin' | 'member', name: string } | null>(null);
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMode, setLoginMode] = useState<'member' | 'admin'>('member');
  const [adminPassword, setAdminPassword] = useState("admin123");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [arisanName, setArisanName] = useState<string>("Arisan Online");
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempArisanName, setTempArisanName] = useState<string>("");

  const [arisanInterval, setArisanInterval] = useState<number>(30); // dalam hari
  const [nextDrawDate, setNextDrawDate] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [selectedMemberCard, setSelectedMemberCard] = useState<Member | null>(null);
  
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isChatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isChatOpen, chatMessages]);

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

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessageText.trim() && !currentUser) return;
    
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      senderName: currentUser ? currentUser.name : (isAdmin ? 'Admin' : 'Sistem'),
      text: newMessageText.trim(),
      timestamp: new Date().toISOString()
    };
    
    setChatMessages([...chatMessages, newMessage]);
    setNewMessageText("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newMessage: ChatMessage = {
          id: crypto.randomUUID(),
          senderName: currentUser.name,
          imageUrl: reader.result as string,
          timestamp: new Date().toISOString()
        };
        setChatMessages([...chatMessages, newMessage]);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (currentUser) {
          const newMessage: ChatMessage = {
            id: crypto.randomUUID(),
            senderName: currentUser.name,
            audioUrl: audioUrl,
            timestamp: new Date().toISOString()
          };
          setChatMessages(prev => [...prev, newMessage]);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Tidak dapat mengakses mikrofon. Pastikan Anda telah memberikan izin.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
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

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl flex flex-col gap-6">
          <div className="text-center">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Dices className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">{arisanName}</h2>
            <p className="text-sm text-neutral-500 mt-1">Masuk untuk melanjutkan</p>
          </div>
          
          <AnimatePresence>
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-200 flex items-start gap-3 shadow-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="leading-snug">{errorMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex bg-neutral-100 p-1 rounded-lg">
            <button
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${loginMode === 'member' ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
              onClick={() => { setLoginMode('member'); setErrorMessage(""); }}
            >
              Peserta
            </button>
            <button
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${loginMode === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
              onClick={() => { setLoginMode('admin'); setErrorMessage(""); setIsResettingPassword(false); }}
            >
              Admin
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nama / Username</label>
              <input
                 type="text"
                 value={loginName}
                 onChange={(e) => setLoginName(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     document.getElementById('login-btn')?.click();
                   }
                 }}
                 className="w-full border border-neutral-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                 placeholder={loginMode === 'member' ? "Nama peserta" : "Username admin"}
              />
            </div>
            
            {loginMode === 'admin' && !isResettingPassword && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        document.getElementById('login-btn')?.click();
                      }
                    }}
                    className="w-full border border-neutral-300 rounded-lg pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Masukkan password admin"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                    title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <button 
                    onClick={() => {
                       setIsResettingPassword(true);
                       setErrorMessage("");
                    }} 
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Lupa Password?
                  </button>
                </div>
              </div>
            )}

            {loginMode === 'admin' && isResettingPassword && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Password Baru</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        document.getElementById('login-btn')?.click();
                      }
                    }}
                    className="w-full border border-neutral-300 rounded-lg pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Masukkan password baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                    title={showNewPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <button 
                    onClick={() => {
                       setIsResettingPassword(false);
                       setErrorMessage("");
                       setNewPassword("");
                    }} 
                    className="text-xs text-neutral-500 hover:text-neutral-700 font-medium"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
            
            <button
              id="login-btn"
              onClick={() => {
                setErrorMessage("");
                const name = loginName.trim();

                if (loginMode === 'admin' && isResettingPassword) {
                  if (name.toLowerCase() !== 'admin') {
                    setErrorMessage("Username harus admin untuk mereset password");
                    return;
                  }
                  if (!newPassword.trim()) {
                    setErrorMessage("Password baru tidak boleh kosong");
                    return;
                  }
                  setAdminPassword(newPassword);
                  setIsResettingPassword(false);
                  setNewPassword("");
                  setErrorMessage("Password berhasil diubah. Silahkan login.");
                  return;
                }
                
                if (loginMode === 'admin') {
                  if (name.toLowerCase() === 'admin' && loginPassword === adminPassword) {
                    setCurrentUser({ role: 'admin', name: 'Admin' });
                  } else {
                    setErrorMessage("Username atau password admin salah");
                  }
                  return;
                }
                
                // member mode
                if (!name) {
                  setErrorMessage("Nama tidak boleh kosong");
                  return;
                }
                
                const isMember = members.some(m => m.name.toLowerCase() === name.toLowerCase());
                if (isMember) {
                   setCurrentUser({ role: 'member', name: name });
                } else {
                   setErrorMessage("Nama tidak terdaftar sebagai peserta");
                }
              }}
              className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {isResettingPassword ? "Simpan Password Baru" : "Masuk"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-md py-3 px-4 md:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Dices className="w-6 h-6" />
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={tempArisanName} 
                onChange={(e) => setTempArisanName(e.target.value)}
                className="text-neutral-900 px-2 py-1 rounded text-sm focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setArisanName(tempArisanName || 'Arisan Online');
                    setIsEditingName(false);
                  } else if (e.key === 'Escape') {
                    setIsEditingName(false);
                  }
                }}
              />
              <button 
                onClick={() => {
                  setArisanName(tempArisanName || 'Arisan Online');
                  setIsEditingName(false);
                }}
                className="p-1 hover:bg-indigo-500 rounded"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h1 className="text-xl font-bold tracking-tight">{arisanName}</h1>
              {isAdmin && (
                <button 
                  onClick={() => {
                    setTempArisanName(arisanName);
                    setIsEditingName(true);
                  }}
                  className="p-1.5 bg-indigo-500/30 hover:bg-indigo-500 rounded transition-all ml-1"
                  title="Edit Nama Arisan"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="flex items-center gap-2 bg-indigo-700/50 px-3 py-1.5 rounded-lg border border-indigo-500/30 flex-1 md:flex-none justify-center">
             <Wallet className="w-4 h-4 text-indigo-200" />
             <div className="flex flex-col">
               <span className="text-[9px] text-indigo-200 font-medium uppercase tracking-wider leading-none">Total Saldo Kas</span>
               <span className="font-bold text-sm whitespace-nowrap leading-tight">{formatRupiah(totalSaldo)}</span>
             </div>
           </div>
           {isAdmin && (
             <button 
               onClick={resetPemenangMenu}
               className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 transition-colors px-2.5 py-1.5 rounded-md text-xs font-medium flex-shrink-0"
             >
               <RotateCcw className="w-3.5 h-3.5" />
               <span className="hidden sm:inline">Reset Ronde</span>
             </button>
           )}
           <button 
             onClick={() => setCurrentUser(null)}
             className="flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-800 transition-colors px-2.5 py-1.5 rounded-md text-xs font-medium flex-shrink-0"
           >
             <LogOut className="w-3.5 h-3.5" />
             <span className="hidden sm:inline">Logout</span>
           </button>
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
                {isAdmin ? (
                  <input
                    type="number"
                    value={iuranAmount}
                    onChange={(e) => setIuranAmount(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-24 border border-neutral-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    step="10000"
                    min="0"
                  />
                ) : (
                  <span className="font-mono font-bold text-sm">{formatRupiah(Number(iuranAmount))}</span>
                )}
              </div>

              {isAdmin && (
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
                        initial={{ opacity: 0, height: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, height: 'auto', scale: 1 }} 
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        className="bg-red-50 text-red-600 text-xs flex items-center gap-2 p-2.5 rounded-lg border border-red-100 shadow-sm"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p>{errorMessage}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              )}

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
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMemberCard(member);
                              }}
                              className="p-1 text-neutral-400 hover:text-indigo-500 transition-colors"
                              title="Kartu Anggota"
                            >
                              <IdCard className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <button 
                                onClick={() => removeMember(member.id)}
                                className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                                aria-label="Hapus peserta"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {isAdmin && (
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
                        )}

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
              {members.length > 0 && isAdmin && (
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
            
            {isAdmin ? (
              <div className="flex flex-col gap-4">
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
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Periode Arisan</label>
                    <div className="w-full border border-neutral-300 rounded-lg px-3 py-2 bg-neutral-50 text-neutral-600 text-sm">
                      {arisanInterval === 1 ? "1 Hari" :
                       arisanInterval === 7 ? "1 Minggu" :
                       arisanInterval === 14 ? "2 Minggu" :
                       arisanInterval === 30 ? "1 Bulan" :
                       arisanInterval === 90 ? "3 Bulan" :
                       arisanInterval === 180 ? "6 Bulan" :
                       arisanInterval === 365 ? "1 Tahun" : `${arisanInterval} Hari`}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Jadwal</label>
                    <div className="w-full bg-neutral-50 text-neutral-600 border border-neutral-200 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 h-10">
                      <Clock className="w-4 h-4" />
                      {nextDrawDate ? "Terjadwal" : "Belum Terjadwal"}
                    </div>
                  </div>
                </div>
              </div>
            )}

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

             {isAdmin && (
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
             )}
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
      
      {/* Chat Floating Button */}
      {currentUser && (
        <>
          <button
            onClick={() => setIsChatOpen(true)}
            className={`fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-40 ${isChatOpen ? 'hidden' : 'flex'}`}
          >
            <MessageCircle className="w-6 h-6" />
          </button>

          {/* Chat Window */}
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-neutral-200 z-50 overflow-hidden flex flex-col"
                style={{ height: '500px', maxHeight: '80vh' }}
              >
                {/* Chat Header */}
                <div className="bg-indigo-600 text-white p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    <h3 className="font-semibold">Chat Grup</h3>
                  </div>
                  <button onClick={() => setIsChatOpen(false)} className="text-indigo-200 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 p-4 overflow-y-auto bg-neutral-50 flex flex-col gap-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-neutral-400 text-sm py-10 flex flex-col items-center gap-2">
                      <MessageCircle className="w-10 h-10 opacity-20" />
                      <p>Kirim pesan untuk memulai obrolan atau unggah bukti transfer.</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.senderName === (currentUser?.name || (isAdmin ? 'Admin' : 'Sistem'));
                      return (
                        <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                          <span className={`text-[10px] text-neutral-500 mb-1 ${isMe ? 'mr-1' : 'ml-1'}`}>{msg.senderName}</span>
                          <div className={`px-3 py-2 rounded-2xl ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-sm'}`}>
                            {msg.imageUrl ? (
                              <img src={msg.imageUrl} alt="Uploaded attachment" className="rounded-lg max-w-full h-auto mb-1 max-h-40 object-cover" />
                            ) : null}
                            {msg.audioUrl ? (
                              <audio controls src={msg.audioUrl} className={`w-48 h-8 rounded-lg ${isMe ? 'opacity-90' : ''}`} />
                            ) : null}
                            {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                            <div className={`mt-1 text-[9px] ${isMe ? 'text-indigo-200' : 'text-neutral-400'} text-right`}>
                              {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-3 bg-white border-t border-neutral-200">
                  <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <div className="flex-1 bg-neutral-100 rounded-2xl border border-neutral-200 px-3 py-2 flex items-center gap-2">
                      <textarea
                        value={newMessageText}
                        onChange={(e) => setNewMessageText(e.target.value)}
                        placeholder="Ketik pesan..."
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm resize-none max-h-24 min-h-[20px]"
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={chatFileInputRef} 
                        className="hidden" 
                        onChange={handleImageUpload}
                      />
                      <button 
                        type="button" 
                        onClick={() => chatFileInputRef.current?.click()}
                        className="text-neutral-400 hover:text-indigo-600 transition-colors p-1"
                        title="Upload Bukti"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <button 
                        type="button" 
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onMouseLeave={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        className={`${isRecording ? 'text-rose-500 animate-pulse' : 'text-neutral-400 hover:text-indigo-600'} transition-colors p-1`}
                        title="Tahan untuk Bicara"
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                    </div>
                    <button 
                      type="submit" 
                      disabled={!newMessageText.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Member Card Modal */}
      <AnimatePresence>
        {selectedMemberCard && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedMemberCard(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Card Container */}
              <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-6 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-black/10 rounded-full blur-xl"></div>
                
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="w-full flex justify-between items-center mb-2 border-b border-white/20 pb-4">
                    <div className="flex items-center gap-2">
                       <Dices className="w-5 h-5 text-indigo-200" />
                       <span className="font-bold text-sm tracking-wider uppercase">{arisanName}</span>
                    </div>
                    <div className="bg-white/20 px-2 py-1 rounded text-[10px] font-mono tracking-widest font-semibold backdrop-blur-sm">
                      MEMBER
                    </div>
                  </div>

                  <div className="w-24 h-24 rounded-full bg-white text-indigo-600 flex items-center justify-center text-4xl font-bold shadow-inner border-4 border-white/30 backdrop-blur-md">
                    {selectedMemberCard.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="text-center mt-2 w-full">
                    <h3 className="text-2xl font-bold tracking-tight mb-1">{selectedMemberCard.name}</h3>
                    <p className="text-indigo-100 text-sm flex items-center justify-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Bergabung: {new Date(selectedMemberCard.joinDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="w-full mt-4 bg-black/20 rounded-xl p-4 backdrop-blur-md border border-white/10">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-indigo-200 uppercase tracking-widest">ID Anggota</span>
                      <span className="font-mono">{selectedMemberCard.id.split('-')[0].toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-2">
                      <span className="text-indigo-200 uppercase tracking-widest">Status</span>
                      <span className="font-semibold flex items-center gap-1">
                        {selectedMemberCard.hasWon ? (
                           <><span className="w-2 h-2 rounded-full bg-amber-400"></span> Pemenang</>
                        ) : (
                           <><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Aktif</>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Close Button placed below or inside, let's put it floating */}
              <button 
                onClick={() => setSelectedMemberCard(null)}
                className="absolute top-3 right-3 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
