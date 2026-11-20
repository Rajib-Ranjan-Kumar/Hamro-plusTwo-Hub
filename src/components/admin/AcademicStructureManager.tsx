import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Layers,
  BookOpen,
  FolderTree,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Archive,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  X,
  Loader2,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  College,
  AcademicClass,
  AcademicStream,
  AcademicSubject,
  DependencyCount,
  ItemStatus,
  getCollegesList,
  createCollege,
  updateCollege,
  toggleCollegeStatus,
  getCollegeDependencies,
  deleteCollegePermanent,
  getClassesList,
  createClass,
  updateClass,
  toggleClassStatus,
  getClassDependencies,
  deleteClassPermanent,
  getStreamsList,
  createStream,
  updateStream,
  toggleStreamStatus,
  getStreamDependencies,
  deleteStreamPermanent,
  getSubjectsList,
  createSubject,
  updateSubject,
  toggleSubjectStatus,
  getSubjectDependencies,
  deleteSubjectPermanent
} from '../../services/academicService';

export type StructureTab = 'colleges' | 'classes' | 'streams' | 'subjects';

interface AcademicStructureManagerProps {
  initialTab?: StructureTab;
}

export const AcademicStructureManager: React.FC<AcademicStructureManagerProps> = ({
  initialTab = 'colleges'
}) => {
  const [activeTab, setActiveTab] = useState<StructureTab>(initialTab);

  // Datasets
  const [colleges, setColleges] = useState<College[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [streams, setStreams] = useState<AcademicStream[]>([]);
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cascading Filter Selections for Tables
  const [filterCollegeId, setFilterCollegeId] = useState<string>('all');
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [filterStreamId, setFilterStreamId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('all');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formCollegeId, setFormCollegeId] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formStreamId, setFormStreamId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Delete & Dependency Check Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    type: StructureTab;
    name: string;
    dependencies?: DependencyCount;
  } | null>(null);
  const [isCheckingDeps, setIsCheckingDeps] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Notification Toast auto-dismiss
  useEffect(() => {
    if (feedbackToast) {
      const timer = setTimeout(() => setFeedbackToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedbackToast]);

  // Synchronize when initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Refresh All Data
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [colList, clsList, strList, subList] = await Promise.all([
        getCollegesList(true),
        getClassesList('all', true),
        getStreamsList('all', 'all', true),
        getSubjectsList('all', 'all', 'all', true)
      ]);
      setColleges(colList);
      setClasses(clsList);
      setStreams(strList);
      setSubjects(subList);
    } catch (err: any) {
      console.error('Failed to load academic structure:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // When Parent filter changes, reset downstream filters
  const handleCollegeFilterChange = (cId: string) => {
    setFilterCollegeId(cId);
    setFilterClassId('all');
    setFilterStreamId('all');
  };

  const handleClassFilterChange = (clsId: string) => {
    setFilterClassId(clsId);
    setFilterStreamId('all');
  };

  // Open Add Modal
  const openAddModal = () => {
    setModalMode('add');
    setEditingItem(null);
    setModalError('');
    setFormCollegeId(filterCollegeId !== 'all' ? filterCollegeId : '');
    setFormClassId(filterClassId !== 'all' ? filterClassId : '');
    setFormStreamId(filterStreamId !== 'all' ? filterStreamId : '');
    setFormName('');
    setFormCode('');
    setFormLocation('');
    setFormDescription('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: any) => {
    setModalMode('edit');
    setEditingItem(item);
    setModalError('');
    setFormCollegeId(item.college_id || '');
    setFormClassId(item.class_id || '');
    setFormStreamId(item.stream_id || '');
    setFormName(item.name || item.class_name || item.stream_name || '');
    setFormCode(item.code || item.class_number || item.subject_code || '');
    setFormLocation(item.location || item.address || '');
    setFormDescription(item.description || '');
    setIsModalOpen(true);
  };

  // Handle Form Submission
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);

    try {
      const selectedCollege = colleges.find(c => c.id === formCollegeId);
      const selectedClass = classes.find(c => c.id === formClassId);
      const selectedStream = streams.find(s => s.id === formStreamId);

      if (activeTab === 'colleges') {
        if (!formName.trim()) throw new Error('College name is required.');
        if (modalMode === 'add') {
          await createCollege({
            name: formName,
            code: formCode,
            location: formLocation,
            description: formDescription
          });
          setFeedbackToast({ message: `College "${formName}" created successfully!`, type: 'success' });
        } else {
          await updateCollege(editingItem.id, {
            name: formName,
            code: formCode,
            location: formLocation,
            address: formLocation,
            description: formDescription
          });
          setFeedbackToast({ message: `College "${formName}" updated successfully!`, type: 'success' });
        }
      } else if (activeTab === 'classes') {
        if (!formName.trim()) throw new Error('Class name is required (e.g. Class 11).');
        if (modalMode === 'add') {
          await createClass({
            college_id: formCollegeId || null,
            college_name: selectedCollege?.name || '',
            class_name: formName,
            class_number: formCode,
            description: formDescription
          });
          setFeedbackToast({ message: `Class "${formName}" added successfully!`, type: 'success' });
        } else {
          await updateClass(editingItem.id, {
            college_id: formCollegeId || null,
            college_name: selectedCollege?.name || '',
            class_name: formName,
            class_number: formCode,
            description: formDescription
          });
          setFeedbackToast({ message: `Class "${formName}" updated successfully!`, type: 'success' });
        }
      } else if (activeTab === 'streams') {
        if (!formName.trim()) throw new Error('Stream name is required (e.g. Science).');
        if (modalMode === 'add') {
          await createStream({
            college_id: formCollegeId || null,
            college_name: selectedCollege?.name || '',
            class_id: formClassId || null,
            class_name: selectedClass?.class_name || '',
            stream_name: formName,
            description: formDescription
          });
          setFeedbackToast({ message: `Stream "${formName}" added successfully!`, type: 'success' });
        } else {
          await updateStream(editingItem.id, {
            college_id: formCollegeId || null,
            college_name: selectedCollege?.name || '',
            class_id: formClassId || null,
            class_name: selectedClass?.class_name || '',
            stream_name: formName,
            description: formDescription
          });
          setFeedbackToast({ message: `Stream "${formName}" updated successfully!`, type: 'success' });
        }
      } else if (activeTab === 'subjects') {
        if (!formName.trim()) throw new Error('Subject name is required.');
        const yearVal = selectedClass?.class_name || formClassId || 'Class 11';
        const streamVal = selectedStream?.stream_name || formStreamId || 'Science';

        if (modalMode === 'add') {
          await createSubject({
            college_id: formCollegeId || null,
            college_name: selectedCollege?.name || '',
            class_id: formClassId || null,
            class_name: yearVal,
            stream_id: formStreamId || null,
            stream_name: streamVal,
            name: formName,
            subject_code: formCode,
            description: formDescription,
            year: yearVal,
            stream: streamVal
          });
          setFeedbackToast({ message: `Subject "${formName}" added successfully!`, type: 'success' });
        } else {
          await updateSubject(editingItem.id, {
            college_id: formCollegeId || null,
            college_name: selectedCollege?.name || '',
            class_id: formClassId || null,
            class_name: yearVal,
            stream_id: formStreamId || null,
            stream_name: streamVal,
            name: formName,
            subject_code: formCode,
            description: formDescription,
            year: yearVal,
            stream: streamVal
          });
          setFeedbackToast({ message: `Subject "${formName}" updated successfully!`, type: 'success' });
        }
      }

      setIsModalOpen(false);
      await refreshData();
    } catch (err: any) {
      setModalError(err.message || 'Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Archive Status
  const handleToggleStatus = async (item: any, type: StructureTab) => {
    const newStatus: ItemStatus = item.status === 'archived' ? 'active' : 'archived';
    try {
      if (type === 'colleges') await toggleCollegeStatus(item.id, newStatus);
      else if (type === 'classes') await toggleClassStatus(item.id, newStatus);
      else if (type === 'streams') await toggleStreamStatus(item.id, newStatus);
      else if (type === 'subjects') await toggleSubjectStatus(item.id, newStatus);

      setFeedbackToast({
        message: `${item.name || item.class_name || item.stream_name} marked as ${newStatus}.`,
        type: 'success'
      });
      await refreshData();
    } catch (err: any) {
      setFeedbackToast({ message: err.message || 'Failed to update status', type: 'error' });
    }
  };

  // Open Safe Delete with Dependency Checking
  const handleInitiateDelete = async (item: any, type: StructureTab) => {
    setIsCheckingDeps(true);
    setDeleteTarget({
      id: item.id,
      type,
      name: item.name || item.class_name || item.stream_name || 'Item'
    });
    setIsDeleteModalOpen(true);

    try {
      let deps: DependencyCount = { classes: 0, streams: 0, subjects: 0, resources: 0 };
      if (type === 'colleges') {
        deps = await getCollegeDependencies(item.id);
      } else if (type === 'classes') {
        deps = await getClassDependencies(item.id, item.class_name);
      } else if (type === 'streams') {
        deps = await getStreamDependencies(item.id, item.stream_name);
      } else if (type === 'subjects') {
        deps = await getSubjectDependencies(item.id, item.name);
      }

      setDeleteTarget(prev => (prev ? { ...prev, dependencies: deps } : null));
    } catch (err) {
      console.warn('Failed to inspect dependencies:', err);
    } finally {
      setIsCheckingDeps(false);
    }
  };

  // Perform Permanent Delete
  const handleConfirmPermanentDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'colleges') {
        await deleteCollegePermanent(deleteTarget.id);
      } else if (deleteTarget.type === 'classes') {
        await deleteClassPermanent(deleteTarget.id);
      } else if (deleteTarget.type === 'streams') {
        await deleteStreamPermanent(deleteTarget.id);
      } else if (deleteTarget.type === 'subjects') {
        await deleteSubjectPermanent(deleteTarget.id);
      }

      setFeedbackToast({
        message: `Permanently deleted "${deleteTarget.name}".`,
        type: 'success'
      });
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      await refreshData();
    } catch (err: any) {
      setFeedbackToast({ message: err.message || 'Deletion failed', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Lists for Each Tab
  const filteredColleges = colleges.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (c.code && c.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (c.location && c.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const filteredClasses = classes.filter(cls => {
    const matchCollege = filterCollegeId === 'all' || !cls.college_id || cls.college_id === filterCollegeId;
    const matchSearch = cls.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (cls.class_number && cls.class_number.includes(searchQuery));
    const matchStatus = filterStatus === 'all' || cls.status === filterStatus;
    return matchCollege && matchSearch && matchStatus;
  });

  const filteredStreams = streams.filter(str => {
    const matchCollege = filterCollegeId === 'all' || !str.college_id || str.college_id === filterCollegeId;
    const matchClass = filterClassId === 'all' || !str.class_id || str.class_id === filterClassId;
    const matchSearch = str.stream_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || str.status === filterStatus;
    return matchCollege && matchClass && matchSearch && matchStatus;
  });

  const filteredSubjects = subjects.filter(sub => {
    const matchCollege = filterCollegeId === 'all' || !sub.college_id || sub.college_id === filterCollegeId;
    const matchClass = filterClassId === 'all' || sub.class_id === filterClassId || sub.year === filterClassId;
    const matchStream = filterStreamId === 'all' || sub.stream_id === filterStreamId || sub.stream?.toLowerCase() === filterStreamId.toLowerCase();
    const matchSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (sub.subject_code && sub.subject_code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchCollege && matchClass && matchStream && matchSearch && matchStatus;
  });

  // Calculate total dependencies to show warning in delete modal
  const totalDeps = deleteTarget?.dependencies
    ? (deleteTarget.dependencies.classes || 0) +
      (deleteTarget.dependencies.streams || 0) +
      (deleteTarget.dependencies.subjects || 0) +
      (deleteTarget.dependencies.resources || 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedbackToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 transition-all ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}
        >
          {feedbackToast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{feedbackToast.message}</span>
        </div>
      )}

      {/* Header and Hierarchy Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827] border border-white/5 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#F4B400] tracking-wider uppercase mb-1">
            <FolderTree className="w-4 h-4" /> Academic Hierarchy Structure
          </div>
          <h1 className="text-2xl font-bold text-white">Academic Structure Manager</h1>
          <p className="text-sm text-slate-400 mt-1">
            Dynamically configure Colleges, Classes, Streams, and Subjects without hardcoding.
          </p>
        </div>

        {/* Global Hierarchy Visual Pill */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300">
          <span className="font-semibold text-emerald-400">College</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold text-blue-400">Class</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold text-purple-400">Stream</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold text-amber-400">Subject</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-3">
        {[
          { id: 'colleges', label: 'Colleges', icon: GraduationCap, count: colleges.length },
          { id: 'classes', label: 'Classes', icon: BookOpen, count: classes.length },
          { id: 'streams', label: 'Streams', icon: Layers, count: streams.length },
          { id: 'subjects', label: 'Subjects', icon: FolderTree, count: subjects.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as StructureTab);
                setSearchQuery('');
              }}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#F4B400] text-slate-950 font-bold shadow-md'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ml-1 ${
                  isActive ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cascading Filter & Search Bar */}
      <div className="bg-[#111827] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50 placeholder-slate-500"
            />
          </div>

          {/* Add Item Button */}
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-[#F4B400] hover:bg-[#F5C21B] text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>
              Add {activeTab === 'colleges' ? 'College' : activeTab === 'classes' ? 'Class' : activeTab === 'streams' ? 'Stream' : 'Subject'}
            </span>
          </button>
        </div>

        {/* Cascading Filter Selectors (Dependent on Active Tab) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800/60 text-xs">
          {/* College Filter (Applicable for Classes, Streams, Subjects) */}
          {activeTab !== 'colleges' && (
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Filter by College</label>
              <select
                value={filterCollegeId}
                onChange={e => handleCollegeFilterChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#F4B400]"
              >
                <option value="all">All Colleges / Universal</option>
                {colleges.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Class Filter (Applicable for Streams, Subjects) */}
          {(activeTab === 'streams' || activeTab === 'subjects') && (
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Filter by Class</label>
              <select
                value={filterClassId}
                onChange={e => handleClassFilterChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#F4B400]"
              >
                <option value="all">All Classes</option>
                {classes
                  .filter(cls => filterCollegeId === 'all' || !cls.college_id || cls.college_id === filterCollegeId)
                  .map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                  ))}
              </select>
            </div>
          )}

          {/* Stream Filter (Applicable for Subjects) */}
          {activeTab === 'subjects' && (
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Filter by Stream</label>
              <select
                value={filterStreamId}
                onChange={e => setFilterStreamId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#F4B400]"
              >
                <option value="all">All Streams</option>
                {streams
                  .filter(s => {
                    const matchCol = filterCollegeId === 'all' || !s.college_id || s.college_id === filterCollegeId;
                    const matchCls = filterClassId === 'all' || !s.class_id || s.class_id === filterClassId;
                    return matchCol && matchCls;
                  })
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.stream_name}</option>
                  ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#F4B400]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="archived">Archived Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Data Content */}
      <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#F4B400]" />
            <p className="text-sm text-slate-400">Loading academic structures...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* 1. Colleges Table */}
            {activeTab === 'colleges' && (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">College Name</th>
                    <th className="px-6 py-4">Code / Short</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredColleges.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        No colleges found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredColleges.map(c => (
                      <tr key={c.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-white">{c.name}</span>
                          {c.description && (
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{c.description}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">
                          {c.code || '—'}
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {c.location || '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              c.status === 'archived'
                                ? 'bg-amber-900/30 text-amber-400 border border-amber-800/40'
                                : 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(c)}
                              title="Edit College"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(c, 'colleges')}
                              title={c.status === 'archived' ? 'Restore College' : 'Archive College'}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                            >
                              {c.status === 'archived' ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleInitiateDelete(c, 'colleges')}
                              title="Delete College"
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
            )}

            {/* 2. Classes Table */}
            {activeTab === 'classes' && (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Class Name</th>
                    <th className="px-6 py-4">Class Number</th>
                    <th className="px-6 py-4">College Scope</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredClasses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        No classes found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredClasses.map(cls => (
                      <tr key={cls.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">
                          {cls.class_name}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-400">
                          {cls.class_number || '—'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {cls.college_name || (cls.college_id ? 'Specific College' : 'Global (All Colleges)')}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              cls.status === 'archived'
                                ? 'bg-amber-900/30 text-amber-400 border border-amber-800/40'
                                : 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40'
                            }`}
                          >
                            {cls.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(cls)}
                              title="Edit Class"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(cls, 'classes')}
                              title={cls.status === 'archived' ? 'Restore Class' : 'Archive Class'}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                            >
                              {cls.status === 'archived' ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleInitiateDelete(cls, 'classes')}
                              title="Delete Class"
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
            )}

            {/* 3. Streams Table */}
            {activeTab === 'streams' && (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Stream Name</th>
                    <th className="px-6 py-4">Assigned Class</th>
                    <th className="px-6 py-4">College Scope</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStreams.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        No streams found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStreams.map(str => (
                      <tr key={str.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">
                          {str.stream_name}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {str.class_name || (str.class_id ? 'Specific Class' : 'All Classes')}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {str.college_name || (str.college_id ? 'Specific College' : 'Global')}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              str.status === 'archived'
                                ? 'bg-amber-900/30 text-amber-400 border border-amber-800/40'
                                : 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40'
                            }`}
                          >
                            {str.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(str)}
                              title="Edit Stream"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(str, 'streams')}
                              title={str.status === 'archived' ? 'Restore Stream' : 'Archive Stream'}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                            >
                              {str.status === 'archived' ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleInitiateDelete(str, 'streams')}
                              title="Delete Stream"
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
            )}

            {/* 4. Subjects Table */}
            {activeTab === 'subjects' && (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Subject Name</th>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Class</th>
                    <th className="px-6 py-4">Stream</th>
                    <th className="px-6 py-4">College Scope</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSubjects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        No subjects found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSubjects.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-white">{sub.name}</span>
                          {sub.description && (
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{sub.description}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">
                          {sub.subject_code || '—'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-300">
                          {sub.year || sub.class_name || 'Class 11'}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-purple-900/20 text-purple-300 border border-purple-800/30">
                            {sub.stream || sub.stream_name || 'Science'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {sub.college_name || (sub.college_id ? 'Specific College' : 'Global')}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              sub.status === 'archived'
                                ? 'bg-amber-900/30 text-amber-400 border border-amber-800/40'
                                : 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(sub)}
                              title="Edit Subject"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(sub, 'subjects')}
                              title={sub.status === 'archived' ? 'Restore Subject' : 'Archive Subject'}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                            >
                              {sub.status === 'archived' ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleInitiateDelete(sub, 'subjects')}
                              title="Delete Subject"
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
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#F4B400]" />
                {modalMode === 'add' ? 'Add' : 'Edit'}{' '}
                {activeTab === 'colleges' ? 'College' : activeTab === 'classes' ? 'Class' : activeTab === 'streams' ? 'Stream' : 'Subject'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* College Dropdown for Class, Stream, Subject */}
              {activeTab !== 'colleges' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    College Scope
                  </label>
                  <select
                    value={formCollegeId}
                    onChange={e => {
                      setFormCollegeId(e.target.value);
                      setFormClassId('');
                      setFormStreamId('');
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50"
                  >
                    <option value="">Global (All Colleges)</option>
                    {colleges.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Class Dropdown for Stream, Subject */}
              {(activeTab === 'streams' || activeTab === 'subjects') && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Class Level <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={formClassId}
                    onChange={e => {
                      setFormClassId(e.target.value);
                      setFormStreamId('');
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50"
                  >
                    <option value="">Select Class</option>
                    {classes
                      .filter(cls => !formCollegeId || !cls.college_id || cls.college_id === formCollegeId)
                      .map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                      ))}
                  </select>
                </div>
              )}

              {/* Stream Dropdown for Subject */}
              {activeTab === 'subjects' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Stream <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={formStreamId}
                    onChange={e => setFormStreamId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50"
                  >
                    <option value="">Select Stream</option>
                    {streams
                      .filter(s => {
                        const matchCol = !formCollegeId || !s.college_id || s.college_id === formCollegeId;
                        const matchCls = !formClassId || !s.class_id || s.class_id === formClassId;
                        return matchCol && matchCls;
                      })
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.stream_name}</option>
                      ))}
                  </select>
                </div>
              )}

              {/* Name Field */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {activeTab === 'colleges'
                    ? 'College Name'
                    : activeTab === 'classes'
                    ? 'Class Name (e.g. Class 11)'
                    : activeTab === 'streams'
                    ? 'Stream Name (e.g. Science)'
                    : 'Subject Name (e.g. Physics)'}{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    activeTab === 'colleges'
                      ? 'e.g. Kathmandu Model College'
                      : activeTab === 'classes'
                      ? 'e.g. Class 11'
                      : activeTab === 'streams'
                      ? 'e.g. Science'
                      : 'e.g. Basic Mathematics'
                  }
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50"
                />
              </div>

              {/* Code or Location Field */}
              {activeTab === 'colleges' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Code / Acronym</label>
                    <input
                      type="text"
                      placeholder="e.g. KMC"
                      value={formCode}
                      onChange={e => setFormCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Balkumari, Lalitpur"
                      value={formLocation}
                      onChange={e => setFormLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'classes' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Class Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 11 or 12"
                    value={formCode}
                    onChange={e => setFormCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50"
                  />
                </div>
              )}

              {activeTab === 'subjects' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Subject Code</label>
                  <input
                    type="text"
                    placeholder="e.g. PHY-101"
                    value={formCode}
                    onChange={e => setFormCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50"
                  />
                </div>
              )}

              {/* Description Field */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes or details..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]/50 resize-none"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#F4B400] hover:bg-[#F5C21B] text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center gap-2 shadow cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin text-slate-950" />}
                  <span>{modalMode === 'add' ? 'Create' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Delete & Dependency Warning Modal */}
      {isDeleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#111827] border border-rose-500/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-950/60 rounded-xl border border-rose-800/50">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Safe Deletion Check
                </h3>
                <p className="text-xs text-rose-300">
                  Inspecting dependencies before deleting "{deleteTarget.name}".
                </p>
              </div>
            </div>

            {isCheckingDeps ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin text-[#F4B400]" />
                <span>Checking associated classes, streams, subjects, and educational resources...</span>
              </div>
            ) : totalDeps > 0 ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-950/40 border border-amber-800/40 rounded-xl space-y-2 text-xs text-amber-200">
                  <p className="font-semibold flex items-center gap-1.5 text-amber-300">
                    <Info className="w-4 h-4" /> Dependent records found:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-slate-300">
                    {deleteTarget.dependencies?.classes ? (
                      <li><strong className="text-white">{deleteTarget.dependencies.classes}</strong> classes</li>
                    ) : null}
                    {deleteTarget.dependencies?.streams ? (
                      <li><strong className="text-white">{deleteTarget.dependencies.streams}</strong> streams</li>
                    ) : null}
                    {deleteTarget.dependencies?.subjects ? (
                      <li><strong className="text-white">{deleteTarget.dependencies.subjects}</strong> subjects</li>
                    ) : null}
                    {deleteTarget.dependencies?.resources ? (
                      <li><strong className="text-white">{deleteTarget.dependencies.resources}</strong> educational resources (PDFs)</li>
                    ) : null}
                  </ul>
                  <p className="text-slate-400 text-[11px] pt-1">
                    Permanently deleting this item will leave these dependent records orphaned. We strongly recommend <strong className="text-amber-300">Archiving</strong> instead of permanent deletion.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    onClick={async () => {
                      await handleToggleStatus({ id: deleteTarget.id, status: 'active' }, deleteTarget.type);
                      setIsDeleteModalOpen(false);
                      setDeleteTarget(null);
                    }}
                    className="w-full sm:w-auto flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Archive Instead (Safe)</span>
                  </button>

                  <button
                    onClick={handleConfirmPermanentDelete}
                    disabled={isDeleting}
                    className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Trash2 className="w-4 h-4" />}
                    <span>Permanent Delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-300">
                  No dependent records were found for <span className="font-semibold text-white">"{deleteTarget.name}"</span>. It is safe to permanently delete.
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
                    onClick={handleConfirmPermanentDelete}
                    disabled={isDeleting}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 shadow cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                    <span>Confirm Permanent Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
