
import React, { useState, useRef } from 'react';
import { AppState, Site, Account } from '../types';
import { Trash2, Plus, Globe, FileText, UserPlus, Info, X, CheckCircle2, Upload, Link2 } from 'lucide-react';
import { Modal } from './Modal';
import { CSVParser } from '../utils/csvParser';
import { SupabaseService } from '../utils/supabase';
import { EncryptionService } from '../utils/crypto';

interface SiteManagementProps {
  data: AppState;
  onUpdate: (updater: (prev: AppState) => AppState) => void;
}

export const SiteManagement: React.FC<SiteManagementProps> = ({ data, onUpdate }) => {
  const [isAddingSite, setIsAddingSite] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const [newSite, setNewSite] = useState({ name: '', url: '', description: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const siteId = crypto.randomUUID();
    const site: Site = { ...newSite, id: siteId };
    
    if (SupabaseService.getClient()) {
      await SupabaseService.upsertSite(site, data.teacherCode);
    }
    
    onUpdate(prev => ({ ...prev, sites: [...prev.sites, site] }));
    setIsAddingSite(false);
    setNewSite({ name: '', url: '', description: '' });
    setIsProcessing(false);
  };

  const confirmDelete = async () => {
    if (siteToDelete) {
      if (SupabaseService.getClient()) {
        await SupabaseService.deleteAccountsBySite(siteToDelete.id);
        await SupabaseService.deleteSite(siteToDelete.id);
      }
      onUpdate(prev => ({
        ...prev,
        sites: prev.sites.filter(s => s.id !== siteToDelete.id),
        accounts: prev.accounts.filter(a => a.siteId !== siteToDelete.id)
      }));
      setSiteToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">등록된 사이트</h2>
          <p className="text-slate-500 text-sm">학생들에게 제공할 서비스 목록을 관리하세요.</p>
        </div>
        <button
          onClick={() => setIsAddingSite(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>사이트 추가</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.sites.map(site => (
          <div
            key={site.id}
            className="group relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer overflow-hidden"
            onClick={() => setSelectedSite(site)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Globe className="w-6 h-6" />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSiteToDelete(site);
                }}
                className="text-slate-300 hover:text-red-500 p-2 transition-colors rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{site.name}</h3>
            <p className="text-slate-500 text-sm line-clamp-2 min-h-[2.5rem]">{site.description || '학생 계정을 관리하는 사이트입니다.'}</p>
            
            <div className="mt-6 flex items-center justify-between text-xs font-semibold text-slate-400">
              <span className="flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5" />
                <span>계정 {data.accounts.filter(a => a.siteId === site.id).length}건</span>
              </span>
              <div className="flex items-center space-x-1 text-blue-500">
                <span>관리하기</span>
                <Plus className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}

        {data.sites.length === 0 && (
          <div className="col-span-full py-20 bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">등록된 사이트가 없습니다. 새 사이트를 추가해 보세요.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isAddingSite} onClose={() => setIsAddingSite(false)} title="새 사이트 등록">
        <form onSubmit={handleAddSite} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">사이트 이름</label>
            <input required type="text" value={newSite.name} onChange={(e) => setNewSite({ ...newSite, name: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" placeholder="예: 리틀팍스" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">접속 URL</label>
            <input required type="url" value={newSite.url} onChange={(e) => setNewSite({ ...newSite, url: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" placeholder="https://example.com" />
          </div>
          <div className="pt-4 flex space-x-3">
            <button type="button" onClick={() => setIsAddingSite(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold">취소</button>
            <button type="submit" disabled={isProcessing} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50">{isProcessing ? '저장 중...' : '등록하기'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!siteToDelete} onClose={() => setSiteToDelete(null)} title="사이트 삭제 확인">
        <div className="text-center">
          <div className="bg-red-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4"><Trash2 className="w-8 h-8 text-red-500" /></div>
          <h3 className="text-lg font-bold text-slate-800">'{siteToDelete?.name}' 삭제?</h3>
          <p className="text-slate-500 mt-2 text-sm">연동된 계정 정보도 모두 삭제됩니다.</p>
          <div className="mt-8 flex space-x-3">
            <button onClick={() => setSiteToDelete(null)} className="flex-1 px-4 py-2.5 border border-slate-200 font-bold">취소</button>
            <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold">삭제</button>
          </div>
        </div>
      </Modal>

      {selectedSite && (
        <Modal isOpen={!!selectedSite} onClose={() => setSelectedSite(null)} title={`${selectedSite.name} 계정 관리`} maxWidth="max-w-4xl">
          <AccountManagement site={selectedSite} data={data} onUpdate={onUpdate} />
        </Modal>
      )}
    </div>
  );
};

const AccountManagement: React.FC<{ site: Site; data: AppState; onUpdate: (updater: (prev: AppState) => AppState) => void }> = ({ site, data, onUpdate }) => {
  const [view, setView] = useState<'list' | 'add_single' | 'add_csv'>('list');
  const [singleAccount, setSingleAccount] = useState({ studentId: '', username: '', password: '' });
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const accounts = data.accounts.filter(a => a.siteId === site.id);

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const newAccount: Account = {
      id: crypto.randomUUID(),
      siteId: site.id,
      studentId: singleAccount.studentId,
      username: singleAccount.username,
      password: singleAccount.password || ""
    };
    
    if (SupabaseService.getClient()) {
      const cloudAccount = {
        ...newAccount,
        password: EncryptionService.encryptString(newAccount.password, data.teacherCode)
      };
      await SupabaseService.upsertAccount(cloudAccount, data.teacherCode);
    }

    onUpdate(prev => ({ ...prev, accounts: [...prev.accounts, newAccount] }));
    setSingleAccount({ studentId: '', username: '', password: '' });
    setView('list');
    setIsProcessing(false);
  };

  const confirmCSVUpload = async () => {
    setIsProcessing(true);
    const newAccounts: Account[] = [];
    for (const row of csvPreview) {
      const nameVal = row['이름'] || row['name'] || row['col0'];
      const userVal = row['아이디'] || row['username'] || row['col1'];
      const passVal = row['비밀번호'] || row['password'] || row['col2'] || "";

      const student = data.students.find(s => s.name === nameVal);
      if (student) {
        const acc: Account = { id: crypto.randomUUID(), siteId: site.id, studentId: student.id, username: userVal || '', password: passVal };
        if (SupabaseService.getClient()) {
           const cloudAcc = { ...acc, password: EncryptionService.encryptString(acc.password, data.teacherCode) };
           await SupabaseService.upsertAccount(cloudAcc, data.teacherCode);
        }
        newAccounts.push(acc);
      }
    }

    if (newAccounts.length > 0) {
      onUpdate(prev => ({ ...prev, accounts: [...prev.accounts, ...newAccounts] }));
      alert(`${newAccounts.length}건 등록 완료`);
      setView('list');
    }
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      {view === 'list' && (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">등록된 계정: {accounts.length}건</span>
            <div className="flex space-x-4">
              <button onClick={() => setView('add_single')} className="text-blue-600 font-bold flex items-center space-x-1"><UserPlus className="w-4 h-4"/><span>개별 등록</span></button>
              <button onClick={() => setView('add_csv')} className="text-blue-600 font-bold flex items-center space-x-1"><FileText className="w-4 h-4"/><span>일괄 등록</span></button>
            </div>
          </div>
          <div className="border border-slate-200 rounded-2xl overflow-auto max-h-[400px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50"><tr><th className="px-6 py-4">이름</th><th className="px-6 py-4">ID</th><th className="px-6 py-4">PW</th><th className="px-6 py-4 w-16">삭제</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map(acc => (
                  <tr key={acc.id}>
                    <td className="px-6 py-4 font-bold">{data.students.find(s => s.id === acc.studentId)?.name}</td>
                    <td className="px-6 py-4 font-mono">{acc.username}</td>
                    <td className="px-6 py-4 font-mono">{acc.password}</td>
                    <td className="px-6 py-4">
                      <button onClick={async () => {
                        if (SupabaseService.getClient()) await SupabaseService.deleteAccount(acc.id);
                        onUpdate(prev => ({ ...prev, accounts: prev.accounts.filter(a => a.id !== acc.id) }));
                      }} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {view === 'add_single' && (
        <form onSubmit={handleSingleSubmit} className="space-y-4">
          <select required value={singleAccount.studentId} onChange={(e)=>setSingleAccount({...singleAccount, studentId: e.target.value})} className="w-full p-3 border rounded-xl">
            <option value="">학생 선택</option>
            {data.students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input required type="text" placeholder="아이디" value={singleAccount.username} onChange={(e)=>setSingleAccount({...singleAccount, username: e.target.value})} className="w-full p-3 border rounded-xl" />
          <input type="text" placeholder="비밀번호" value={singleAccount.password} onChange={(e)=>setSingleAccount({...singleAccount, password: e.target.value})} className="w-full p-3 border rounded-xl" />
          <button type="submit" disabled={isProcessing} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">{isProcessing ? '저장 중...' : '등록'}</button>
          <button type="button" onClick={()=>setView('list')} className="w-full text-slate-400">취소</button>
        </form>
      )}
      {view === 'add_csv' && (
        <div className="space-y-4">
          {csvPreview.length === 0 ? (
            <label className="block border-2 border-dashed p-10 text-center cursor-pointer rounded-3xl">
              CSV 파일 업로드 (이름, 아이디, 비밀번호)
              <input type="file" accept=".csv" className="hidden" onChange={async (e) => setCsvPreview(await CSVParser.parse(e.target.files![0]))} />
            </label>
          ) : (
            <>
              <p className="text-sm font-bold">{csvPreview.length}건 대기 중</p>
              <button onClick={confirmCSVUpload} disabled={isProcessing} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">{isProcessing ? '업로드 중...' : '확인 및 저장'}</button>
              <button onClick={()=>setCsvPreview([])} className="w-full text-slate-400">취소</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
