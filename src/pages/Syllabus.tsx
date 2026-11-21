import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, FileText, Lock, CheckCircle2 } from 'lucide-react';
import { getSubjects, getContentTypes, getContent, getGlobalSettings } from '../services/db';
import { motion } from 'motion/react';

export const Syllabus = () => {
  const { user, hasPremiumAccess, isPremiumSubscriber } = useAuth();
  const navigate = useNavigate();

  const [year, setYear] = useState(user?.year || 'Class 11');
  const [stream, setStream] = useState(user?.stream || 'Science');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [activeSubject, setActiveSubject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('syllabus');
  const [content, setContent] = useState<any[]>([]);
  const [contentTypes, setContentTypes] = useState<any[]>([]);

  const isLocked = !hasPremiumAccess && ['syllabus', 'notes'].includes(activeTab);

  // Fetch subjects based on selected stream and year
  useEffect(() => {
    const fetchCollegeId = user?.college_id;
    getSubjects(fetchCollegeId).then(data => {
      const filtered = data.filter((s: any) => (!stream || s.stream === stream) && (!year || s.year === year));
      setSubjects(filtered);
      if (filtered.length > 0) setActiveSubject(filtered[0]);
      else setActiveSubject(null);
    });

    if (fetchCollegeId) {
      getContentTypes(fetchCollegeId, year).then(data => setContentTypes(data));
    }
  }, [user?.college_id, stream, year]);

  // Fetch content based on active subject and tab
  useEffect(() => {
    const fetchCollegeId = user?.college_id;
    getContent(activeTab, activeSubject?.id || activeSubject?.name || undefined, year, undefined, undefined, fetchCollegeId).then(data => setContent(data));
  }, [activeSubject, activeTab, user?.college_id, year]);

  const openViewer = (url: string, title: string, allowDownload: boolean = false, id?: string) => {
    const params = new URLSearchParams();
    if (id) params.set('id', id);
    if (url) params.set('url', url);
    params.set('title', title);
    if (allowDownload) params.set('download', 'true');
    window.open(`/viewer?${params.toString()}`, '_blank');
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
            Official NEB Curriculum & Chapter-wise Notes for {stream} Stream ({year})
          </p>
        </div>
      </div>

      {/* Class & Stream Selectors */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Class Selection */}
        <div className="flex bg-slate-900/85 border border-slate-700/60 p-1.5 rounded-2xl w-full sm:w-auto min-w-[200px] shadow-sm backdrop-blur-md">
          <button
            onClick={() => setYear('Class 11')}
            className={`flex-1 py-2 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              year === 'Class 11'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Class 11
          </button>
          <button
            onClick={() => setYear('Class 12')}
            className={`flex-1 py-2 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              year === 'Class 12'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Class 12
          </button>
        </div>

        {/* Stream Selection */}
        <div className="flex bg-slate-900/85 border border-slate-700/60 p-1.5 rounded-2xl w-full sm:w-auto shadow-sm backdrop-blur-md">
          {['Science', 'Management', 'Humanities'].map(str => (
            <button
              key={str}
              onClick={() => setStream(str)}
              className={`py-2 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                stream === str
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {str}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Step 2: Subject Selection */}
        <div className="xl:col-span-1 space-y-3 sm:space-y-4">
          <h2 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
            Select Subject
          </h2>
          <div className="flex flex-row overflow-x-auto no-scrollbar gap-2 pb-2 xl:flex-col xl:space-y-2 xl:pb-0">
            {subjects.length === 0 ? (
              <p className="text-sm text-slate-500">No subjects found for {stream} ({year}).</p>
            ) : (
              subjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => setActiveSubject(subject)}
                  className={`shrink-0 text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    activeSubject?.id === subject.id
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-950/70 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span className="truncate pr-1">{subject.name}</span>
                  {activeSubject?.id === subject.id && <CheckCircle2 className="w-4 h-4 shrink-0 text-slate-950" />}
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
              <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-1.5 flex flex-wrap gap-1.5 max-w-fit mb-6 relative z-20 no-scrollbar overflow-x-hidden shadow-sm backdrop-blur-md">
                <button
                  onClick={() => setActiveTab('syllabus')}
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
                    activeTab === 'syllabus'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-4 h-4" /> Syllabus
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
                    activeTab === 'notes'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" /> Structured Notes
                </button>
              </div>

              <div className="relative">
                {isLocked && (
                  <div className="absolute inset-0 z-10 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center rounded-3xl border border-slate-700/80">
                    <div className="w-16 h-16 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-sm text-amber-400">
                      <Lock className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Premium Content Locked</h3>
                    <p className="text-slate-300 max-w-md mb-6 text-sm">
                      This content is only available for premium users. Upgrade your account to access syllabus, structured notes, and more.
                    </p>
                    <button 
                      onClick={() => navigate('/get-premium')}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
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
                    className="rounded-3xl bg-slate-900/85 border border-slate-700/60 shadow-xl backdrop-blur-xl overflow-hidden"
                  >
                <div className="p-6 border-b border-slate-800">
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
                      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700 text-slate-400">
                        {activeTab === 'syllabus' ? <BookOpen className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                      </div>
                      <h3 className="text-lg font-bold text-white">No {activeTab} available yet</h3>
                      <p className="text-slate-400 mt-1 max-w-sm mx-auto text-sm">
                        {user?.role === 'admin' ? `No ${activeTab} have been added yet.` : 'We are currently updating the materials for this subject. Check back soon or contribute your own!'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {content.map(item => {
                        const isItemPremiumOnly = item.status === 'premium_only' || item.access_level === 'premium';
                        const isItemLocked = isItemPremiumOnly ? !isPremiumSubscriber : !hasPremiumAccess;

                        return (
                          <div key={item.id} className="p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-500/40 transition-all group shadow-sm">
                            <div className="flex items-start sm:items-center gap-4">
                              <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-[#F5C21B] shadow-sm shrink-0">
                                {activeTab === 'syllabus' ? <BookOpen className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                              </div>
                              <div>
                                <h3 className="font-bold text-white group-hover:text-[#F5C21B] transition-colors text-base">
                                  {item.description}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5">
                                  {isItemPremiumOnly && (
                                    <span className="text-xs font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                      <Lock className="w-3 h-3 text-amber-400" /> Premium Only
                                    </span>
                                  )}
                                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Verified
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    Added {item.created_at?.toDate ? item.created_at.toDate().toLocaleDateString() : (item.created_at?.seconds ? new Date(item.created_at.seconds * 1000).toLocaleDateString() : new Date(item.created_at || Date.now()).toLocaleDateString())}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {isItemLocked ? (
                              <button 
                                onClick={() => navigate('/get-premium')}
                                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                              >
                                <Lock className="w-4 h-4 text-amber-400" />
                                Unlock with Premium
                              </button>
                            ) : (
                              <button 
                                onClick={() => openViewer(item.file_url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', item.description || item.title, false, item.id)}
                                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer"
                              >
                                <FileText className="w-4 h-4" />
                                View Document (View Only)
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </>
      ) : (
            <div className="rounded-3xl bg-slate-900/85 border border-slate-700/60 shadow-xl backdrop-blur-xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="w-20 h-20 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-center mb-6 text-[#F5C21B] shadow-sm">
                <BookOpen className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Select a Subject</h2>
              <p className="text-slate-400 max-w-md text-sm">
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
