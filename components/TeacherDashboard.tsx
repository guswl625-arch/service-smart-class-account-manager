
import React, { useState } from 'react';
import { AppState, Site, Student, Account, SupabaseConfig } from '../types';
import { SiteManagement } from './SiteManagement';
import { StudentManagement } from './StudentManagement';
import { Settings as SettingsIcon, LogOut, Globe, Users, ShieldAlert, Key, RefreshCcw, CheckCircle2, AlertCircle, ShieldCheck, Database, Link2, ExternalLink, Terminal, Download, Share2, Info, Copy, Check, FileSpreadsheet, Settings2, Sparkles, UserCheck } from 'lucide-react';
import { Modal } from './Modal';
import { EncryptionService } from '../utils/crypto';
import { SupabaseService } from '../utils/supabase';

interface TeacherDashboardProps {
  data: AppState;
  onUpdate: (updater: (prev: AppState) => AppState) => void;
  onLogout: () => void;
  isSupabaseConnected: boolean;
  onSupabaseConfig: (config: SupabaseConfig) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ 
  data, onUpdate, onLogout, isSupabaseConnected, onSupabaseConfig 
}) => {
  const [activeTab, setActiveTab] = useState<'sites' | 'students' | 'settings'>('sites');
  const [newTeacherCode, setNewTeacherCode] = useState('');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [showSaveFeedback, setShowSaveFeedback] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [showSupabaseSettings, setShowSupabaseSettings] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isUpdatingCode, setIsUpdatingCode] = useState(false);

  const [sbUrl, setSbUrl] = useState(data.supabaseConfig?.url || '');
  const [sbKey, setSbKey] = useState(data.supabaseConfig?.anonKey || '');

  const UNIFIED_ERROR = "이 코드는 이미 사용 중이거나 중복되어 사용할 수 없습니다.";

  const handleUpdateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeToTry = newTeacherCode.trim();
    if (!codeToTry || isUpdatingCode) return;
    
    setErrorCode(null);
    setIsUpdatingCode(true);

    // 1. 전역 중복 확인
    const check = await SupabaseService.isTeacherIdInUse(codeToTry);
    if (check.inUse) {
      setErrorCode(UNIFIED_ERROR);
      setIsUpdatingCode(false);
      return;
    }

    onUpdate(prev => ({ ...prev, teacherCode: codeToTry }));
    setNewTeacherCode('');
    setShowSaveFeedback(true);
    setIsUpdatingCode(false);
    setTimeout(() => setShowSaveFeedback(false), 2000);
  };

  const handleFullReset = async () => {
    setIsResetting(true);
    try {
      if (isSupabaseConnected && SupabaseService.getClient()) {
        await Promise.all([
          SupabaseService.deleteAllAccounts(data.teacherCode),
          SupabaseService.deleteAllStudents(data.teacherCode),
          SupabaseService.deleteAllSites(data.teacherCode)
        ]);
      }
      EncryptionService.clear();
      onUpdate(() => ({
        students: [],
        sites: [],
        accounts: [],
        teacherCode: "1234"
      }));
      setIsResetConfirmOpen(false);
      onLogout();
    } catch (err) {
      console.error(err);
      alert("초기화 중 오류가 발생했습니다.");
    } finally {
      setIsResetting(false);
    }
  };

  const saveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onSupabaseConfig({ url: sbUrl.trim(), anonKey: sbKey.trim() });
    alert("데이터베이스 설정이 저장되었습니다.");
  };

  const downloadCSVBackup = () => {
    const headers = ['학생 이름', '입장 코드', '학습 사이트', '아이디', '비밀번호', '사이트 URL'];
    let csvRows = [headers.join(',')];
    data.accounts.forEach(acc => {
      const student = data.students.find(s => s.id === acc.studentId);
      const site = data.sites.find(s => s.id === acc.siteId);
      const row = [student?.name || '', student?.entranceCode || '', site?.name || '', acc.username || '', acc.password || '', site?.url || ''];
      csvRows.push(row.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','));
    });
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `백업_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleCopyInviteLink = () => {
    if (!data.supabaseConfig || !data.supabaseConfig.url || !data.supabaseConfig.anonKey) {
      alert("DB 연동 정보가 없습니다. 하단의 DB 시스템 설정에서 먼저 연동해 주세요.");
      return;
    }
    
    let baseUrl = window.location.href.split('?')[0];
    if (baseUrl.startsWith('blob:')) baseUrl = baseUrl.replace('blob:', '');
    
    const urlParam = encodeURIComponent(data.supabaseConfig.url.trim());
    const keyParam = encodeURIComponent(data.supabaseConfig.anonKey.trim());
    const fullLink = `${baseUrl}?surl=${urlParam}&skey=${keyParam}&mode=setup`;
    
    navigator.clipboard.writeText(fullLink).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 3000);
    }).catch(() => {
      window.prompt("초대 링크를 복사하세요:", fullLink);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg mr-3 shadow-lg shadow-blue-200">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">교사용 대시보드</h1>
                <div className="flex items-center space-x-2 text-[10px] font-bold">
                  <span className="text-green-600">ENCRYPTED</span>
                  <span className={isSupabaseConnected ? 'text-blue-600' : 'text-slate-400'}>
                    {isSupabaseConnected ? 'CLOUD SYNC' : 'LOCAL ONLY'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <nav className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setActiveTab('sites')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'sites' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>사이트</button>
                <button onClick={() => setActiveTab('students')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'students' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>학생</button>
                <button onClick={() => setActiveTab('settings')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>설정</button>
              </nav>
              <button onClick={onLogout} className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        {activeTab === 'sites' && <SiteManagement data={data} onUpdate={onUpdate} />}
        {activeTab === 'students' && <StudentManagement data={data} onUpdate={onUpdate} />}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto space-y-8">
            {/* 인증코드 관리 */}
            <div className="bg-white rounded-3xl shadow-md border-2 border-blue-100 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md"><Key className="w-6 h-6" /></div>
                <div>
                  <h2 className="text-xl font-bold">내 인증코드(방 번호) 관리</h2>
                  <p className="text-xs text-slate-400 font-medium">현재: <span className="text-blue-600 font-bold">{data.teacherCode}</span></p>
                </div>
              </div>
              <form onSubmit={handleUpdateCode} className="space-y-4">
                <div className="flex space-x-2">
                  <input type="text" value={newTeacherCode} onChange={(e) => setNewTeacherCode(e.target.value)} placeholder="새 인증코드 입력" className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all" />
                  <button type="submit" disabled={isUpdatingCode} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
                    {isUpdatingCode ? '확인 중...' : '변경'}
                  </button>
                </div>
                {showSaveFeedback && <p className="text-green-600 text-xs font-bold flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> 성공적으로 변경되었습니다.</p>}
                {errorCode && <p className="text-red-500 text-xs font-bold flex items-center bg-red-50 p-2 rounded-lg"><AlertCircle className="w-3 h-3 mr-1 shrink-0" /> {errorCode}</p>}
              </form>
            </div>

            {/* 초대 및 배포 */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <Share2 className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold">시스템 공유 및 초대</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="p-6 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-100">
                  <h3 className="text-sm font-bold mb-3 flex items-center"><Link2 className="w-4 h-4 mr-1.5" /> 동료 교사 초대</h3>
                  <p className="text-xs opacity-90 mb-5 leading-relaxed">
                    시스템 연동 정보가 포함된 초대장입니다. 받는 선생님은 기본 주소에서 바로 본인만의 교실을 만들 수 있습니다.<br/>
                    <b>학생들은 별도 링크 없이 기본 주소에서 입장 코드만으로 접속 가능합니다.</b>
                  </p>
                  <button onClick={handleCopyInviteLink} disabled={!isSupabaseConnected} className="w-full py-4 bg-white text-blue-600 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 shadow-lg hover:bg-blue-50 transition-all active:scale-95">
                    {copyFeedback ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    <span>{copyFeedback ? '초대 링크 복사 완료!' : '동료 교사 초대 링크 복사'}</span>
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg"><FileSpreadsheet className="w-5 h-5 text-green-600" /></div>
                    <div>
                      <h4 className="text-sm font-bold">엑셀(CSV) 백업</h4>
                      <p className="text-[10px] text-slate-500 font-medium">데이터 유실 방지를 위해 주기적으로 백업하세요.</p>
                    </div>
                  </div>
                  <button onClick={downloadCSVBackup} className="bg-white border-2 border-slate-100 p-2.5 rounded-xl shadow-sm hover:bg-slate-50 transition-all"><Download className="w-5 h-5 text-slate-600" /></button>
                </div>
              </div>
            </div>

            {/* DB 설정 */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <Database className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold">데이터베이스 시스템</h2>
              </div>
              <button onClick={() => setShowSupabaseSettings(!showSupabaseSettings)} className={`w-full py-4 rounded-xl font-bold border-2 transition-all shadow-md ${showSupabaseSettings ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-50'}`}>
                {showSupabaseSettings ? '연동 설정 닫기' : 'Supabase 클라우드 연동 수동 설정'}
              </button>
              {showSupabaseSettings && (
                <div className="mt-4 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                  <form onSubmit={saveSupabaseConfig} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <input type="text" value={sbUrl} onChange={(e) => setSbUrl(e.target.value)} placeholder="Supabase Project URL" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-blue-100" />
                    <input type="password" value={sbKey} onChange={(e) => setSbKey(e.target.value)} placeholder="Supabase Anon Key" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-blue-100" />
                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all">설정 정보 저장</button>
                  </form>
                </div>
              )}
            </div>

            {/* 초기화 */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center space-x-3 mb-6 text-red-600"><RefreshCcw className="w-6 h-6" /><h2 className="text-xl font-bold">시스템 초기화</h2></div>
              <button onClick={() => setIsResetConfirmOpen(true)} className="w-full bg-red-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-red-700 transition-all active:scale-95">모든 데이터 삭제 및 로그아웃</button>
            </div>
          </div>
        )}
      </main>

      <Modal isOpen={isResetConfirmOpen} onClose={() => setIsResetConfirmOpen(false)} title="초기화 확인">
        <div className="text-center">
          <div className="bg-red-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4"><ShieldAlert className="w-8 h-8 text-red-600" /></div>
          <h3 className="text-lg font-bold">정말로 초기화하시겠습니까?</h3>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">내 인증 코드로 저장된 모든 데이터가 삭제됩니다.</p>
          <div className="mt-8 flex space-x-3">
            <button onClick={() => setIsResetConfirmOpen(false)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold">취소</button>
            <button onClick={handleFullReset} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold" disabled={isResetting}>
              {isResetting ? '처리 중...' : '초기화'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
