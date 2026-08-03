import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, FileText, Lock, CheckCircle2 } from 'lucide-react';
import { getSubjects, getContentTypes, getContent, getGlobalSettings } from '../services/db';
import { motion } from 'motion/react';

export const Syllabus = () => {
  const { user, hasPremiumAccess } = useAuth();
  const navigate = useNavigate();

  const [year, setYear] = useState(user?.year || 'Class 11');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [activeSubject, setActiveSubject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('syllabus');
  const [content, setContent] = useState<any[]>([]);
  const [contentTypes, setContentTypes] = useState<any[]>([]);

  const isLocked = !hasPremiumAccess && ['syllabus', 'notes'].includes(activeTab);

  // Fetch subjects based on selected year
  useEffect(() => {
    if (user) {
      const fetchCollegeId = user.college_id;
      getSubjects(fetchCollegeId).then(data => {
        const filtered = data.filter((s: any) => s.stream === user.stream && s.year === user.year);
        setSubjects(filtered);
        if (filtered.length > 0) setActiveSubject(filtered[0]);
        else setActiveSubject(null);
      });

      getContentTypes(fetchCollegeId, user.year).then(data => setContentTypes(data));
    }
  }, [user]);

  // Fetch content based on active subject and tab
  useEffect(() => {
    if (activeSubject) {
      const fetchCollegeId = user?.college_id;
      getContent(activeTab, activeSubject.id, undefined, undefined, undefined, fetchCollegeId).then(data => setContent(data));
    } else {
      setContent([]);
    }
  }, [activeSubject, activeTab, user?.college_id]);

  const openViewer = (url: string, title: string, allowDownload: boolean = false) => {
    window.open(`/viewer?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}${allowDownload ? '&download=true' : ''}`, '_blank');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Syllabus & Notes
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {user?.stream} Stream
          </p>
        </div>
      </div>

      {/* Step 1: Class Selection */}
      <div className={`flex glass-panel p-1 rounded-xl w-full max-w-md opacity-50 pointer-events-none`}>
        <button
          onClick={() => setYear('Class 11')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all ${
            user?.year === 'Class 11'
              ? 'bg-white/80 dark:bg-slate-700/80 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-400 hover:text-white dark:hover:text-white'
          }`}
        >
          Class 11
        </button>
        <button
          onClick={() => setYear('Class 12')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all ${
            user?.year === 'Class 12'
              ? 'bg-white/80 dark:bg-slate-700/80 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-400 hover:text-white dark:hover:text-white'
          }`}
        >
          Class 12
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Step 2: Subject Selection */}
        <div className="xl:col-span-1 space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Select Subject
          </h2>
          <div className="space-y-2">
            {subjects.length === 0 ? (
              <p className="text-sm text-slate-500">No subjects found for this year.</p>
            ) : (
              subjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => setActiveSubject(subject)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                    activeSubject?.id === subject.id
                      ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600 ring-offset-2 dark:ring-offset-slate-900'
                      : 'glass-panel text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <span className="truncate pr-2">{subject.name}</span>
                  {activeSubject?.id === subject.id && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Step 3: Content Area */}
        <div className="xl:col-span-3 space-y-6 relative">
          <div className="relative">
            {activeSubject ? (
            <>
              {/* Tabs */}
              <div className="glass-panel rounded-2xl p-1 flex flex-wrap gap-1 max-w-fit mb-6 relative z-20">
                <button
                  onClick={() => setActiveTab('syllabus')}
                  className={`px-6 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 ${
                    activeTab === 'syllabus'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                      : 'text-slate-600 hover:text-white dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <BookOpen className="w-4 h-4" /> Syllabus
                </button>
                {contentTypes.filter(ct => ct.name.toLowerCase() !== 'pyq' && ct.name.toLowerCase() !== 'solution' && ct.name.toLowerCase() !== 'notes' && ct.name.toLowerCase() !== 'syllabus').map(ct => (
                  <button
                    key={ct.id}
                    onClick={() => setActiveTab(ct.name.toLowerCase())}
                    className={`px-6 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 ${
                      activeTab === ct.name.toLowerCase()
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : 'text-slate-600 hover:text-white dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <FileText className="w-4 h-4" /> {ct.name}
                  </button>
                ))}
              </div>

              <div className="relative">
                {isLocked && (
                  <div className="absolute inset-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-slate-700">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                      <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Premium Content Locked</h3>
                    <p className="text-slate-600 dark:text-slate-300 max-w-md mb-6">
                      This content is only available for premium users. Upgrade your account to access syllabus, structured notes, and more.
                    </p>
                    <button 
                      onClick={() => navigate('/get-premium')}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-sm hover-lift"
                    >
                      Get Premium Access
                    </button>
                  </div>
                )}

                <div className={isLocked ? 'opacity-20 pointer-events-none' : ''}>
                  {/* Content List */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel rounded-2xl overflow-hidden"
                  >
                <div className="p-6 border-b border-slate-700/50">
                  <h2 className="text-xl font-bold text-white capitalize">
                    {activeSubject.name} - {activeTab}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {activeTab === 'syllabus' 
                      ? 'Official curriculum and chapter breakdown.' 
                      : activeTab === 'notes' ? 'Verified study materials and chapter-wise notes.' : `Verified ${activeTab} materials.`}
                  </p>
                </div>

                <div className="p-6">
                  {content.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        {activeTab === 'syllabus' ? <BookOpen className="w-8 h-8 text-slate-400" /> : <FileText className="w-8 h-8 text-slate-400" />}
                      </div>
                      <h3 className="text-lg font-medium text-white">No {activeTab} available yet</h3>
                      <p className="text-slate-400 mt-1 max-w-sm mx-auto">
                        {user?.role === 'admin' ? `No ${activeTab} have been added yet.` : 'We are currently updating the materials for this subject. Check back soon or contribute your own!'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {content.map(item => (
                        <div key={item.id} className="p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group bg-slate-50/50 dark:bg-slate-800/50">
                          <div className="flex items-start sm:items-center gap-4">
                            <div className="p-3 bg-white dark:bg-slate-700 rounded-lg text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-100 dark:border-slate-600">
                              {activeTab === 'syllabus' ? <BookOpen className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                            </div>
                            <div>
                              <h3 className="font-bold text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-base">
                                {item.description}
                              </h3>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Verified
                                </span>
                                <span className="text-xs text-slate-400">
                                  Added {item.created_at?.toDate ? item.created_at.toDate().toLocaleDateString() : (item.created_at?.seconds ? new Date(item.created_at.seconds * 1000).toLocaleDateString() : new Date(item.created_at || Date.now()).toLocaleDateString())}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {item.access_level === 'secure' ? (
                            <button 
                              onClick={() => openViewer(item.file_url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', item.description)}
                              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 text-white dark:bg-slate-800 dark:text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-100 dark:hover:text-slate-900 transition-all shadow-sm hover:shadow-md"
                            >
                              <Lock className="w-4 h-4" />
                              Secure View
                            </button>
                          ) : (
                            <a 
                              href={`/viewer?url=${encodeURIComponent(item.file_url)}&title=${encodeURIComponent(item.description)}&download=true`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md"
                            >
                              <FileText className="w-4 h-4" />
                              View
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </>
      ) : (
            <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                <BookOpen className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Select a Subject</h2>
              <p className="text-slate-400 max-w-md">
                Choose a subject from the list on the left to view its updated syllabus and structured notes.
              </p>
            </div>
          )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};;
