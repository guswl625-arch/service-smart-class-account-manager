
import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherRegistration } from './components/TeacherRegistration';
import { AuthRole, Student, Site, Account, AppState, SupabaseConfig } from './types';
import { EncryptionService } from './utils/crypto';
import { SupabaseService } from './utils/supabase';

const DEFAULT_STATE: AppState = {
  students: [],
  sites: [],
  accounts: [],
  teacherCode: "1234"
};

const STUDENT_AUTO_LOGIN_KEY = 'smart_class_student_code';
const SUPABASE_PERSIST_KEY = 'smart_class_sb_config';

const App: React.FC = () => {
  const [role, setRole] = useState<AuthRole>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [appData, setAppData] = useState<AppState>(DEFAULT_STATE);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const processDbData = (dbData: Partial<AppState>, teacherCode: string): Partial<AppState> => {
    if (dbData.accounts) {
      dbData.accounts = dbData.accounts.map(acc => ({
        ...acc,
        password: EncryptionService.decryptString(acc.password, teacherCode)
      }));
    }
    return dbData;
  };

  useEffect(() => {
    const init = async () => {
      let activeConfig: SupabaseConfig | null = null;
      
      const params = new URLSearchParams(window.location.search);
      const urlSbUrl = params.get('surl');
      const urlSbKey = params.get('skey');
      const isSetupMode = params.get('mode') === 'setup';

      if (urlSbUrl && urlSbKey) {
        activeConfig = { 
          url: decodeURIComponent(urlSbUrl).trim(), 
          anonKey: decodeURIComponent(urlSbKey).trim() 
        };
        localStorage.setItem(SUPABASE_PERSIST_KEY, JSON.stringify(activeConfig));
        if (isSetupMode) setIsRegistering(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      } 
      else {
        const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
        const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
        if (envUrl && envKey) {
          activeConfig = { url: envUrl, anonKey: envKey };
        } else {
          const persisted = localStorage.getItem(SUPABASE_PERSIST_KEY);
          if (persisted) {
            try { activeConfig = JSON.parse(persisted); } catch(e) {}
          }
        }
      }

      if (activeConfig && activeConfig.url && activeConfig.anonKey) {
        const client = SupabaseService.init(activeConfig);
        if (client) {
          setIsSupabaseConnected(true);
          setAppData(prev => ({ ...prev, supabaseConfig: activeConfig! }));
        }
      }

      const savedStudentCode = localStorage.getItem(STUDENT_AUTO_LOGIN_KEY);
      if (savedStudentCode && !isRegistering) {
        setIsAutoLoggingIn(true);
        await handleLogin(savedStudentCode);
        setIsAutoLoggingIn(false);
      }
    };
    init();
  }, []);

  const handleLogin = async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return false;
    
    setConfigError(null);
    
    const teacherInDb = await SupabaseService.checkTeacherExists(cleanCode);
    const decryptedData = EncryptionService.decrypt(cleanCode);
    
    if (decryptedData !== null || teacherInDb) {
      const finalTeacherCode = cleanCode;
      let mergedData = decryptedData || { ...appData, teacherCode: finalTeacherCode };
      
      if (isSupabaseConnected) {
        const dbData = await SupabaseService.fetchAllData(finalTeacherCode);
        if (dbData) {
          const processed = processDbData(dbData, finalTeacherCode);
          mergedData = { ...mergedData, ...processed, teacherCode: finalTeacherCode };
        }
      }
      
      setAppData(mergedData);
      EncryptionService.encrypt(mergedData, finalTeacherCode);
      setRole('teacher');
      return true;
    }

    const client = SupabaseService.getClient();
    if (!client) {
      setConfigError("데이터베이스 설정이 필요합니다. 처음 이용하신다면 선생님이 배포한 초대 링크를 통해 한 번 접속해주세요.");
      return false;
    }

    try {
      const { data: studentData } = await client
        .from('students')
        .select('*')
        .eq('entranceCode', cleanCode.toUpperCase())
        .maybeSingle();
      
      if (studentData) {
        const teacherId = studentData.teacher_id;
        const dbData = await SupabaseService.fetchAllData(teacherId);
        
        if (dbData) {
          const processed = processDbData(dbData, teacherId);
          setAppData(prev => ({ 
            ...prev, 
            ...processed,
            teacherCode: teacherId 
          }));
          setRole('student');
          setCurrentUser(studentData);
          localStorage.setItem(STUDENT_AUTO_LOGIN_KEY, cleanCode.toUpperCase());
          return true;
        }
      }
    } catch (e) {
      console.error("Student login failed:", e);
    }

    return false;
  };

  const handleLogout = () => {
    setRole(null);
    setCurrentUser(null);
    localStorage.removeItem(STUDENT_AUTO_LOGIN_KEY);
  };

  const handleStudentUpdate = async (updatedStudent: Student) => {
    if (isSupabaseConnected) {
      await SupabaseService.upsertStudent(updatedStudent, updatedStudent.teacher_id || appData.teacherCode);
    }
    setAppData(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === updatedStudent.id ? updatedStudent : s)
    }));
  };

  if (isAutoLoggingIn) {
    return (
      <div className="min-h-screen bg-blue-600 flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
        <p className="font-bold animate-pulse">데이터 연결 중...</p>
      </div>
    );
  }

  if (isRegistering) {
    return <TeacherRegistration 
      onRegister={(code) => {
        setAppData(prev => ({ ...prev, teacherCode: code }));
        setIsRegistering(false);
      }} 
      onCancel={() => setIsRegistering(false)}
    />;
  }

  return (
    <div className="min-h-screen">
      {!role ? (
        <Login 
          onLogin={handleLogin} 
          configError={configError} 
          onGoToRegister={() => setIsRegistering(true)} 
        />
      ) : role === 'teacher' ? (
        <TeacherDashboard 
          data={appData} 
          onUpdate={(updater) => {
            setAppData(prev => {
              const next = updater(prev);
              EncryptionService.encrypt(next, next.teacherCode);
              return next;
            });
          }} 
          onLogout={handleLogout}
          isSupabaseConnected={isSupabaseConnected}
          onSupabaseConfig={async (config) => {
            const client = SupabaseService.init(config);
            if (client) {
              setIsSupabaseConnected(true);
              localStorage.setItem(SUPABASE_PERSIST_KEY, JSON.stringify(config));
              const dbData = await SupabaseService.fetchAllData(appData.teacherCode);
              const processed = processDbData(dbData || {}, appData.teacherCode);
              setAppData(prev => ({ ...prev, ...processed, supabaseConfig: config }));
            }
          }}
        />
      ) : (
        <StudentDashboard 
          student={currentUser!} 
          data={appData} 
          onLogout={handleLogout}
          onUpdateStudent={handleStudentUpdate}
        />
      )}
    </div>
  );
};

export default App;
