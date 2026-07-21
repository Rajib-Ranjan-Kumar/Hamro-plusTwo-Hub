import React, { useState, useEffect } from 'react';
import { Users, BookOpen, FileText, GraduationCap, CreditCard, DollarSign, Activity, Loader2 } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const DashboardOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    colleges: 0,
    subjects: 0,
    notes: 0,
    pyqs: 0,
    subscriptions: 0,
    revenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [contentUploadsData, setContentUploadsData] = useState<any[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<any[]>([]);

  useEffect(() => {
    setIsLoading(true);

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, totalUsers: snap.size, activeUsers: snap.size }));
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentYear = new Date().getFullYear();
      const counts = new Array(12).fill(0);
      let previousYearsTotal = 0;
      
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.created_at) {
          const date = data.created_at.toDate();
          if (date.getFullYear() === currentYear) {
            counts[date.getMonth()]++;
          } else if (date.getFullYear() < currentYear) {
            previousYearsTotal++;
          }
        } else {
          previousYearsTotal++;
        }
      });

      let total = previousYearsTotal;
      const growthData = counts.map((count, index) => {
        total += count;
        return { name: months[index], users: total };
      });
      
      const currentMonth = new Date().getMonth();
      setUserGrowthData(growthData.slice(0, currentMonth + 1));
    }, (error) => console.error("Error fetching users:", error));

    const unsubColleges = onSnapshot(collection(db, 'colleges'), (snap) => {
      setStats(prev => ({ ...prev, colleges: snap.size }));
    }, (error) => console.error("Error fetching colleges:", error));

    const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snap) => {
      setStats(prev => ({ ...prev, subjects: snap.size }));
    }, (error) => console.error("Error fetching subjects:", error));

    const unsubContributions = onSnapshot(collection(db, 'contributions'), (snap) => {
      let notesCount = 0;
      let pyqsCount = 0;
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentYear = new Date().getFullYear();
      const notesCounts = new Array(12).fill(0);
      const pyqsCounts = new Array(12).fill(0);

      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.type === 'notes') notesCount++;
        if (data.type === 'pyq') pyqsCount++;

        if (data.created_at) {
          const date = data.created_at.toDate();
          if (date.getFullYear() === currentYear) {
            if (data.type === 'notes') notesCounts[date.getMonth()]++;
            if (data.type === 'pyq') pyqsCounts[date.getMonth()]++;
          }
        }
      });

      setStats(prev => ({ ...prev, notes: notesCount, pyqs: pyqsCount }));

      const currentMonth = new Date().getMonth();
      const uploadsData = months.slice(0, currentMonth + 1).map((month, index) => ({
        name: month,
        notes: notesCounts[index],
        pyqs: pyqsCounts[index]
      }));
      setContentUploadsData(uploadsData);
    }, (error) => console.error("Error fetching contributions:", error));

    const unsubSubs = onSnapshot(collection(db, 'subscription_requests'), (snap) => {
      setStats(prev => ({ ...prev, subscriptions: snap.size }));
    }, (error) => console.error("Error fetching subscriptions:", error));

    const unsubApprovedSubs = onSnapshot(query(collection(db, 'subscription_requests'), where('status', '==', 'approved')), (snap) => {
      let totalRevenue = 0;
      const planCounts: Record<string, number> = {};
      
      snap.forEach((doc: any) => {
        const data = doc.data();
        totalRevenue += (data.amount_paid || 0);
        
        const plan = data.plan_selected || 'Unknown';
        planCounts[plan] = (planCounts[plan] || 0) + 1;
      });
      
      setStats(prev => ({ ...prev, revenue: totalRevenue }));
      
      const subData = Object.keys(planCounts).map(key => ({
        name: key,
        value: planCounts[key]
      }));
      setSubscriptionData(subData.length > 0 ? subData : [{ name: 'No Data', value: 1 }]);
      
      setIsLoading(false); // Set loading false after the last query
    }, (error) => {
      console.error("Error fetching approved subs:", error);
      setIsLoading(false);
    });

    return () => {
      unsubUsers();
      unsubColleges();
      unsubSubjects();
      unsubContributions();
      unsubSubs();
      unsubApprovedSubs();
    };
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Active Users', value: stats.activeUsers.toLocaleString(), icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Total Colleges', value: stats.colleges.toLocaleString(), icon: GraduationCap, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Total Subjects', value: stats.subjects.toLocaleString(), icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { label: 'Notes Uploaded', value: stats.notes.toLocaleString(), icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
    { label: 'PYQs Uploaded', value: stats.pyqs.toLocaleString(), icon: FileText, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/30' },
    { label: 'Subscriptions', value: stats.subscriptions.toLocaleString(), icon: CreditCard, color: 'text-teal-500', bg: 'bg-teal-100 dark:bg-teal-900/30' },
    { label: 'Revenue', value: `NPR ${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  ];

  // Data for charts is now fetched from Firestore

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-slate-500 mt-4">Loading dashboard statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Dashboard Overview</h2>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-6">User Growth</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Content Uploads Chart */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-6">Content Uploads</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contentUploadsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  cursor={{ fill: '#334155', opacity: 0.1 }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="notes" name="Notes" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pyqs" name="PYQs" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Distribution */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-6">Subscription Distribution</h3>
          <div className="h-72 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
