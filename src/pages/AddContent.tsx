import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import { PlusCircle, FileText, Building2, BookOpen, Tag, Calendar, Database, Trash2, Clock, RefreshCw, Loader2, Search, Eye, ExternalLink, Filter } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  getColleges, 
  getSubjects, 
  getContentTypes, 
  getExamYears, 
  getContributions,
  addContribution, 
  addCollege, 
  addSubject, 
  addContentType, 
  addExamYear, 
  uploadFile,
  deleteCollege,
  deleteSubject,
  deleteContentType,
  deleteExamYear,
  deleteContribution,
  deleteContributionFile,
  setCollegeExamTimer,
  seedDefaultCurriculumData
} from '../services/db';
import { ConfirmModal } from '../components/ConfirmModal';
import { PurgeDataModal } from '../components/admin/PurgeDataModal';

export const AddContent = () => {
  const { user } = useAuth();
  const { startLoading, setProgress, stopLoading } = useLoading();
  const [activeTab, setActiveTab] = useState<'add_content' | 'add_college' | 'add_subject' | 'add_type' | 'add_exam_year' | 'manage_data' | 'add_exam_timer'>('add_content');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState('');
  
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
    isOpen: false, title: '', message: '', onConfirm: () => {}
  });
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  
  const [colleges, setColleges] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [contentTypes, setContentTypes] = useState<any[]>([]);
  const [examYears, setExamYears] = useState<any[]>([]);

  // Manage Data State
  const [manageDataType, setManageDataType] = useState<'colleges' | 'subjects' | 'content_types' | 'exam_years' | 'materials'>('colleges');
  const [dataList, setDataList] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [allContentTypes, setAllContentTypes] = useState<any[]>([]);
  const [allExamYears, setAllExamYears] = useState<any[]>([]);

  // Delete Form State
  const [searchQuery, setSearchQuery] = useState('');
  const [delCollegeId, setDelCollegeId] = useState('0');
  const [delSubjectId, setDelSubjectId] = useState('');
  const [delContentType, setDelContentType] = useState('');
  const [delTerm, setDelTerm] = useState('');
  const [delExamYear, setDelExamYear] = useState('');
  const [delYear, setDelYear] = useState('');
  const [delItemId, setDelItemId] = useState('');

  // Add Content State
  const [contentCollegeId, setContentCollegeId] = useState('0');
  const [subjectId, setSubjectId] = useState('');
  const [type, setType] = useState('pyq');
  const [term, setTerm] = useState('');
  const [examYear, setExamYear] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [solutionFile, setSolutionFile] = useState<File | null>(null);
  const [accessLevel, setAccessLevel] = useState('public');
  const [addStatus, setAddStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add College State
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeLocation, setNewCollegeLocation] = useState('');
  const [collegeAddStatus, setCollegeAddStatus] = useState('');

  // Add Subject State
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectStream, setNewSubjectStream] = useState('Science');
  const [newSubjectYear, setNewSubjectYear] = useState('Class 11');
  const [newSubjectCollegeId, setNewSubjectCollegeId] = useState('0');
  const [subjectAddStatus, setSubjectAddStatus] = useState('');

  // Add Content Type State
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeCollegeId, setNewTypeCollegeId] = useState('0');
  const [newTypeYear, setNewTypeYear] = useState('Class 11');
  const [typeAddStatus, setTypeAddStatus] = useState('');

  // Add Exam Year State
  const [newExamYearValue, setNewExamYearValue] = useState('');
  const [newExamYearCollegeId, setNewExamYearCollegeId] = useState('0');
  const [newExamYearYear, setNewExamYearYear] = useState('Class 11');
  const [examYearAddStatus, setExamYearAddStatus] = useState('');

  // Add Exam Timer State
  const [examTimerCollegeId, setExamTimerCollegeId] = useState('0');
  const [examTimerTerm, setExamTimerTerm] = useState('');
  const [examTimerDate, setExamTimerDate] = useState('');
  const [examTimerStatus, setExamTimerStatus] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchColleges();
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchSubjects(contentCollegeId);
    }
  }, [user, contentCollegeId]);

  useEffect(() => {
    if (user?.role === 'admin') {
      const selectedSubject = subjects.find(s => s.id.toString() === subjectId);
      const year = selectedSubject ? selectedSubject.year : '';
      fetchContentTypes(contentCollegeId, year);
      fetchExamYears(contentCollegeId, year);
    }
  }, [user, contentCollegeId, subjectId, subjects]);

  useEffect(() => {
    if (user?.role === 'admin' && activeTab === 'manage_data') {
      fetchDataList();
      getSubjects('all').then(setAllSubjects);
      getContentTypes('all', 'all').then(setAllContentTypes);
      getExamYears('all', 'all').then(setAllExamYears);
    }
  }, [user, activeTab, manageDataType]);

  const fetchDataList = async () => {
    let data: any[] = [];
    switch (manageDataType) {
      case 'colleges': data = await getColleges(); break;
      case 'subjects': data = await getSubjects('all'); break;
      case 'content_types': data = await getContentTypes('all', 'all'); break;
      case 'exam_years': data = await getExamYears('all', 'all'); break;
      case 'materials': data = await getContributions(); break;
    }
    setDataList(data);
    setDelItemId(''); // Reset selected item when switching tabs
  };

  const filteredDataList = dataList.filter(item => {
    // Search query filter across all fields
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const subjectName = (allSubjects.find(s => s.id === item.subject_id)?.name || '').toLowerCase();
      const collegeName = (colleges.find(c => c.id === item.college_id)?.name || '').toLowerCase();
      const match = 
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.year_value && item.year_value.toString().toLowerCase().includes(q)) ||
        (item.year && item.year.toLowerCase().includes(q)) ||
        (item.term && item.term.toLowerCase().includes(q)) ||
        (item.type && item.type.toLowerCase().includes(q)) ||
        (item.stream && item.stream.toLowerCase().includes(q)) ||
        subjectName.includes(q) ||
        collegeName.includes(q);
      if (!match) return false;
    }

    if (manageDataType === 'materials') {
      const itemClass = item.year || allSubjects.find(s => s.id === item.subject_id)?.year;
      if (delYear && itemClass !== delYear) return false;
      if (delCollegeId !== '0' && item.college_id !== delCollegeId) return false;
      if (delSubjectId && item.subject_id !== delSubjectId) return false;
      if (delContentType && item.type !== delContentType) return false;
      if (delTerm && item.term !== delTerm) return false;
      if (delExamYear && item.exam_year?.toString() !== delExamYear.toString()) return false;
    } else if (manageDataType === 'subjects') {
      if (delCollegeId !== '0' && item.college_id !== delCollegeId) return false;
    } else if (manageDataType === 'content_types' || manageDataType === 'exam_years') {
      if (delCollegeId !== '0' && item.college_id !== delCollegeId) return false;
      if (delYear && item.year !== delYear) return false;
    }
    return true;
  });

  const handleDeleteData = async (id: string, fileType?: 'file_url' | 'solution_url') => {
    const itemToDelete = dataList.find(d => d.id === id);
    const itemName = itemToDelete?.title || itemToDelete?.description || itemToDelete?.name || 'Item';

    setConfirmModal({
      isOpen: true,
      title: fileType ? `Delete ${fileType === 'file_url' ? 'Question Paper' : 'Solution'} File` : 'Delete Item & Cloud Storage Files',
      message: fileType 
        ? `Are you sure you want to permanently delete this ${fileType === 'file_url' ? 'question paper' : 'solution'} file from Cloudinary and database? This action cannot be undone.`
        : `Are you sure you want to permanently delete "${itemName}"? All associated PDF documents will be removed from Cloudinary and the database record will be deleted. This cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsDeleting(id);
        startLoading(35, 'Permanently deleting files from Cloudinary and database...');
        try {
          if (fileType && manageDataType === 'materials') {
            await deleteContributionFile(id, fileType);
          } else {
            switch (manageDataType) {
              case 'colleges': await deleteCollege(id); break;
              case 'subjects': await deleteSubject(id); break;
              case 'content_types': await deleteContentType(id); break;
              case 'exam_years': await deleteExamYear(id); break;
              case 'materials': await deleteContribution(id); break;
            }
          }
          await fetchDataList();
          fetchColleges();
          fetchSubjects(contentCollegeId);
        } catch (err) {
          console.error(err);
          alert('Failed to delete item.');
        } finally {
          setIsDeleting(null);
          stopLoading();
        }
      }
    });
  };

  const fetchColleges = async () => {
    const data = await getColleges();
    setColleges(data);
  };

  const fetchSubjects = async (collegeId: string) => {
    const data = await getSubjects(collegeId);
    setSubjects(data);
    if (data.length > 0 && !data.find((s: any) => s.id.toString() === subjectId)) {
      setSubjectId(data[0].id.toString());
    }
  };

  const fetchContentTypes = async (collegeId: string, year: string) => {
    const data = await getContentTypes(collegeId, year);
    setContentTypes(data);
  };

  const fetchExamYears = async (collegeId: string, year: string) => {
    const data = await getExamYears(collegeId, year);
    setExamYears(data);
  };

  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAddStatus('');
    setUploadProgress(15);
    setUploadStep('Preparing content upload...');
    startLoading(20, 'Preparing content upload...');

    try {
      let uploadedFileUrl = 'https://example.com/dummy.pdf';
      if (file) {
        setUploadProgress(35);
        setUploadStep('Uploading main PDF file...');
        setProgress(45, 'Uploading main PDF file...');
        uploadedFileUrl = await uploadFile(file, 'content');
      } else {
        throw new Error("Please select a file to upload.");
      }

      let uploadedSolutionUrl = '';
      if (solutionFile) {
        setUploadProgress(65);
        setUploadStep('Uploading solution PDF file...');
        setProgress(65, 'Uploading solution PDF file...');
        uploadedSolutionUrl = await uploadFile(solutionFile, 'solutions');
      }

      setUploadProgress(85);
      setUploadStep('Publishing content to platform...');
      setProgress(85, 'Publishing content to platform...');

      await addContribution({
        user_id: user?.id,
        college_id: contentCollegeId === '0' ? null : contentCollegeId,
        subject_id: subjectId,
        type,
        term,
        exam_year: examYear,
        description,
        file_url: uploadedFileUrl,
        solution_url: uploadedSolutionUrl,
        access_level: accessLevel,
        status: 'verified'
      }, user);
      
      setUploadProgress(100);
      setUploadStep('Content published successfully!');
      setProgress(100, 'Content published successfully!');
      setAddStatus('Content added successfully to the website!');
      setDescription('');
      setFile(null);
      setSolutionFile(null);
      (e.target as HTMLFormElement).reset();
      setTimeout(() => setAddStatus(''), 4000);
    } catch (err: any) {
      console.error(err);
      setAddStatus(err.message || 'Error uploading file.');
    } finally {
      setIsSubmitting(false);
      stopLoading();
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStep('');
      }, 2500);
    }
  };

  const handleAddCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCollege({ name: newCollegeName, location: newCollegeLocation });
      setCollegeAddStatus('College added successfully!');
      setNewCollegeName('');
      setNewCollegeLocation('');
      fetchColleges();
      setTimeout(() => setCollegeAddStatus(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addSubject({ 
        name: newSubjectName, 
        stream: newSubjectStream,
        year: newSubjectYear,
        college_id: newSubjectCollegeId === '0' ? null : newSubjectCollegeId
      });
      setSubjectAddStatus('Subject added successfully!');
      setNewSubjectName('');
      fetchSubjects(contentCollegeId);
      setTimeout(() => setSubjectAddStatus(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addContentType({ 
        name: newTypeName, 
        college_id: newTypeCollegeId === '0' ? null : newTypeCollegeId,
        year: newTypeYear
      });
      setTypeAddStatus('Content type added successfully!');
      setNewTypeName('');
      const selectedSubject = subjects.find(s => s.id.toString() === subjectId);
      fetchContentTypes(contentCollegeId, selectedSubject ? selectedSubject.year : '');
      setTimeout(() => setTypeAddStatus(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExamYear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addExamYear({ 
        year_value: newExamYearValue, 
        college_id: newExamYearCollegeId === '0' ? null : newExamYearCollegeId,
        year: newExamYearYear
      });
      setExamYearAddStatus('Exam year added successfully!');
      setNewExamYearValue('');
      const selectedSubject = subjects.find(s => s.id.toString() === subjectId);
      fetchExamYears(contentCollegeId, selectedSubject ? selectedSubject.year : '');
      setTimeout(() => setExamYearAddStatus(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExamTimer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (examTimerCollegeId === '0') {
      setExamTimerStatus('Please select a specific college.');
      return;
    }
    try {
      await setCollegeExamTimer(examTimerCollegeId, examTimerTerm, examTimerDate);
      setExamTimerStatus('Exam timer updated successfully!');
      setExamTimerTerm('');
      setExamTimerDate('');
      setTimeout(() => setExamTimerStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setExamTimerStatus('Failed to update exam timer.');
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  const handleSyncDefaults = async () => {
    setIsSyncing(true);
    setSyncStatus('Syncing...');
    try {
      const res = await seedDefaultCurriculumData();
      setSyncStatus(`Synced! (${res.countAdded} added)`);
      fetchColleges();
      fetchSubjects(contentCollegeId);
      setTimeout(() => setSyncStatus(''), 4000);
    } catch (err: any) {
      console.error(err);
      setSyncStatus('Sync failed');
      setTimeout(() => setSyncStatus(''), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">
          Manage Content
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncDefaults}
            disabled={isSyncing}
            className="px-4 py-2 bg-[#F5C21B] hover:bg-[#e0b018] text-black font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow cursor-pointer disabled:opacity-50"
          >
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin text-slate-800" /> : <RefreshCw className="w-4 h-4" />}
            <span>{syncStatus || "Sync / Seed NEB Curriculum"}</span>
          </button>
          <button
            onClick={() => setIsPurgeModalOpen(true)}
            className="px-4 py-2 bg-rose-600/90 hover:bg-rose-600 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Purge All Data</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-panel rounded-2xl p-1 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('add_content')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'add_content'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
              : 'text-slate-600 hover:text-white dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" /> Add Material
        </button>
        <button
          onClick={() => setActiveTab('add_college')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'add_college'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
              : 'text-slate-600 hover:text-white dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" /> Add College
        </button>
        <button
          onClick={() => setActiveTab('add_subject')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'add_subject'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
              : 'text-slate-600 hover:text-white dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Add Subject
        </button>
        <button
          onClick={() => setActiveTab('add_type')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'add_type'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
              : 'text-slate-600 hover:text-white dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" /> Add Content Type
        </button>
        <button
          onClick={() => setActiveTab('add_exam_year')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'add_exam_year'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
              : 'text-slate-600 hover:text-white dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" /> Add Exam Year
        </button>
        <button
          onClick={() => setActiveTab('add_exam_timer')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'add_exam_timer'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
              : 'text-slate-600 hover:text-white dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" /> Exam Timer
        </button>
        <button
          onClick={() => setActiveTab('manage_data')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'manage_data'
              ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
              : 'text-slate-600 hover:text-white dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Trash2 className="w-4 h-4" /> Manage / Delete
        </button>
      </div>

      {activeTab === 'add_content' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
            <h2 className="text-xl font-bold text-white">Add Official Material</h2>
            <p className="text-sm text-slate-400 mt-1">Publish verified PYQs, notes, or syllabus directly to the platform.</p>
          </div>
          <div className="p-6">
            {addStatus && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                {addStatus}
              </div>
            )}
            
            <form onSubmit={handleAddContent} className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">College (Optional)</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    value={contentCollegeId}
                    onChange={(e) => setContentCollegeId(e.target.value)}
                  >
                    <option value="0">Global (All Colleges)</option>
                    {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
                  <select 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                  >
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Content Type</label>
                  <select 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="pyq">Question Paper (PYQ)</option>
                    <option value="notes">Structured Notes</option>
                    <option value="syllabus">Syllabus</option>
                    {contentTypes.map(ct => <option key={ct.id} value={ct.name}>{ct.name}</option>)}
                  </select>
                </div>
                
                {type === 'pyq' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Term</label>
                    <select 
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                    >
                      <option value="">Select Term (Optional)</option>
                      <option value="1st Term">1st Term</option>
                      <option value="2nd Term">2nd Term</option>
                      <option value="3rd Term">3rd Term</option>
                      <option value="Final Term">Final Term</option>
                    </select>
                  </div>
                )}
              </div>

              {type === 'pyq' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Exam Year</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    value={examYear}
                    onChange={(e) => setExamYear(e.target.value)}
                  >
                    <option value="">Select Exam Year (Optional)</option>
                    {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                    {examYears.map(ey => <option key={ey.id} value={ey.year_value}>{ey.year_value}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description / Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g., Physics Final Term 2023"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Upload File (PDF/Image)</label>
                <input 
                  type="file"
                  required
                  accept=".pdf,image/*"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                />
              </div>

              {type === 'pyq' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Upload Solution (Optional)</label>
                  <input 
                    type="file"
                    accept=".pdf,image/*"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400"
                    onChange={(e) => setSolutionFile(e.target.files ? e.target.files[0] : null)}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Access Level</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  value={accessLevel}
                  onChange={(e) => setAccessLevel(e.target.value)}
                >
                  <option value="public">Public (Downloadable)</option>
                  <option value="secure">Secure (View Only, No Download)</option>
                </select>
              </div>

              {isSubmitting && (
                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-amber-400/30 space-y-2">
                  <div className="flex justify-between items-center text-xs text-amber-300 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      {uploadStep || 'Uploading to server...'}
                    </span>
                    <span className="text-white font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                    <div 
                      className="bg-gradient-to-r from-amber-500 via-[#F4B400] to-yellow-300 h-2 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(244,180,0,0.5)]"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading {uploadProgress}%...
                  </span>
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    Publish Content
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'add_college' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white">Add New College</h2>
            <p className="text-sm text-slate-400 mt-1">Add a new college to the platform database.</p>
          </div>
          <div className="p-6">
            {collegeAddStatus && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                {collegeAddStatus}
              </div>
            )}
            
            <form onSubmit={handleAddCollege} className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">College Name</label>
                <input 
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                <input 
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  value={newCollegeLocation}
                  onChange={(e) => setNewCollegeLocation(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Add College
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'add_subject' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white">Add New Subject</h2>
            <p className="text-sm text-slate-400 mt-1">Add a new subject for a specific college and year.</p>
          </div>
          <div className="p-6">
            {subjectAddStatus && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                {subjectAddStatus}
              </div>
            )}
            
            <form onSubmit={handleAddSubject} className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">College (Optional)</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  value={newSubjectCollegeId}
                  onChange={(e) => setNewSubjectCollegeId(e.target.value)}
                >
                  <option value="0">Global (All Colleges)</option>
                  {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Class</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  value={newSubjectYear}
                  onChange={(e) => setNewSubjectYear(e.target.value)}
                >
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Stream</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  value={newSubjectStream}
                  onChange={(e) => setNewSubjectStream(e.target.value)}
                >
                  <option value="Science">Science</option>
                  <option value="Management">Management</option>
                  <option value="Humanities">Humanities</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Subject Name</label>
                <input 
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Add Subject
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'add_type' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white">Add Content Type</h2>
            <p className="text-sm text-slate-400 mt-1">Add a new content type (e.g., Lab Manual, Assignment).</p>
          </div>
          <div className="p-6">
            {typeAddStatus && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                {typeAddStatus}
              </div>
            )}
            
            <form onSubmit={handleAddType} className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">College (Optional)</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  value={newTypeCollegeId}
                  onChange={(e) => setNewTypeCollegeId(e.target.value)}
                >
                  <option value="0">Global (All Colleges)</option>
                  {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Class (Optional)</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  value={newTypeYear}
                  onChange={(e) => setNewTypeYear(e.target.value)}
                >
                  <option value="">All Classes</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Type Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g., Lab Manual"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Add Content Type
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'add_exam_year' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white">Add Exam Year</h2>
            <p className="text-sm text-slate-400 mt-1">Add a specific exam year (e.g., 2019, 2018).</p>
          </div>
          <div className="p-6">
            {examYearAddStatus && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                {examYearAddStatus}
              </div>
            )}
            
            <form onSubmit={handleAddExamYear} className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">College (Optional)</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  value={newExamYearCollegeId}
                  onChange={(e) => setNewExamYearCollegeId(e.target.value)}
                >
                  <option value="0">Global (All Colleges)</option>
                  {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Class (Optional)</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  value={newExamYearYear}
                  onChange={(e) => setNewExamYearYear(e.target.value)}
                >
                  <option value="">All Classes</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Exam Year Value</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g., 2019"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  value={newExamYearValue}
                  onChange={(e) => setNewExamYearValue(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Add Exam Year
              </button>
            </form>
          </div>
        </div>
      )}
      {activeTab === 'add_exam_timer' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white">Exam Timer</h2>
            <p className="text-sm text-slate-400 mt-1">Set the upcoming exam date and term for a specific college.</p>
          </div>
          <div className="p-6">
            {examTimerStatus && (
              <div className={`mb-6 p-4 rounded-xl border flex items-center gap-2 ${
                examTimerStatus.includes('Failed') || examTimerStatus.includes('Please')
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
              }`}>
                <PlusCircle className="w-5 h-5" />
                {examTimerStatus}
              </div>
            )}
            
            <form onSubmit={handleAddExamTimer} className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">College</label>
                <select 
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  value={examTimerCollegeId}
                  onChange={(e) => setExamTimerCollegeId(e.target.value)}
                >
                  <option value="0">Select College</option>
                  {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Term</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g., 1st Term, Final Term"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  value={examTimerTerm}
                  onChange={(e) => setExamTimerTerm(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Exam Date</label>
                <input 
                  type="date"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  value={examTimerDate}
                  onChange={(e) => setExamTimerDate(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Clock className="w-5 h-5" />
                Set Timer
              </button>
            </form>
          </div>
        </div>
      )}
      {activeTab === 'manage_data' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                Manage & Delete Data
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                View, filter, preview, and permanently remove content and cloud-stored PDF files.
              </p>
            </div>
            <div className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 self-start sm:self-auto">
              Total items: <span className="font-bold text-emerald-400">{filteredDataList.length}</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {/* Category Selector Tabs */}
            <div className="flex flex-wrap gap-2">
              {(['materials', 'subjects', 'colleges', 'content_types', 'exam_years'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setManageDataType(type);
                    setSearchQuery('');
                    setDelItemId('');
                  }}
                  className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                    manageDataType === type
                      ? 'bg-[#F4B400] text-black shadow-md'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                  }`}
                >
                  {type === 'materials' ? '📄 Materials (PDFs)' : type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </button>
              ))}
            </div>

            {/* Search & Dynamic Filter Bar */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by title, subject, college, term, year..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
                />
              </div>

              {/* Secondary Filters for Materials */}
              {manageDataType === 'materials' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 text-xs">
                    {/* Class Filter */}
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">Class</label>
                      <select
                        className="w-full px-2.5 py-1.5 bg-slate-950/70 border border-slate-700 rounded-lg text-white"
                        value={delYear}
                        onChange={(e) => setDelYear(e.target.value)}
                      >
                        <option value="">All Classes</option>
                        <option value="Class 11">Class 11</option>
                        <option value="Class 12">Class 12</option>
                      </select>
                    </div>

                    {/* College Filter */}
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">College</label>
                      <select
                        className="w-full px-2.5 py-1.5 bg-slate-950/70 border border-slate-700 rounded-lg text-white"
                        value={delCollegeId}
                        onChange={(e) => setDelCollegeId(e.target.value)}
                      >
                        <option value="0">All Colleges / Global</option>
                        {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    {/* Subject Filter */}
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">Subject</label>
                      <select
                        className="w-full px-2.5 py-1.5 bg-slate-950/70 border border-slate-700 rounded-lg text-white"
                        value={delSubjectId}
                        onChange={(e) => setDelSubjectId(e.target.value)}
                      >
                        <option value="">All Subjects</option>
                        {allSubjects
                          .filter(s => (delCollegeId === '0' || s.college_id === delCollegeId || !s.college_id) && (!delYear || s.year === delYear || !s.year))
                          .map(s => <option key={s.id} value={s.id}>{s.name} ({s.year || 'All'})</option>)}
                      </select>
                    </div>

                    {/* Content Type Filter */}
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">Content Type</label>
                      <select
                        className="w-full px-2.5 py-1.5 bg-slate-950/70 border border-slate-700 rounded-lg text-white"
                        value={delContentType}
                        onChange={(e) => setDelContentType(e.target.value)}
                      >
                        <option value="">All Types</option>
                        <option value="pyq">PYQ</option>
                        <option value="notes">Notes</option>
                        <option value="syllabus">Syllabus</option>
                        <option value="solutions">Solutions</option>
                        <option value="model_questions">Model Questions</option>
                      </select>
                    </div>

                    {/* Term Filter */}
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">Term</label>
                      <select
                        className="w-full px-2.5 py-1.5 bg-slate-950/70 border border-slate-700 rounded-lg text-white"
                        value={delTerm}
                        onChange={(e) => setDelTerm(e.target.value)}
                      >
                        <option value="">All Terms</option>
                        <option value="1st Term">1st Term</option>
                        <option value="2nd Term">2nd Term</option>
                        <option value="3rd Term">3rd Term</option>
                        <option value="Final Term">Final Term</option>
                      </select>
                    </div>

                    {/* Exam Year Filter */}
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">Exam Year</label>
                      <select
                        className="w-full px-2.5 py-1.5 bg-slate-950/70 border border-slate-700 rounded-lg text-white"
                        value={delExamYear}
                        onChange={(e) => setDelExamYear(e.target.value)}
                      >
                        <option value="">All Exam Years</option>
                        {['2026', '2025', '2024', '2023', '2022', '2021', '2020'].map(yr => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Reset Filters Shortcut */}
                  {(searchQuery || delYear || delCollegeId !== '0' || delSubjectId || delContentType || delTerm || delExamYear) && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setDelYear('');
                          setDelCollegeId('0');
                          setDelSubjectId('');
                          setDelContentType('');
                          setDelTerm('');
                          setDelExamYear('');
                        }}
                        className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>✕ Reset all filters</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* List View */}
            {filteredDataList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                <Database className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-medium">No items found matching your filters.</p>
                <p className="text-xs text-slate-500 mt-1">Try clearing the search query or reset filters.</p>
              </div>
            ) : manageDataType === 'materials' ? (
              /* Materials (PDFs) Management Cards */
              <div className="space-y-3">
                {filteredDataList.map((item) => {
                  const subjectName = allSubjects.find(s => s.id === item.subject_id)?.name || item.subject_id || 'General';
                  const collegeName = colleges.find(c => c.id === item.college_id)?.name || (item.college_id ? `College #${item.college_id}` : 'Global');
                  const isItemDeleting = isDeleting === item.id;

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Left: Info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-white truncate">
                            {item.description || item.title || 'Untitled Document'}
                          </span>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                            {item.type || 'Material'}
                          </span>
                          {item.access_level === 'premium' && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                              Premium
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="font-medium text-slate-300">{subjectName}</span>
                          <span>•</span>
                          <span>{collegeName}</span>
                          {item.year && <span>• {item.year}</span>}
                          {item.stream && <span>• {item.stream}</span>}
                          {item.term && <span>• {item.term}</span>}
                          {item.exam_year && <span>• {item.exam_year}</span>}
                        </div>
                      </div>

                      {/* Right: File Previews & Delete Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* Question Paper File Action */}
                        {item.file_url && (
                          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
                            <a
                              href={`/viewer?url=${encodeURIComponent(item.file_url)}&title=${encodeURIComponent(item.description || 'Document')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline cursor-pointer"
                              title="Preview Question Paper PDF"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Paper</span>
                            </a>
                            <button
                              onClick={() => handleDeleteData(item.id, 'file_url')}
                              disabled={isItemDeleting}
                              className="p-1 text-orange-400 hover:text-orange-300 hover:bg-orange-950/50 rounded transition-colors cursor-pointer disabled:opacity-50"
                              title="Delete Question Paper file from Cloudinary"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Solution File Action */}
                        {item.solution_url && (
                          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
                            <a
                              href={`/viewer?url=${encodeURIComponent(item.solution_url)}&title=${encodeURIComponent(item.description || 'Solution')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 hover:underline cursor-pointer"
                              title="Preview Solution PDF"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Solution</span>
                            </a>
                            <button
                              onClick={() => handleDeleteData(item.id, 'solution_url')}
                              disabled={isItemDeleting}
                              className="p-1 text-orange-400 hover:text-orange-300 hover:bg-orange-950/50 rounded transition-colors cursor-pointer disabled:opacity-50"
                              title="Delete Solution file from Cloudinary"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Delete Entire Document & All Files */}
                        <button
                          onClick={() => handleDeleteData(item.id)}
                          disabled={isItemDeleting}
                          className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isItemDeleting ? 'Deleting...' : 'Delete Material'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Non-Materials (Colleges, Subjects, Types, Years) Clean Card Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredDataList.map((item) => {
                  const isItemDeleting = isDeleting === item.id;
                  const collegeName = colleges.find(c => c.id === item.college_id)?.name || (item.college_id ? `College #${item.college_id}` : 'Global');

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {item.name || item.year_value || item.value || 'Unnamed Item'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {item.stream ? `${item.stream} • ` : ''}
                          {item.year ? `${item.year} • ` : ''}
                          {collegeName}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteData(item.id)}
                        disabled={isItemDeleting}
                        className="p-2 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white rounded-lg transition-all shrink-0 cursor-pointer disabled:opacity-50"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
      <PurgeDataModal
        isOpen={isPurgeModalOpen}
        onClose={() => setIsPurgeModalOpen(false)}
        onSuccess={() => {
          fetchDataList();
          fetchColleges();
          fetchSubjects(contentCollegeId);
        }}
      />
    </motion.div>
  );
};
