import React, { useState, useEffect } from 'react';
import { Plus, Trash2, GraduationCap, BookOpen, Calendar, Tag, Loader2 } from 'lucide-react';
import { ConfirmModal } from '../ConfirmModal';
import { db } from '../../firebase';
import { collection, onSnapshot, doc, deleteDoc, addDoc, query, orderBy } from 'firebase/firestore';

export const CollegeStructure = () => {
  const [activeTab, setActiveTab] = useState<'colleges' | 'subjects' | 'years'>('colleges');
  
  const [colleges, setColleges] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: string} | null>(null);

  useEffect(() => {
    const unsubColleges = onSnapshot(query(collection(db, 'colleges'), orderBy('name')), (snapshot) => {
      setColleges(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubSubjects = onSnapshot(query(collection(db, 'subjects'), orderBy('name')), (snapshot) => {
      setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubYears = onSnapshot(query(collection(db, 'academic_years'), orderBy('name')), (snapshot) => {
      setYears(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });

    return () => {
      unsubColleges();
      unsubSubjects();
      unsubYears();
    };
  }, []);

  const handleDeleteClick = (id: string, type: string) => {
    setItemToDelete({ id, type });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        let collectionName = '';
        if (itemToDelete.type === 'college') collectionName = 'colleges';
        if (itemToDelete.type === 'subject') collectionName = 'subjects';
        if (itemToDelete.type === 'year') collectionName = 'academic_years';
        
        await deleteDoc(doc(db, collectionName, itemToDelete.id));
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("Failed to delete item.");
      }
    }
  };

  const handleAdd = async (type: string) => {
    let name = prompt(`Enter new ${type} name:`);
    if (!name) return;
    
    let data: any = { name, created_at: new Date().toISOString() };
    let collectionName = '';
    
    if (type === 'college') collectionName = 'colleges';
    if (type === 'year') collectionName = 'academic_years';
    if (type === 'subject') {
      let code = prompt(`Enter subject code for ${name}:`);
      data.code = code || '';
      collectionName = 'subjects';
    }

    try {
      await addDoc(collection(db, collectionName), data);
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Failed to add item.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-white">Academic Structure</h2>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
        <div className="border-b border-slate-700 overflow-x-auto">
          <nav className="flex -mb-px min-w-max">
            <button
              onClick={() => setActiveTab('colleges')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'colleges'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Colleges
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'subjects'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Subjects
            </button>
            <button
              onClick={() => setActiveTab('years')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'years'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <Calendar className="w-4 h-4" /> Academic Years
            </button>
          </nav>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm text-slate-500 mt-2">Loading structure data...</p>
            </div>
          ) : activeTab === 'colleges' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Manage Colleges</h3>
                <button onClick={() => handleAdd('college')} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-800/50 rounded-lg text-sm font-medium transition-colors">
                  <Plus className="w-4 h-4" /> Add College
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {colleges.map(college => (
                  <div key={college.id} className="p-4 border border-slate-700 rounded-xl flex items-center justify-between group hover:border-emerald-500/50 transition-colors">
                    <div>
                      <p className="font-medium text-white">{college.name}</p>
                      <p className="text-xs text-slate-400">{college.students} Students</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteClick(college.id, 'college')}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'subjects' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Manage Subjects</h3>
                <button onClick={() => handleAdd('subject')} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-800/50 rounded-lg text-sm font-medium transition-colors">
                  <Plus className="w-4 h-4" /> Add Subject
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map(subject => (
                  <div key={subject.id} className="p-4 border border-slate-700 rounded-xl flex items-center justify-between group hover:border-emerald-500/50 transition-colors">
                    <div>
                      <p className="font-medium text-white">{subject.name}</p>
                      <p className="text-xs text-slate-400">Code: {subject.code}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteClick(subject.id, 'subject')}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'years' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Manage Academic Years</h3>
                <button onClick={() => handleAdd('year')} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-800/50 rounded-lg text-sm font-medium transition-colors">
                  <Plus className="w-4 h-4" /> Add Year
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {years.map(year => (
                  <div key={year.id} className="p-4 border border-slate-700 rounded-xl flex items-center justify-between group hover:border-emerald-500/50 transition-colors">
                    <div>
                      <p className="font-medium text-white">{year.name}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteClick(year.id, 'year')}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        title={`Delete ${itemToDelete?.type}`}
        message={`Are you sure you want to delete this ${itemToDelete?.type}? This action cannot be undone and may affect associated content.`}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
