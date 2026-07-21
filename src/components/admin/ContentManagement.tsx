import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, FileText, BookOpen, Video, Loader2 } from 'lucide-react';
import { ConfirmModal } from '../ConfirmModal';
import { db } from '../../firebase';
import { collection, onSnapshot, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';

export const ContentManagement = () => {
  const [content, setContent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [collegeFilter, setCollegeFilter] = useState('all');
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'contributions'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const materialsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setContent(materialsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching materials:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredContent = content.filter(item => {
    const matchesSearch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.subject_id || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesCollege = collegeFilter === 'all' || (item.college_id || '').toLowerCase().includes(collegeFilter.toLowerCase());
    return matchesSearch && matchesType && matchesCollege;
  });

  const handleDeleteClick = (id: string) => {
    setContentToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (contentToDelete) {
      try {
        await deleteDoc(doc(db, 'contributions', contentToDelete));
        setIsDeleteModalOpen(false);
        setContentToDelete(null);
      } catch (error) {
        console.error("Error deleting content:", error);
        alert("Failed to delete content.");
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'notes': return <BookOpen className="w-4 h-4 text-indigo-500" />;
      case 'pyq': return <FileText className="w-4 h-4 text-rose-500" />;
      case 'syllabus': return <FileText className="w-4 h-4 text-emerald-500" />;
      default: return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-white">Content Management</h2>
        
        <button 
          onClick={() => window.location.href = '/add-content'}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Content
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search title or subject..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
          />
        </div>
        
        <div className="relative w-full sm:w-40">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white appearance-none"
          >
            <option value="all">All Types</option>
            <option value="notes">Notes</option>
            <option value="pyq">PYQs</option>
            <option value="syllabus">Syllabus</option>
          </select>
        </div>

        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select 
            value={collegeFilter}
            onChange={(e) => setCollegeFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white appearance-none"
          >
            <option value="all">All Colleges</option>
            <option value="global">Global</option>
            <option value="st. xavier's">St. Xavier's</option>
            <option value="trinity">Trinity</option>
            <option value="kmc">KMC</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 font-medium">Title & Subject</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Visibility</th>
                <th className="px-6 py-4 font-medium">Uploader</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                    <p className="text-sm text-slate-500 mt-2">Loading content...</p>
                  </td>
                </tr>
              ) : filteredContent.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No content found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredContent.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 shrink-0">
                          {getTypeIcon(item.type)}
                        </div>
                        <div>
                          <p className="font-medium text-white line-clamp-1">{item.title}</p>
                          <p className="text-xs text-slate-400">{item.subject_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 capitalize">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-xs font-medium">{item.college_id}</p>
                      <p className="text-xs text-slate-400">{item.year}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600 dark:text-slate-300">{item.uploader_id || 'Unknown'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-400 text-xs">
                        {item.created_at ? format(new Date(item.created_at), 'MMM d, yyyy') : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                          title="Edit Content"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(item.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                          title="Delete Content"
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
        
        <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Showing <span className="font-medium text-white">1</span> to <span className="font-medium text-white">{filteredContent.length}</span> of <span className="font-medium text-white">{filteredContent.length}</span> items
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 border border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        title="Delete Content"
        message="Are you sure you want to delete this content? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
