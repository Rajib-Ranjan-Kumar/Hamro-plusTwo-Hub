import React, { useState, useEffect } from 'react';
import { Search, Filter, AlertTriangle, Eye, Trash2, CheckCircle } from 'lucide-react';
import { ConfirmModal } from '../ConfirmModal';
import { getReportedContributions, dismissReport, deleteContribution, getColleges, getSubjects } from '../../services/db';

export const ReportedContent = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [data, colleges, subjects] = await Promise.all([
        getReportedContributions(),
        getColleges(),
        getSubjects('all')
      ]);
      
      const collegeMap = colleges.reduce((acc: any, curr: any) => {
        acc[curr.id] = curr.name;
        return acc;
      }, {});

      const subjectMap = subjects.reduce((acc: any, curr: any) => {
        acc[curr.id] = curr.name;
        return acc;
      }, {});

      setReports(data.map(item => {
        let dateStr = 'Unknown';
        if (item.reported_at) {
          dateStr = item.reported_at.toDate ? item.reported_at.toDate().toLocaleDateString() : new Date(item.reported_at).toLocaleDateString();
        } else if (item.created_at) {
          dateStr = item.created_at.toDate ? item.created_at.toDate().toLocaleDateString() : new Date(item.created_at).toLocaleDateString();
        }

        return {
          id: item.id,
          contentId: item.id,
          title: item.description || 'Untitled Content',
          type: item.type || 'unknown',
          reporter: item.reporter_name || 'Unknown',
          reason: item.report_reason || 'No reason provided',
          status: 'pending',
          date: dateStr,
          college: item.college_id ? collegeMap[item.college_id] || 'Unknown College' : 'All Colleges',
          subject: item.subject_id ? subjectMap[item.subject_id] || 'Unknown Subject' : 'Unknown Subject',
          term: item.term || 'N/A',
          examYear: item.exam_year || 'N/A',
          fileUrl: item.file_url || null
        };
      }));
    } catch (error) {
      console.error("Failed to fetch reported content:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(rep => {
    const matchesSearch = rep.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          rep.reporter.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rep.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rep.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteClick = (id: string) => {
    setReportToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (reportToDelete) {
      try {
        await deleteContribution(reportToDelete);
        setReports(reports.filter(r => r.id !== reportToDelete));
      } catch (error) {
        console.error("Failed to delete reported content:", error);
      }
      setIsDeleteModalOpen(false);
      setReportToDelete(null);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await dismissReport(id);
      setReports(reports.filter(r => r.id !== id));
    } catch (error) {
      console.error("Failed to dismiss report:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'resolved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle className="w-3 h-3" /> Resolved</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><AlertTriangle className="w-3 h-3" /> Pending</span>;
      case 'dismissed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"><CheckCircle className="w-3 h-3" /> Dismissed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-white">Reported Content</h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search content title, reporter, or ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
          />
        </div>
        
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 font-medium">Report ID</th>
                <th className="px-6 py-4 font-medium">Content Title</th>
                <th className="px-6 py-4 font-medium">Reporter</th>
                <th className="px-6 py-4 font-medium">Reason</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Loading reports...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No reports found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredReports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {rep.id}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white line-clamp-1">{rep.title}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 capitalize">{rep.type}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{rep.college}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{rep.subject}</span>
                          {rep.term !== 'N/A' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{rep.term}</span>}
                          {rep.examYear !== 'N/A' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{rep.examYear}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {rep.reporter}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                        {rep.reason}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(rep.status)}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {rep.date}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {rep.fileUrl && (
                          <a 
                            href={`/viewer?url=${encodeURIComponent(rep.fileUrl)}&title=${encodeURIComponent('Reported Content')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            title="View Content"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        {rep.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleDismiss(rep.id)}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                              title="Dismiss Report"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(rep.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                              title="Delete Content"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
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
            Showing <span className="font-medium text-white">1</span> to <span className="font-medium text-white">{filteredReports.length}</span> of <span className="font-medium text-white">{filteredReports.length}</span> items
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
        message="Are you sure you want to delete this reported content? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
