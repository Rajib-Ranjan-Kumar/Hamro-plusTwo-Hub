import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  UploadCloud,
  Search,
  Filter,
  Eye,
  Trash2,
  Archive,
  RotateCcw,
  Plus,
  Loader2,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  X,
  FileCheck,
  Link as LinkIcon,
  HelpCircle,
  Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  EducationalResourceItem,
  ResourceStatus,
  College,
  AcademicClass,
  AcademicStream,
  AcademicSubject,
  getEducationalResources,
  uploadEducationalResource,
  updateEducationalResource,
  toggleResourceStatus,
  deleteEducationalResourcePermanent,
  getAvailableQuestionPapers,
  getCollegesList,
  getClassesList,
  getStreamsList,
  getSubjectsList
} from '../../services/academicService';
import { SecurePDFViewer } from '../SecurePDFViewer';

export const EducationalContentManager: React.FC = () => {
  const { user } = useAuth();

  // Resource Data State
  const [resources, setResources] = useState<EducationalResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hierarchy Structure Data for Dropdowns
  const [colleges, setColleges] = useState<College[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [streams, setStreams] = useState<AcademicStream[]>([]);
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);

  // Filter Bar State
  const [filterCollegeId, setFilterCollegeId] = useState<string>('all');
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [filterStreamId, setFilterStreamId] = useState<string>('all');
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [filterContentType, setFilterContentType] = useState<string>('all');
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals State
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EducationalResourceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EducationalResourceItem | null>(null);

  // Upload Wizard State
  const [wizardCollegeId, setWizardCollegeId] = useState<string>('0');
  const [wizardClassId, setWizardClassId] = useState<string>('Class 11');
  const [wizardStreamId, setWizardStreamId] = useState<string>('Science');
  const [wizardSubjectId, setWizardSubjectId] = useState<string>('');
  const [wizardContentType, setWizardContentType] = useState<'notes' | 'syllabus' | 'pyq' | 'solution'>('notes');
  const [wizardTitle, setWizardTitle] = useState<string>('');
  const [wizardChapterName, setWizardChapterName] = useState<string>('');
  const [wizardAcademicYear, setWizardAcademicYear] = useState<string>('2081');
  const [wizardExamYear, setWizardExamYear] = useState<string>('2080');
  const [wizardExamName, setWizardExamName] = useState<string>('NEB Board Examination');
  const [wizardTerm, setWizardTerm] = useState<string>('Final Term');
  const [wizardDescription, setWizardDescription] = useState<string>('');
  const [wizardLinkedPyqId, setWizardLinkedPyqId] = useState<string>('');
  const [wizardFile, setWizardFile] = useState<File | null>(null);
  const [wizardStatus, setWizardStatus] = useState<ResourceStatus>('published');
  const [wizardAccessLevel, setWizardAccessLevel] = useState<'free' | 'premium'>('free');

  // Available PYQ Papers for Solution Linking
  const [availablePyqs, setAvailablePyqs] = useState<EducationalResourceItem[]>([]);

  // Progress and Toast State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Load Filter Hierarchy
  useEffect(() => {
    const fetchStructures = async () => {
      try {
        const [colList, clsList, strList, subList] = await Promise.all([
          getCollegesList(false),
          getClassesList('all', false),
          getStreamsList('all', 'all', false),
          getSubjectsList('all', 'all', 'all', false)
        ]);
        setColleges(colList);
        setClasses(clsList);
        setStreams(strList);
        setSubjects(subList);
      } catch (err) {
        console.warn('Failed to load structures for content manager:', err);
      }
    };
    fetchStructures();
  }, []);

  // Fetch Resources Function
  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const list = await getEducationalResources({
        collegeId: filterCollegeId,
        classId: filterClassId,
        streamId: filterStreamId,
        subjectId: filterSubjectId,
        contentType: filterContentType,
        academicYear: filterAcademicYear,
        status: filterStatus,
        search: searchQuery
      });
      setResources(list);
    } catch (err: any) {
      console.error('Failed to load resources:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [
    filterCollegeId,
    filterClassId,
    filterStreamId,
    filterSubjectId,
    filterContentType,
    filterAcademicYear,
    filterStatus,
    searchQuery
  ]);

  // When Wizard stream / subject changes and content type is 'solution', load available PYQs
  useEffect(() => {
    if (wizardContentType === 'solution') {
      const selectedSubjObj = subjects.find(s => s.id === wizardSubjectId);
      const subjName = selectedSubjObj?.name || wizardSubjectId;
      getAvailableQuestionPapers(wizardCollegeId, wizardClassId, wizardStreamId, subjName).then(papers => {
        setAvailablePyqs(papers);
        if (papers.length > 0 && !papers.find(p => p.id === wizardLinkedPyqId)) {
          setWizardLinkedPyqId(papers[0].id);
        }
      });
    }
  }, [wizardContentType, wizardCollegeId, wizardClassId, wizardStreamId, wizardSubjectId, subjects]);

  // Clear all filters handler
  const handleClearAllFilters = () => {
    setFilterCollegeId('all');
    setFilterClassId('all');
    setFilterStreamId('all');
    setFilterSubjectId('all');
    setFilterContentType('all');
    setFilterAcademicYear('all');
    setFilterStatus('all');
    setSearchQuery('');
  };

  const hasActiveFilters =
    filterCollegeId !== 'all' ||
    filterClassId !== 'all' ||
    filterStreamId !== 'all' ||
    filterSubjectId !== 'all' ||
    filterContentType !== 'all' ||
    filterAcademicYear !== 'all' ||
    filterStatus !== 'all' ||
    searchQuery.trim().length > 0;

  // Open Upload Modal
  const openUploadModal = () => {
    setErrorMessage('');
    setWizardCollegeId(filterCollegeId !== 'all' ? filterCollegeId : '0');
    setWizardClassId(filterClassId !== 'all' ? filterClassId : 'Class 11');
    setWizardStreamId(filterStreamId !== 'all' ? filterStreamId : 'Science');
    setWizardSubjectId(filterSubjectId !== 'all' ? filterSubjectId : '');
    setWizardContentType('notes');
    setWizardTitle('');
    setWizardChapterName('');
    setWizardAcademicYear('2081');
    setWizardExamYear('2080');
    setWizardExamName('NEB Board Examination');
    setWizardTerm('Final Term');
    setWizardDescription('');
    setWizardLinkedPyqId('');
    setWizardFile(null);
    setWizardStatus('published');
    setWizardAccessLevel('free');
    setIsUploadModalOpen(true);
  };

  // Submit Upload Wizard
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!wizardFile) {
      setErrorMessage('Please select a PDF document to upload.');
      return;
    }

    if (!wizardTitle.trim()) {
      setErrorMessage('Please enter a descriptive title for this resource.');
      return;
    }

    if (wizardContentType === 'solution' && !wizardLinkedPyqId) {
      setErrorMessage('A PYQ Solution must be explicitly linked to an existing question paper.');
      return;
    }

    setIsUploading(true);
    setUploadProgressMsg('Validating and requesting secure upload signature...');

    try {
      const selectedCollegeObj = colleges.find(c => c.id === wizardCollegeId);
      const selectedSubjObj = subjects.find(s => s.id === wizardSubjectId);
      const selectedPyqObj = availablePyqs.find(p => p.id === wizardLinkedPyqId);

      const collegeName = selectedCollegeObj?.name || 'Global Universal';
      const subjName = selectedSubjObj?.name || wizardSubjectId || 'General';

      setUploadProgressMsg('Uploading PDF to Cloudinary under academic hierarchy folder...');

      await uploadEducationalResource(
        {
          college_id: wizardCollegeId === '0' ? null : wizardCollegeId,
          college_name: collegeName,
          class_id: wizardClassId,
          class_level: wizardClassId,
          stream_id: wizardStreamId,
          stream: wizardStreamId,
          subject_id: wizardSubjectId || null,
          subject: subjName,
          resource_type: wizardContentType,
          title: wizardTitle.trim(),
          chapter_name: wizardContentType === 'notes' ? wizardChapterName.trim() : undefined,
          academic_year: wizardAcademicYear,
          exam_year: wizardContentType === 'pyq' ? wizardExamYear : undefined,
          examination_name: wizardContentType === 'pyq' ? wizardExamName : undefined,
          term: (wizardContentType === 'pyq' || wizardContentType === 'solution') ? wizardTerm : undefined,
          description: wizardDescription.trim(),
          access_level: wizardAccessLevel,
          status: wizardStatus,
          linked_question_paper_id: wizardContentType === 'solution' ? wizardLinkedPyqId : undefined,
          linked_question_paper_title: wizardContentType === 'solution' ? selectedPyqObj?.title : undefined
        },
        wizardFile,
        user
      );

      setToast({ message: `Successfully published "${wizardTitle}"!`, type: 'success' });
      setIsUploadModalOpen(false);
      await fetchResources();
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMessage(err.message || 'Failed to upload educational resource.');
    } finally {
      setIsUploading(false);
      setUploadProgressMsg('');
    }
  };

  // Open Edit Modal
  const openEditModal = (item: EducationalResourceItem) => {
    setEditingItem(item);
    setErrorMessage('');
    setIsEditModalOpen(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsUploading(true);
    setUploadProgressMsg('Updating resource metadata...');
    try {
      await updateEducationalResource(editingItem.id, {
        title: editingItem.title,
        chapter_name: editingItem.chapter_name,
        academic_year: editingItem.academic_year,
        exam_year: editingItem.exam_year,
        examination_name: editingItem.examination_name,
        description: editingItem.description,
        status: editingItem.status,
        access_level: editingItem.access_level
      });

      setToast({ message: 'Resource metadata updated successfully!', type: 'success' });
      setIsEditModalOpen(false);
      setEditingItem(null);
      await fetchResources();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update resource.');
    } finally {
      setIsUploading(false);
      setUploadProgressMsg('');
    }
  };

  // Toggle Archive / Publish
  const handleToggleStatus = async (item: EducationalResourceItem) => {
    const nextStatus: ResourceStatus = item.status === 'archived' ? 'published' : 'archived';
    try {
      await toggleResourceStatus(item.id, nextStatus);
      setToast({ message: `Resource marked as ${nextStatus}.`, type: 'success' });
      await fetchResources();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to update status', type: 'error' });
    }
  };

  // Permanent Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsUploading(true);
    try {
      await deleteEducationalResourcePermanent(deleteTarget.id);
      setToast({ message: `Permanently removed "${deleteTarget.title}".`, type: 'success' });
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      await fetchResources();
    } catch (err: any) {
      setToast({ message: err.message || 'Deletion failed', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  // Available Subjects in Wizard filtered by class & stream
  const availableWizardSubjects = subjects.filter(s => {
    const matchClass = !wizardClassId || s.year === wizardClassId || s.class_name === wizardClassId;
    const matchStream = !wizardStreamId || s.stream?.toLowerCase() === wizardStreamId.toLowerCase() || s.stream_name?.toLowerCase() === wizardStreamId.toLowerCase();
    return matchClass && matchStream;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827] border border-white/5 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#F4B400] tracking-wider uppercase mb-1">
            <BookOpen className="w-4 h-4" /> Multi-Type Resource Hub
          </div>
          <h1 className="text-2xl font-bold text-white">Educational Content Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage, upload, preview, and organize Notes, Syllabus, PYQs, and linked PYQ Solutions.
          </p>
        </div>

        <button
          onClick={openUploadModal}
          className="px-4 py-2.5 bg-[#F4B400] hover:bg-[#F5C21B] text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow cursor-pointer whitespace-nowrap self-start md:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Educational Resource</span>
        </button>
      </div>

      {/* Advanced Cascading Filter Bar */}
      <div className="bg-[#111827] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-4">
        {/* Top Search & Actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by title, subject, chapter name, examination, or year..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50 placeholder-slate-500"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearAllFilters}
              className="px-3.5 py-2 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-800/40 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>

        {/* 7 Cascading Filter Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 pt-2 border-t border-slate-800/60 text-xs">
          {/* 1. College */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">College</label>
            <select
              value={filterCollegeId}
              onChange={e => setFilterCollegeId(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#F4B400]"
            >
              <option value="all">All Colleges</option>
              {colleges.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* 2. Class */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Class</label>
            <select
              value={filterClassId}
              onChange={e => setFilterClassId(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#F4B400]"
            >
              <option value="all">All Classes</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
          </div>

          {/* 3. Stream */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Stream</label>
            <select
              value={filterStreamId}
              onChange={e => setFilterStreamId(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#F4B400]"
            >
              <option value="all">All Streams</option>
              <option value="Science">Science</option>
              <option value="Management">Management</option>
              <option value="Humanities">Humanities</option>
            </select>
          </div>

          {/* 4. Subject */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Subject</label>
            <select
              value={filterSubjectId}
              onChange={e => setFilterSubjectId(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#F4B400]"
            >
              <option value="all">All Subjects</option>
              {subjects
                .filter(s => {
                  const matchCls = filterClassId === 'all' || s.year === filterClassId;
                  const matchStr = filterStreamId === 'all' || s.stream?.toLowerCase() === filterStreamId.toLowerCase();
                  return matchCls && matchStr;
                })
                .map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.year || 'All'})</option>
                ))}
            </select>
          </div>

          {/* 5. Content Type */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Content Type</label>
            <select
              value={filterContentType}
              onChange={e => setFilterContentType(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#F4B400]"
            >
              <option value="all">All Types</option>
              <option value="notes">Notes</option>
              <option value="syllabus">Syllabus</option>
              <option value="pyq">PYQs (Question Papers)</option>
              <option value="solution">PYQ Solutions</option>
            </select>
          </div>

          {/* 6. Academic Year */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Academic Year</label>
            <select
              value={filterAcademicYear}
              onChange={e => setFilterAcademicYear(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#F4B400]"
            >
              <option value="all">All Years</option>
              {['2081', '2080', '2079', '2078', '2026', '2025', '2024', '2023', '2022'].map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          {/* 7. Status */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#F4B400]"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published (All Students)</option>
              <option value="premium_only">Visible to Premium Students Only</option>
              <option value="draft">Draft (Admin Only)</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resource Table */}
      <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#F4B400]" />
            <p className="text-sm text-slate-400">Loading educational resources...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Resource Title</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Hierarchy (Class / Stream)</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Year / Term</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {resources.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-14 text-center text-slate-500">
                      No educational resources found matching the specified filters.
                    </td>
                  </tr>
                ) : (
                  resources.map(res => (
                    <tr key={res.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2.5">
                          <FileText className="w-4 h-4 text-[#F4B400] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-white line-clamp-1">{res.title}</span>
                            {res.chapter_name && (
                              <p className="text-xs text-[#F4B400]/80">Ch: {res.chapter_name}</p>
                            )}
                            {res.linked_question_paper_title && (
                              <p className="text-xs text-blue-400 flex items-center gap-1 mt-0.5">
                                <LinkIcon className="w-3 h-3" /> Linked to: {res.linked_question_paper_title}
                              </p>
                            )}
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {res.college_name || 'Global'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            res.resource_type === 'notes' || res.resource_type === 'note'
                              ? 'bg-blue-900/30 text-blue-300 border border-blue-800/40'
                              : res.resource_type === 'syllabus'
                              ? 'bg-purple-900/30 text-purple-300 border border-purple-800/40'
                              : res.resource_type === 'solution'
                              ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-800/40'
                              : 'bg-amber-900/30 text-amber-300 border border-amber-800/40'
                          }`}
                        >
                          {res.resource_type === 'pyq' || res.resource_type === 'question_paper'
                            ? 'PYQ Paper'
                            : res.resource_type === 'solution'
                            ? 'PYQ Solution'
                            : res.resource_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="font-medium text-slate-200">{res.class_level}</span>
                        <span className="text-slate-500 mx-1.5">•</span>
                        <span className="text-purple-300">{res.stream}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-200">
                        {res.subject || 'General'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        <div>{res.academic_year || res.exam_year || '—'}</div>
                        {res.term && <div className="text-[11px] text-slate-500">{res.term}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            res.status === 'published'
                              ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40'
                              : res.status === 'premium_only'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : res.status === 'archived'
                              ? 'bg-rose-900/30 text-rose-400 border border-rose-800/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {res.status === 'premium_only' ? 'Premium Only' : res.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview PDF */}
                          {res.cloudinary_secure_url && (
                            <button
                              onClick={() => {
                                setPreviewPdfUrl(res.cloudinary_secure_url);
                                setPreviewTitle(res.title);
                              }}
                              title="Preview Document"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit Metadata */}
                          <button
                            onClick={() => openEditModal(res)}
                            title="Edit Resource"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Archive / Restore */}
                          <button
                            onClick={() => handleToggleStatus(res)}
                            title={res.status === 'archived' ? 'Restore Resource' : 'Archive Resource'}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                          >
                            {res.status === 'archived' ? (
                              <RotateCcw className="w-3.5 h-3.5" />
                            ) : (
                              <Archive className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Delete Resource */}
                          <button
                            onClick={() => {
                              setDeleteTarget(res);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Delete Resource Permanently"
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 transition-colors cursor-pointer border border-rose-900/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PDF Document Preview Modal */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0b0f17] border border-white/10 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#F4B400]" />
                <h3 className="font-bold text-white text-sm sm:text-base line-clamp-1">{previewTitle}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Raw</span>
                </a>
                <button
                  onClick={() => setPreviewPdfUrl(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full h-full bg-slate-950 p-2 overflow-hidden">
              <SecurePDFViewer url={previewPdfUrl} title={previewTitle} />
            </div>
          </div>
        </div>
      )}

      {/* Upload Educational Resource Wizard Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl backdrop-blur-xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white">
                <UploadCloud className="w-5 h-5 text-[#F4B400]" />
                <h2 className="text-lg font-bold">Upload Educational Resource</h2>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Step 1 & 2: College and Class */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    College Scope <span className="text-slate-500">(Optional)</span>
                  </label>
                  <select
                    value={wizardCollegeId}
                    onChange={e => setWizardCollegeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50"
                  >
                    <option value="0">Global (Universal / All Colleges)</option>
                    {colleges.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Class Level <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={wizardClassId}
                    onChange={e => setWizardClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50"
                  >
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>
              </div>

              {/* Step 3 & 4: Stream and Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Stream <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={wizardStreamId}
                    onChange={e => {
                      setWizardStreamId(e.target.value);
                      setWizardSubjectId('');
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50"
                  >
                    <option value="Science">Science</option>
                    <option value="Management">Management</option>
                    <option value="Humanities">Humanities</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Subject <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={wizardSubjectId}
                    onChange={e => setWizardSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50"
                  >
                    <option value="">Select Subject</option>
                    {availableWizardSubjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 5: Content Type Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Content Type <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'notes', label: 'Notes' },
                    { id: 'syllabus', label: 'Syllabus' },
                    { id: 'pyq', label: 'PYQ Paper' },
                    { id: 'solution', label: 'PYQ Solution' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setWizardContentType(t.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        wizardContentType === t.id
                          ? 'bg-[#F4B400] text-slate-950 border-[#F4B400] shadow'
                          : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 6: Conditional Fields based on Content Type */}
              {/* If Notes */}
              {wizardContentType === 'notes' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Chapter Name / Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chapter 1: Units and Measurements"
                      value={wizardChapterName}
                      onChange={e => setWizardChapterName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#F4B400]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Academic Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2081"
                      value={wizardAcademicYear}
                      onChange={e => setWizardAcademicYear(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#F4B400]"
                    />
                  </div>
                </div>
              )}

              {/* If Syllabus */}
              {wizardContentType === 'syllabus' && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Curriculum / Academic Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2081 Revised NEB Curriculum"
                    value={wizardAcademicYear}
                    onChange={e => setWizardAcademicYear(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#F4B400]"
                  />
                </div>
              )}

              {/* If PYQ (Question Paper) */}
              {wizardContentType === 'pyq' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Examination Name</label>
                    <input
                      type="text"
                      placeholder="e.g. NEB Board Exam"
                      value={wizardExamName}
                      onChange={e => setWizardExamName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#F4B400]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Exam Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2080 or 2079"
                      value={wizardExamYear}
                      onChange={e => setWizardExamYear(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#F4B400]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Term</label>
                    <select
                      value={wizardTerm}
                      onChange={e => setWizardTerm(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#F4B400]"
                    >
                      <option value="Final Term">Final Term</option>
                      <option value="1st Term">1st Term</option>
                      <option value="2nd Term">2nd Term</option>
                      <option value="Pre-Board">Pre-Board</option>
                    </select>
                  </div>
                </div>
              )}

              {/* If PYQ Solution (Must link to an existing question paper) */}
              {wizardContentType === 'solution' && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-blue-900/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                    <LinkIcon className="w-4 h-4" />
                    <span>Link Solution to Question Paper (Required)</span>
                  </div>
                  {availablePyqs.length === 0 ? (
                    <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded-lg text-rose-300 text-xs">
                      No question papers found for the selected Subject and Stream. Please upload a question paper first or select a different subject.
                    </div>
                  ) : (
                    <div>
                      <select
                        required
                        value={wizardLinkedPyqId}
                        onChange={e => setWizardLinkedPyqId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="">Select Target Question Paper...</option>
                        {availablePyqs.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({p.exam_year || p.academic_year || 'Year N/A'}) - {p.term || 'Final'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Title & Description */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Resource Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics Complete Notes 2081, 2079 Final Question Paper"
                  value={wizardTitle}
                  onChange={e => setWizardTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Provide context, topics covered, or instructions for students..."
                  value={wizardDescription}
                  onChange={e => setWizardDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50 resize-none"
                />
              </div>

              {/* File Attachment & Publication Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Upload PDF File <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="file"
                    required
                    accept=".pdf,application/pdf"
                    onChange={e => setWizardFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F4B400] file:text-slate-950 hover:file:bg-[#F5C21B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Publication Status</label>
                  <select
                    value={wizardStatus}
                    onChange={e => setWizardStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50"
                  >
                    <option value="published">Published (Visible to all students)</option>
                    <option value="premium_only">Visible to Premium Students Only</option>
                    <option value="draft">Draft (Admin only)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Upload Progress Indicator */}
              {isUploading && (
                <div className="p-3 bg-slate-950/80 rounded-xl border border-[#F4B400]/30 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-[#F4B400] font-semibold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{uploadProgressMsg || 'Uploading asset...'}</span>
                  </div>
                </div>
              )}

              {/* Wizard Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2.5 bg-[#F4B400] hover:bg-[#F5C21B] text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center gap-2 shadow cursor-pointer disabled:opacity-50"
                >
                  {isUploading && <Loader2 className="w-4 h-4 animate-spin text-slate-950" />}
                  <span>Publish Document</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#F4B400]" />
                Edit Resource Metadata
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editingItem.title}
                  onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50"
                />
              </div>

              {editingItem.resource_type === 'notes' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Chapter Name</label>
                  <input
                    type="text"
                    value={editingItem.chapter_name || ''}
                    onChange={e => setEditingItem({ ...editingItem, chapter_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={editingItem.academic_year || ''}
                    onChange={e => setEditingItem({ ...editingItem, academic_year: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Status</label>
                  <select
                    value={editingItem.status}
                    onChange={e => setEditingItem({ ...editingItem, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50"
                  >
                    <option value="published">Published (Visible to all students)</option>
                    <option value="premium_only">Visible to Premium Students Only</option>
                    <option value="draft">Draft (Admin only)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingItem.description || ''}
                  onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2.5 bg-[#F4B400] hover:bg-[#F5C21B] text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center gap-2 shadow cursor-pointer disabled:opacity-50"
                >
                  {isUploading && <Loader2 className="w-4 h-4 animate-spin text-slate-950" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permanent Delete Modal */}
      {isDeleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900/95 border border-rose-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-950/60 rounded-xl border border-rose-800/50">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Permanently Delete Document?</h3>
                <p className="text-xs text-rose-300">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-300">
              Are you sure you want to delete <span className="font-semibold text-white">"{deleteTarget.title}"</span>? The PDF file will be permanently removed from Cloudinary storage and the database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isUploading}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 shadow cursor-pointer disabled:opacity-50"
              >
                {isUploading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                <span>Confirm Permanent Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
