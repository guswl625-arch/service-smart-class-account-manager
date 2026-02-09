
import React, { useState } from 'react';
import { AppState, Student } from '../types';
import { UserPlus, FileText, Trash2, Search, User, AlertCircle, ShieldAlert } from 'lucide-react';
import { Modal } from './Modal';
import { CSVParser } from '../utils/csvParser';
import { SupabaseService } from '../utils/supabase';

interface StudentManagementProps {
  data: AppState;
  onUpdate: (updater: (prev: AppState) => AppState) => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ data, onUpdate }) => {
  const [isAddingSingle, setIsAddingSingle] = useState(false);
  const [isAddingCSV, setIsAddingCSV] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', entranceCode: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const UNIFIED_ERROR = "이 코드는 이미 사용 중이거나 중복되어 사용할 수 없습니다.";

  const filteredStudents = data.students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.entranceCode.includes(searchQuery)
  );

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    const codeToTry = newStudent.entranceCode.trim().toUpperCase() || Math.random().toString(36).substring(2, 8).toUpperCase();

    // 전역 중복 체크 (교사와 학생 모두)
    const check = await SupabaseService.isEntranceCodeInUse(codeToTry);
    if (check.inUse) {
      setError(UNIFIED_ERROR);
      setIsProcessing(false);
      return;
    }

    const student: Student = { id: crypto.randomUUID(), name: newStudent.name, entranceCode: codeToTry };
    if (SupabaseService.getClient()) {
      await SupabaseService.upsertStudent(student, data.teacherCode);
    }
    
    onUpdate(prev => ({ ...prev, students: [...prev.students, student] }));
    setIsAddingSingle(false);
    setNewStudent({ name: '', entranceCode: '' });
    setIsProcessing(false);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);

    try {
      const results = await CSVParser.parse(file);
      const newStudents: Student[] = [];
      for (const row of results) {
        const name = row['이름'] || row['name'] || row['col0'] || '이름없음';
        let code = (row['입장코드'] || row['code'] || row['col1'] || Math.random().toString(36).substring(2, 8)).toString().toUpperCase();

        const check = await SupabaseService.isEntranceCodeInUse(code);
        if (!check.inUse) {
          const student: Student = { id: crypto.randomUUID(), name, entranceCode: code };
          if (SupabaseService.getClient()) {
            await SupabaseService.upsertStudent(student, data.teacherCode);
          }
          newStudents.push(student);
        }
      }

      if (newStudents.length > 0) {
        onUpdate(prev => ({ ...prev, students: [...prev.students, ...newStudents] }));
        alert(`${newStudents.length}명 등록 완료 (중복된 코드는 제외됨)`);
      } else {
        alert("등록할 수 있는 학생 정보가 없거나 코드가 모두 중복되었습니다.");
      }
    } finally {
      setIsAddingCSV(false);
      setIsProcessing(false);
    }
  };

  const deleteStudent = async (id: string) => {
    if (SupabaseService.getClient()) {
      await SupabaseService.deleteAccountsByStudent(id);
      await SupabaseService.deleteStudent(id);
    }
    onUpdate(prev => ({ 
      ...prev, 
      students: prev.students.filter(s => s.id !== id),
      accounts: prev.accounts.filter(a => a.id !== id)
    }));
  };

  const handleDeleteAll = async () => {
    setIsProcessing(true);
    try {
      if (SupabaseService.getClient()) {
        await SupabaseService.deleteAllAccounts(data.teacherCode);
        await SupabaseService.deleteAllStudents(data.teacherCode);
      }
      onUpdate(prev => ({ ...prev, students: [], accounts: [] }));
      setIsDeletingAll(false);
    } catch (error) {
      console.error("Failed to delete all students:", error);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-2xl font-bold text-slate-800">학생 관리</h2></div>
        <div className="flex gap-2">
          <button onClick={() => { setError(null); setIsAddingSingle(true); }} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all hover:bg-blue-700 active:scale-95 shadow-sm"><UserPlus className="w-5 h-5" /><span>개별 등록</span></button>
          <button onClick={() => setIsAddingCSV(true)} className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all hover:bg-slate-50 active:scale-95 shadow-sm"><FileText className="w-5 h-5" /><span>일괄 등록</span></button>
          <button onClick={() => setIsDeletingAll(true)} className="bg-red-50 border border-red-100 text-red-600 p-2.5 rounded-xl font-bold transition-all hover:bg-red-600 hover:text-white active:scale-95 shadow-sm tooltip" title="전체 학생 삭제"><Trash2 className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 flex items-center border-b border-slate-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="이름 또는 입장 코드로 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">이름</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">입장 코드</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider text-right">삭제</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700">{student.name}</td>
                  <td className="px-6 py-4"><code className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-mono font-bold text-sm">{student.entranceCode}</code></td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => deleteStudent(student.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center">
                    <User className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">등록된 학생이 없습니다.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isAddingSingle} onClose={() => setIsAddingSingle(false)} title="학생 등록">
        <form onSubmit={handleAddSingle} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">학생 이름</label>
            <input required type="text" placeholder="이름 입력" value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">입장 코드 (선택)</label>
            <input type="text" placeholder="미입력 시 자동 생성" value={newStudent.entranceCode} onChange={(e) => { setNewStudent({ ...newStudent, entranceCode: e.target.value.toUpperCase() }); setError(null); }} className="w-full p-3 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-100" />
            {error && <p className="text-red-500 text-xs font-bold mt-2 flex items-center bg-red-50 p-2 rounded-lg"><AlertCircle className="w-3 h-3 mr-1 shrink-0" /> {error}</p>}
          </div>
          <button type="submit" disabled={isProcessing} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50">{isProcessing ? '처리 중...' : '등록 완료'}</button>
        </form>
      </Modal>

      <Modal isOpen={isAddingCSV} onClose={() => setIsAddingCSV(false)} title="일괄 등록">
        <div className="space-y-4">
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
            <label className="cursor-pointer group">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3 group-hover:text-blue-500 transition-colors" />
              <p className="text-sm text-slate-500 mb-4 font-medium">CSV 파일을 드래그하거나 클릭하여 업로드</p>
              <span className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold inline-block hover:bg-blue-700 transition-all shadow-md">
                {isProcessing ? '처리 중...' : '파일 선택'}
              </span>
              <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} disabled={isProcessing} />
            </label>
          </div>
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            * 첫 번째 열에 이름, 두 번째 열에 입장 코드가 있는 CSV 파일을 사용하세요.<br/>
            (이미 사용 중이거나 중복된 코드는 자동으로 제외됩니다.)
          </p>
        </div>
      </Modal>

      <Modal isOpen={isDeletingAll} onClose={() => setIsDeletingAll(false)} title="학생 전체 삭제 확인">
        <div className="text-center space-y-4">
          <div className="bg-red-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">정말로 모든 학생을 삭제하시겠습니까?</h3>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              등록된 모든 학생 정보와 해당 학생들의<br/>
              <span className="text-red-600 font-bold">계정 정보(ID/PW)가 영구적으로 삭제</span>됩니다.
            </p>
          </div>
          <div className="flex space-x-3 pt-4">
            <button onClick={() => setIsDeletingAll(false)} className="flex-1 px-4 py-3.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all">취소</button>
            <button onClick={handleDeleteAll} disabled={isProcessing} className="flex-1 px-4 py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md active:scale-95 disabled:opacity-50">{isProcessing ? '삭제 중...' : '모두 삭제'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
