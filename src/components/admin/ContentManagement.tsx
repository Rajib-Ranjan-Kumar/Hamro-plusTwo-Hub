import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  FileText, 
  ExternalLink, 
  Eye, 
  GraduationCap, 
  Layers, 
  Calendar, 
  Tag, 
  Loader2,
  X,
  Upload,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { 
  addCollege, 
  addSubject, 
  addContentType, 
  addExamYear, 
  deleteCollege, 
  deleteSubject, 
  deleteContentType, 
  deleteExamYear,
  deleteContribution,
  deleteStorageAsset
} from '../../services/db';
import { 
  uploadPdfToCloudinary, 
  saveResourceMetadata, 
  deleteResource,
  generateCloudinaryPath 
} from '../../services/resourceManager';
import { ConfirmModal } from '../ConfirmModal';
import { useAuth } from '../../context/AuthContext';

export const ContentManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'materials' | 'colleges' | 'subjects' | 'types' | 'years'>('materials');

  // Datasets
  const [materials, setMaterials] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [contentTypes, setContentTypes] = useState<any[]>([]);
  const [examYears, setExamYears] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStream, setFilterStream] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterCollege, setFilterCollege] = useState('all');

  // Modals
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [isAddCollegeModalOpen, setIsAddCollegeModalOpen] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: string; name: string; fileUrl?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New Content Form State
  const [newTitle, setNewTitle] = useState('');
  const [newClass, setNewClass] = useState('class11');
  const [newStream, setNewStream] = useState('science');
  const [newCollegeId, setNewCollegeId] = useState('0');
  const [newSubjectId, setNewSubjectId] = useState('');
  const [newResourceType, setNewResourceType] = useState('notes');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isSubmittingContent, setIsSubmittingContent] = useState(false);

  // New College Form State
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeLocation, setNewCollegeLocation] = useState('');

  // New Subject Form State
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjClass, setNewSubjClass] = useState('Class 11');
  const [newSubjStream, setNewSubjStream] = useState('Science');

  useEffect(() => {
    // 1. Materials Listener (academic_resources)
    const unsubMaterials = onSnapshot(collection(db, 'academic_resources'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMaterials(list);
      setIsLoading(false);
    }, err => {
      console.error("Error loading academic resources:", err);
      setIsLoading(false);
    });

    // 2. Colleges
    const unsubColleges = onSnapshot(collection(db, 'colleges'), (snap) => {
      setColleges(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 3. Subjects
    const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snap) => {
      setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 4. Content Types
    const unsubTypes = onSnapshot(collection(db, 'content_types'), (snap) => {
      setContentTypes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 5. Exam Years
    const unsubYears = onSnapshot(collection(db, 'exam_years'), (snap) => {
      setExamYears(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubMaterials();
      unsubColleges();
      unsubSubjects();
      unsubTypes();
      unsubYears();
    };
  }, []);

  // Filtered materials
  const filteredMaterials = materials.filter(m => {
    const titleMatch = (m.title || m.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const subjectMatch = (m.subject_name || m.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = titleMatch || subjectMatch;

    const matchesClass = filterClass === 'all' || (m.class_level || '').toLowerCase() === filterClass.toLowerCase();
    const matchesStream = filterStream === 'all' || (m.stream || '').toLowerCase() === filterStream.toLowerCase();
    const matchesType = filterType === 'all' || (m.resource_type || m.type || '').toLowerCase() === filterType.toLowerCase();
    const matchesCollege = filterCollege === 'all' || m.college_id === filterCollege;

    return matchesSearch && matchesClass && matchesStream && matchesType && matchesCollege;
  });

  // Action: Add Academic Resource
  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile || !newTitle.trim()) {
      alert("Please enter a title and select a file to upload.");
      return;
    }

    try {
      setIsSubmittingContent(true);
      const selectedCollegeObj = colleges.find(c => c.id === newCollegeId);
      const selectedSubjectObj = subjects.find(s => s.id === newSubjectId);

      // 1. Upload via Secure Server Signature to Cloudinary
      const resType = (newResourceType === 'notes' ? 'note' : newResourceType) as any;
      const folderPath = generateCloudinaryPath({
        college: selectedCollegeObj ? selectedCollegeObj.name : 'universal',
        classLevel: newClass,
        stream: newStream,
        resourceType: resType,
        subject: selectedSubjectObj ? selectedSubjectObj.name : 'General'
      });
      const uploadRes = await uploadPdfToCloudinary(newFile, folderPath);

      // 2. Save metadata to Firestore
      await saveResourceMetadata({
        college_name: selectedCollegeObj ? selectedCollegeObj.name : 'All Colleges',
        college_slug: selectedCollegeObj ? selectedCollegeObj.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'all_colleges',
        class_level: newClass,
        stream: newStream,
        subject: selectedSubjectObj ? selectedSubjectObj.name : 'General',
        resource_type: resType,
        description: newTitle.trim(),
        pdf_filename: newFile.name,
        cloudinary_public_id: uploadRes.public_id,
        cloudinary_secure_url: uploadRes.secure_url,
        cloudinary_folder: uploadRes.folder,
        user_id: user?.id || 'admin',
        access_level: 'free'
      });

      alert("Educational resource published successfully!");
      setIsAddMaterialModalOpen(false);
      setNewTitle('');
      setNewFile(null);
    } catch (err: any) {
      console.error("Failed to upload educational resource:", err);
      alert(`Upload failed: ${err.message || 'Please check Cloudinary configuration.'}`);
    } finally {
      setIsSubmittingContent(false);
    }
  };

  // Action: Add College
  const handleAddCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollegeName.trim()) return;
    try {
      await addCollege({ name: newCollegeName.trim(), location: newCollegeLocation.trim() || 'Kathmandu' });
      setIsAddCollegeModalOpen(false);
      setNewCollegeName('');
      setNewCollegeLocation('');
    } catch (err) {
      console.error("Error adding college:", err);
      alert("Failed to add college.");
    }
  };

  // Action: Add Subject
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName.trim()) return;
    try {
      await addSubject({
        name: newSubjName.trim(),
        year: newSubjClass,
        stream: newSubjStream,
        college_id: '0'
      });
      setIsAddSubjectModalOpen(false);
      setNewSubjName('');
    } catch (err) {
      console.error("Error adding subject:", err);
      alert("Failed to add subject.");
    }
  };

  // Action: Delete Target
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'material') {
        // Deletes Cloudinary asset with Bearer token & Firestore record
        await deleteResource(deleteTarget.id);
      } else if (deleteTarget.type === 'college') {
        await deleteCollege(deleteTarget.id);
      } else if (deleteTarget.type === 'subject') {
        await deleteSubject(deleteTarget.id);
      } else if (deleteTarget.type === 'type') {
        await deleteContentType(deleteTarget.id);
      } else if (deleteTarget.type === 'year') {
        await deleteExamYear(deleteTarget.id);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error("Error deleting content:", err);
      alert("Failed to delete item.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-[#111827] border border-white/10 rounded-2xl">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'materials', label: `Educational Materials (${materials.length})`, icon: FileText },
            { id: 'colleges', label: `Colleges (${colleges.length})`, icon: GraduationCap },
            { id: 'subjects', label: `Subjects (${subjects.length})`, icon: Layers },
            { id: 'types', label: `Content Types (${contentTypes.length})`, icon: Tag },
            { id: 'years', label: `Exam Years (${examYears.length})`, icon: Calendar },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active 
                    ? 'bg-[#F4B400] text-black shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="shrink-0 flex items-center gap-2">
          {activeTab === 'materials' && (
            <button
              onClick={() => setIsAddMaterialModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F5C21B] text-black text-xs font-bold hover:bg-[#e0b018] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          )}
          {activeTab === 'colleges' && (
            <button
              onClick={() => setIsAddCollegeModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F5C21B] text-black text-xs font-bold hover:bg-[#e0b018] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add College</span>
            </button>
          )}
          {activeTab === 'subjects' && (
            <button
              onClick={() => setIsAddSubjectModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F5C21B] text-black text-xs font-bold hover:bg-[#e0b018] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Educational Materials Table */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-[#111827] border border-white/10 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notes, past question papers, syllabi..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#080A0E] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#F4B400]/50"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <select
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
                className="bg-[#080A0E] border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-300"
              >
                <option value="all">All Classes</option>
                <option value="class11">Class 11</option>
                <option value="class12">Class 12</option>
              </select>

              <select
                value={filterStream}
                onChange={e => setFilterStream(e.target.value)}
                className="bg-[#080A0E] border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-300"
              >
                <option value="all">All Streams</option>
                <option value="science">Science</option>
                <option value="management">Management</option>
                <option value="humanities">Humanities</option>
              </select>

              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="bg-[#080A0E] border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-300"
              >
                <option value="all">All Types</option>
                <option value="notes">Notes</option>
                <option value="question_paper">Question Paper (PYQ)</option>
                <option value="syllabus">Syllabus</option>
              </select>

              <select
                value={filterCollege}
                onChange={e => setFilterCollege(e.target.value)}
                className="bg-[#080A0E] border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-300"
              >
                <option value="all">All Colleges</option>
                {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-[#111827] border border-white/10 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-[#0F172A]/80 text-slate-400 font-semibold">
                    <th className="py-3 px-4">Title & Subject</th>
                    <th className="py-3 px-4">Class & Stream</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Institution</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                        No materials found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map(mat => (
                      <tr key={mat.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-white truncate max-w-xs">{mat.title || 'Untitled'}</span>
                            <span className="text-[11px] text-[#F5C21B]">{mat.subject || 'General'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 capitalize">
                          {mat.class_level || 'Class 11'} &bull; {mat.stream || 'Science'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/5 text-slate-300 border border-white/10">
                            {mat.resource_type || mat.type || 'Document'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 truncate max-w-[150px]">
                          {mat.college || 'Universal'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {mat.file_url && (
                              <button
                                onClick={() => setPreviewPdfUrl(mat.file_url)}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                                title="Preview PDF Document"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteTarget({ id: mat.id, type: 'material', name: mat.title || 'Resource', fileUrl: mat.file_url })}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                              title="Delete from Cloud & Database"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Colleges */}
      {activeTab === 'colleges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {colleges.map(c => (
            <div key={c.id} className="p-4 rounded-2xl bg-[#111827] border border-white/10 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">{c.name}</h4>
                <p className="text-[11px] text-slate-400">{c.location || 'Kathmandu, Nepal'}</p>
              </div>
              <button
                onClick={() => setDeleteTarget({ id: c.id, type: 'college', name: c.name })}
                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Subjects */}
      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map(s => (
            <div key={s.id} className="p-4 rounded-2xl bg-[#111827] border border-white/10 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">{s.name}</h4>
                <p className="text-[11px] text-slate-400">{s.year || 'Class 11'} &bull; {s.stream || 'Science'}</p>
              </div>
              <button
                onClick={() => setDeleteTarget({ id: s.id, type: 'subject', name: s.name })}
                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Document Modal */}
      {isAddMaterialModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setIsAddMaterialModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-4">Upload Educational Resource</h3>
            
            <form onSubmit={handleCreateResource} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Physics Chapter 1 Complete Notes 2081"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-[#080A0E] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#F4B400]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Class</label>
                  <select
                    value={newClass}
                    onChange={e => setNewClass(e.target.value)}
                    className="w-full bg-[#080A0E] border border-white/10 rounded-xl px-2.5 py-2 text-white"
                  >
                    <option value="class11">Class 11</option>
                    <option value="class12">Class 12</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Stream</label>
                  <select
                    value={newStream}
                    onChange={e => setNewStream(e.target.value)}
                    className="w-full bg-[#080A0E] border border-white/10 rounded-xl px-2.5 py-2 text-white"
                  >
                    <option value="science">Science</option>
                    <option value="management">Management</option>
                    <option value="humanities">Humanities</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Subject</label>
                  <select
                    value={newSubjectId}
                    onChange={e => setNewSubjectId(e.target.value)}
                    className="w-full bg-[#080A0E] border border-white/10 rounded-xl px-2.5 py-2 text-white"
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Resource Type</label>
                  <select
                    value={newResourceType}
                    onChange={e => setNewResourceType(e.target.value)}
                    className="w-full bg-[#080A0E] border border-white/10 rounded-xl px-2.5 py-2 text-white"
                  >
                    <option value="notes">Notes / Guide</option>
                    <option value="question_paper">Question Paper (PYQ)</option>
                    <option value="syllabus">Syllabus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Attach PDF Document</label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={e => setNewFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full bg-[#080A0E] border border-white/10 rounded-xl px-3 py-2 text-slate-300"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddMaterialModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingContent}
                  className="px-5 py-2 rounded-xl bg-[#F5C21B] text-black font-bold hover:bg-[#e0b018] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingContent && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSubmittingContent ? 'Uploading to Cloud...' : 'Publish Resource'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add College Modal */}
      {isAddCollegeModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111827] border border-white/10 rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95">
            <button onClick={() => setIsAddCollegeModalOpen(false)} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-4">Add Institution / College</h3>
            <form onSubmit={handleAddCollege} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">College Name</label>
                <input
                  type="text"
                  placeholder="e.g. St. Xavier's College"
                  value={newCollegeName}
                  onChange={e => setNewCollegeName(e.target.value)}
                  className="w-full bg-[#080A0E] border border-white/10 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Maitighar, Kathmandu"
                  value={newCollegeLocation}
                  onChange={e => setNewCollegeLocation(e.target.value)}
                  className="w-full bg-[#080A0E] border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsAddCollegeModalOpen(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#F5C21B] text-black font-bold">Add College</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {isAddSubjectModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111827] border border-white/10 rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95">
            <button onClick={() => setIsAddSubjectModalOpen(false)} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-4">Add Curriculum Subject</h3>
            <form onSubmit={handleAddSubject} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={newSubjName}
                  onChange={e => setNewSubjName(e.target.value)}
                  className="w-full bg-[#080A0E] border border-white/10 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Class</label>
                  <select
                    value={newSubjClass}
                    onChange={e => setNewSubjClass(e.target.value)}
                    className="w-full bg-[#080A0E] border border-white/10 rounded-xl px-2.5 py-2 text-white"
                  >
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Stream</label>
                  <select
                    value={newSubjStream}
                    onChange={e => setNewSubjStream(e.target.value)}
                    className="w-full bg-[#080A0E] border border-white/10 rounded-xl px-2.5 py-2 text-white"
                  >
                    <option value="Science">Science</option>
                    <option value="Management">Management</option>
                    <option value="Humanities">Humanities</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsAddSubjectModalOpen(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#F5C21B] text-black font-bold">Add Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document PDF Preview Modal */}
      {previewPdfUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[85vh] bg-[#111827] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
            <div className="p-3.5 bg-[#0F172A] border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#F5C21B]" />
                Secure Document Preview
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                  title="Open externally"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreviewPdfUrl(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-950">
              <iframe
                src={previewPdfUrl}
                className="w-full h-full border-0"
                title="PDF Document"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title={`Delete ${deleteTarget?.type}`}
        message={`Are you sure you want to delete "${deleteTarget?.name}"? If it has an associated cloud document, it will be securely removed from Cloudinary.`}
        confirmText="Confirm Delete"
        isDanger={true}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
