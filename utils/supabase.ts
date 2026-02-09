
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig, AppState, Student, Site, Account } from '../types';

let supabase: SupabaseClient | null = null;

export const SupabaseService = {
  init(config: SupabaseConfig) {
    if (!config.url || !config.anonKey) return null;
    supabase = createClient(config.url, config.anonKey);
    return supabase;
  },

  getClient() {
    return supabase;
  },

  /**
   * 교사 등록 (전역 유일성 보장)
   */
  async registerTeacher(code: string): Promise<{ success: boolean; message?: string }> {
    if (!supabase) return { success: false, message: "DB 연결이 없습니다." };
    
    const upperCode = code.toUpperCase();
    const UNIFIED_ERROR = "이 코드는 이미 사용 중이거나 중복되어 사용할 수 없습니다.";

    // 1. 교사 테이블 중복 확인
    const { data: existingTeacher } = await supabase.from('teachers').select('id').eq('id', code).maybeSingle();
    if (existingTeacher) return { success: false, message: UNIFIED_ERROR };

    // 2. 학생 테이블 중복 확인
    const { data: existingStudent } = await supabase.from('students').select('id').eq('entranceCode', upperCode).maybeSingle();
    if (existingStudent) return { success: false, message: UNIFIED_ERROR };

    // 3. 등록
    const { error } = await supabase.from('teachers').insert([{ id: code }]);
    if (error) return { success: false, message: "교사 등록 중 오류가 발생했습니다." };

    return { success: true };
  },

  /**
   * 교사 존재 여부 확인
   */
  async checkTeacherExists(code: string): Promise<boolean> {
    if (!supabase) return false;
    const { data } = await supabase.from('teachers').select('id').eq('id', code).maybeSingle();
    return !!data;
  },

  async fetchAllData(teacherCode: string): Promise<Partial<AppState> | null> {
    if (!supabase) return null;

    const [students, sites, accounts] = await Promise.all([
      supabase.from('students').select('*').eq('teacher_id', teacherCode),
      supabase.from('sites').select('*').eq('teacher_id', teacherCode),
      supabase.from('accounts').select('*').eq('teacher_id', teacherCode)
    ]);

    return {
      students: students.data || [],
      sites: sites.data || [],
      accounts: accounts.data || []
    };
  },

  async upsertStudent(student: Student, teacherCode: string) {
    if (!supabase) return;
    return await supabase.from('students').upsert({
      ...student,
      teacher_id: teacherCode
    });
  },

  /**
   * 학생 입장 코드 중복 체크 (교사와 학생 모두 확인)
   */
  async isEntranceCodeInUse(code: string, currentStudentId?: string): Promise<{ inUse: boolean }> {
    if (!supabase) return { inUse: false };
    const upperCode = code.toUpperCase();

    // 1. 교사 코드와 겹치는지 확인
    const { data: teacher } = await supabase.from('teachers').select('id').eq('id', code).maybeSingle();
    if (teacher) return { inUse: true };

    // 2. 다른 학생과 겹치는지 확인
    const { data: students } = await supabase.from('students').select('id').eq('entranceCode', upperCode);
    if (students && students.length > 0) {
      if (currentStudentId && students.length === 1 && students[0].id === currentStudentId) {
        return { inUse: false };
      }
      return { inUse: true };
    }

    return { inUse: false };
  },

  /**
   * 교사 인증코드가 사용 중인지 확인 (교사와 학생 모두 확인)
   */
  async isTeacherIdInUse(code: string): Promise<{ inUse: boolean }> {
    if (!supabase) return { inUse: false };

    // 1. 교사 테이블 확인
    const { data: teacher } = await supabase.from('teachers').select('id').eq('id', code).maybeSingle();
    if (teacher) return { inUse: true };

    // 2. 학생 입장코드 확인
    const { data: student } = await supabase.from('students').select('id').eq('entranceCode', code.toUpperCase()).maybeSingle();
    if (student) return { inUse: true };

    return { inUse: false };
  },

  async deleteStudent(id: string) {
    if (!supabase) return;
    return await supabase.from('students').delete().eq('id', id);
  },

  async deleteAllStudents(teacherCode: string) {
    if (!supabase) return;
    return await supabase.from('students').delete().eq('teacher_id', teacherCode);
  },

  async upsertSite(site: Site, teacherCode: string) {
    if (!supabase) return;
    return await supabase.from('sites').upsert({
      ...site,
      teacher_id: teacherCode
    });
  },

  async deleteSite(id: string) {
    if (!supabase) return;
    return await supabase.from('sites').delete().eq('id', id);
  },

  async deleteAllSites(teacherCode: string) {
    if (!supabase) return;
    return await supabase.from('sites').delete().eq('teacher_id', teacherCode);
  },

  async upsertAccount(account: Account, teacherCode: string) {
    if (!supabase) return;
    return await supabase.from('accounts').upsert({
      ...account,
      teacher_id: teacherCode
    });
  },

  async deleteAccount(id: string) {
    if (!supabase) return;
    return await supabase.from('accounts').delete().eq('id', id);
  },

  async deleteAccountsByStudent(studentId: string) {
    if (!supabase) return;
    return await supabase.from('accounts').delete().eq('studentId', studentId);
  },

  async deleteAccountsBySite(siteId: string) {
    if (!supabase) return;
    return await supabase.from('accounts').delete().eq('siteId', siteId);
  },

  async deleteAllAccounts(teacherCode: string) {
    if (!supabase) return;
    return await supabase.from('accounts').delete().eq('teacher_id', teacherCode);
  }
};
