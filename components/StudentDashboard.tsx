
import React, { useState } from 'react';
import { Student, AppState, Site, Account } from '../types';
import { Globe, LogOut, Key, Copy, Check, ExternalLink, User, ShieldCheck, ShieldOff, AlertCircle } from 'lucide-react';
import { Modal } from './Modal';
import { SupabaseService } from '../utils/supabase';

interface StudentDashboardProps {
  student: Student;
  data: AppState;
  onLogout: () => void;
  onUpdateStudent: (updatedStudent: Student) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ student, data, onLogout, onUpdateStudent }) => {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isChangingCode, setIsChangingCode] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copyStatus, setCopyStatus] = useState<{[key: string]: boolean}>({});

  const UNIFIED_ERROR = "이 코드는 이미 사용 중이거나 중복되어 사용할 수 없습니다.";

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopyStatus(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const handleChangeCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    const codeToTry = newCode.trim().toUpperCase();
    if (!codeToTry) return;

    setIsProcessing(true);
    setError(null);

    // 전역 중복 확인
    const check = await SupabaseService.isEntranceCodeInUse(codeToTry, student.id);
    if (check.inUse) {
      setError(UNIFIED_ERROR);
      setIsProcessing(false);
      return;
    }

    onUpdateStudent({ ...student, entranceCode: codeToTry });
    setIsChangingCode(false);
    setNewCode('');
    setError(null);
    setIsProcessing(false);
    alert("입장 코드가 성공적으로 변경되었습니다.");
  };

  const studentAccounts = data.accounts.filter(a => a.studentId === student.id);
  const studentSites = data.sites.filter(site => studentAccounts.some(acc => acc.siteId === site.id));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-100">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">{student.name} 학생용</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 bg-blue-600 rounded-3xl p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between">
          <div className="mb-4 sm:mb-0 text-center sm:text-left">
            <h2 className="text-3xl font-bold mb-2">안녕하세요, {student.name}님!</h2>
            <p className="opacity-90">선생님이 등록하신 사이트의 계정 정보를 확인하고 학습을 시작해보세요.</p>
          </div>
          
          <button
            onClick={() => {
              setIsChangingCode(true);
              setError(null);
            }}
            className="bg-white/20 hover:bg-white/30 p-4 rounded-2xl backdrop-blur-sm transition-all flex items-center space-x-3 border border-white/10 group shadow-inner"
          >
            <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
              <Key className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Security</p>
              <p className="font-bold">입장 코드 변경</p>
            </div>
          </button>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
          <Globe className="w-6 h-6 mr-2 text-blue-600" />
          등록된 학습 사이트
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {studentSites.map(site => (
            <div
              key={site.id}
              onClick={() => setSelectedSite(site)}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
            >
              <div className="bg-slate-50 group-hover:bg-blue-600 p-3 rounded-2xl w-12 h-12 flex items-center justify-center transition-colors mb-4">
                <Globe className="w-6 h-6 text-slate-500 group-hover:text-white" />
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-2">{site.name}</h4>
              <p className="text-slate-500 text-sm mb-6 line-clamp-2 min-h-[2.5rem]">{site.description || '학습 사이트로 이동하여 로그인하세요.'}</p>
              <div className="flex items-center text-blue-600 font-bold text-sm">
                <span>계정 확인하기</span>
                <ExternalLink className="w-4 h-4 ml-1.5" />
              </div>
            </div>
          ))}

          {studentSites.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
              <ShieldOff className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">아직 선생님이 등록하신 계정이 없습니다.</p>
            </div>
          )}
        </div>
      </main>

      {/* Account Info Modal */}
      {selectedSite && (
        <Modal
          isOpen={!!selectedSite}
          onClose={() => setSelectedSite(null)}
          title={`${selectedSite.name} - 내 계정 정보`}
        >
          {(() => {
            const acc = studentAccounts.find(a => a.siteId === selectedSite.id);
            return (
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">사용자 아이디</label>
                    <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                      <span className="font-mono text-lg font-semibold text-slate-800">{acc?.username || '(없음)'}</span>
                      <button
                        onClick={() => handleCopy(acc?.username || '', 'user')}
                        className={`p-2 rounded-lg transition-all ${copyStatus['user'] ? 'bg-green-100 text-green-600' : 'hover:bg-slate-100 text-slate-400'}`}
                      >
                        {copyStatus['user'] ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">비밀번호</label>
                    <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                      <span className="font-mono text-lg font-semibold text-slate-800">{acc?.password || '(없음)'}</span>
                      <button
                        onClick={() => handleCopy(acc?.password || '', 'pass')}
                        className={`p-2 rounded-lg transition-all ${copyStatus['pass'] ? 'bg-green-100 text-green-600' : 'hover:bg-slate-100 text-slate-400'}`}
                      >
                        {copyStatus['pass'] ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <a
                  href={selectedSite.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all transform active:scale-95"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>사이트로 바로 이동하기</span>
                </a>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Change Code Modal */}
      <Modal isOpen={isChangingCode} onClose={() => setIsChangingCode(false)} title="입장 코드 변경">
        <form onSubmit={handleChangeCode} className="space-y-4">
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start space-x-3 mb-4">
            <Key className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 leading-relaxed">
              입장 코드를 변경하면 다음 로그인부터는 <span className="font-bold">새로운 코드</span>를 입력해야 합니다.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">새로운 입장 코드</label>
            <input
              required
              type="text"
              value={newCode}
              onChange={(e) => {
                setNewCode(e.target.value.toUpperCase());
                setError(null);
              }}
              className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 font-mono text-center text-xl tracking-widest font-bold ${error ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:ring-blue-100'}`}
              placeholder="예: LION77"
            />
            {error && (
              <div className="mt-3 flex items-start space-x-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-xs font-bold leading-tight">{error}</span>
              </div>
            )}
          </div>

          <div className="pt-4 flex space-x-3">
            <button
              type="button"
              onClick={() => setIsChangingCode(false)}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!!error || !newCode.trim() || isProcessing}
            >
              {isProcessing ? '확인 중...' : '코드 변경하기'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
