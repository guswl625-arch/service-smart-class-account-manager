
import React, { useState } from 'react';
import { LogIn, GraduationCap, School, AlertCircle, Info, UserPlus } from 'lucide-react';

interface LoginProps {
  onLogin: (code: string) => Promise<boolean>;
  configError: string | null;
  onGoToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, configError, onGoToRegister }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    const success = await onLogin(code);
    if (!success) {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
    setIsLoggingIn(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md transition-all duration-300">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-blue-100 p-4 rounded-full mb-4 shadow-inner">
            <School className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">스마트 클래스</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">인증코드를 입력하세요.</p>
        </div>

        {configError && (
          <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium leading-relaxed">{configError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">인증코드</label>
              <div className="group relative">
                <Info className="w-3.5 h-3.5 text-slate-300 cursor-help" />
                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none leading-tight shadow-xl z-50">
                  교사는 본인의 고유 코드를, 학생은 선생님이 알려준 입장 코드를 입력하세요.
                </div>
              </div>
            </div>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="••••••"
              disabled={isLoggingIn}
              className={`w-full px-4 py-4 rounded-2xl border ${error ? 'border-red-500 ring-4 ring-red-100' : 'border-slate-100 ring-4 ring-transparent'} focus:border-blue-500 focus:ring-blue-100 outline-none transition-all text-center tracking-[0.5em] text-xl font-black bg-slate-50`}
            />
            {error && !configError && (
              <p className="text-red-500 text-xs mt-3 text-center animate-bounce font-bold">인증코드가 올바르지 않습니다.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-2xl shadow-xl shadow-blue-200 transform hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            <span className="text-lg">{isLoggingIn ? '확인 중...' : '로그인'}</span>
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={onGoToRegister}
            className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center mx-auto space-x-1"
          >
            <UserPlus className="w-4 h-4" />
            <span>처음이신가요? 신규 교사 등록하기</span>
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mb-4">Safe & Encrypted System</p>
          <div className="flex justify-center space-x-8 text-slate-200">
            <div className="flex flex-col items-center group">
              <div className="p-2 rounded-xl group-hover:bg-slate-50 transition-colors">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-[9px] uppercase font-bold tracking-tighter mt-1">Teacher</span>
            </div>
            <div className="flex flex-col items-center group">
              <div className="p-2 rounded-xl group-hover:bg-slate-50 transition-colors">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-[9px] uppercase font-bold tracking-tighter mt-1">Student</span>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-8 text-white/50 text-[10px] font-medium">© 2026 Smart Class Account Manager by Hazel</p>
    </div>
  );
};
