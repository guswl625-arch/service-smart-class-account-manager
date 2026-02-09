
import React, { useState } from 'react';
import { Key, ShieldCheck, Sparkles, ArrowRight, Info, ChevronLeft } from 'lucide-react';
import { SupabaseService } from '../utils/supabase';

interface TeacherRegistrationProps {
  onRegister: (code: string) => void;
  onCancel: () => void;
}

export const TeacherRegistration: React.FC<TeacherRegistrationProps> = ({ onRegister, onCancel }) => {
  const [code, setCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (cleanCode.length < 2) {
      alert("인증 코드는 최소 2자 이상이어야 합니다.");
      return;
    }

    setIsChecking(true);
    
    // 전역 중복 확인 및 교사 등록
    const result = await SupabaseService.registerTeacher(cleanCode);
    if (!result.success) {
      alert(result.message);
      setIsChecking(false);
      return;
    }

    onRegister(cleanCode);
    setIsChecking(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-blue-700 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-lg relative overflow-hidden">
        <button 
          onClick={onCancel}
          className="absolute top-8 left-8 text-slate-400 hover:text-indigo-600 transition-colors flex items-center space-x-1 font-bold text-sm z-20"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>뒤로가기</span>
        </button>

        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Sparkles className="w-32 h-32 text-indigo-600" />
        </div>

        <div className="relative z-10 pt-4">
          <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <ShieldCheck className="w-10 h-10 text-indigo-600" />
          </div>

          <h1 className="text-3xl font-black text-slate-800 mb-2 leading-tight">
            스마트 클래스에<br/>오신 것을 환영합니다!
          </h1>
          <p className="text-slate-500 font-medium mb-8">
            선생님만의 **고유 인증 코드(방 번호)**를 만들어 보세요.
          </p>

          <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl mb-8 flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800 leading-relaxed font-medium">
              <p className="font-bold mb-1">인증 코드란?</p>
              교실 데이터(학생 명단, 계정 등)를 구분하는 암호 키입니다. 
              앞으로 로그인할 때 이 코드를 사용하게 됩니다. (예: 2학년3반, 김선생님 등)
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                사용할 인증 코드 입력
              </label>
              <input
                required
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="예: 3학년1반"
                disabled={isChecking}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-xl"
              />
            </div>

            <button
              type="submit"
              disabled={isChecking}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center space-x-2 group transition-all transform active:scale-95 disabled:opacity-50"
            >
              <span className="text-lg">{isChecking ? '중복 확인 중...' : '등록 완료하고 로그인하기'}</span>
              {!isChecking && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </div>
      </div>
      <p className="mt-8 text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">Secure Multi-Teacher System</p>
    </div>
  );
};
