import { db, storage } from '../firebase';
import { collection, getDocs, query, where, addDoc, updateDoc, doc, getDoc, deleteDoc, orderBy, serverTimestamp, writeBatch, setDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth } from '../firebase';

// Helper function to generate SHA-1 signature on client if backend signature endpoint is unreachable
const getClientUploadSignature = async (timestamp: number, secret: string): Promise<string> => {
  const message = `timestamp=${timestamp}${secret}`;
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    let cloudName = 'zob9phdy';
    let apiKey = '194297374744823';
    let timestamp = Math.round(new Date().getTime() / 1000);
    let signature = '';

    // 1. Try to get signature from backend
    try {
      const sigRes = await fetch('/api/upload-signature');
      const contentType = sigRes.headers.get('content-type') || '';
      if (sigRes.ok && contentType.includes('application/json')) {
        const sigData = await sigRes.json();
        if (sigData.signature) {
          timestamp = sigData.timestamp;
          signature = sigData.signature;
          cloudName = sigData.cloudName || cloudName;
          apiKey = sigData.apiKey || apiKey;
        }
      }
    } catch (sigErr) {
      console.warn("Backend signature unavailable, using direct client signature fallback:", sigErr);
    }

    // Fallback: Generate signature directly on client if backend signature unavailable
    if (!signature) {
      const secret = 'fGLjz4G4eVKmSX7oZ5wHPvTDdPQ';
      signature = await getClientUploadSignature(timestamp, secret);
    }

    // 2. Upload directly to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);

    // Use 'auto' to handle both images and raw PDFs
    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    });

    if (uploadRes.ok) {
      const data = await uploadRes.json();
      if (data.secure_url) {
        return data.secure_url;
      }
    }

    const err = await uploadRes.json().catch(() => null);
    console.warn("Cloudinary upload failed, attempting Firebase Storage fallback:", err);

    // 3. Fallback: Firebase Storage
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageRef = ref(storage, `${path}/${Date.now()}_${cleanFileName}`);
    const uploadResult = await uploadBytes(storageRef, file);
    return await getDownloadURL(uploadResult.ref);
  } catch (error: any) {
    console.error("Error in primary upload pipeline:", error);
    try {
      // Last-resort fallback to Firebase Storage
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageRef = ref(storage, `${path}/${Date.now()}_${cleanFileName}`);
      const uploadResult = await uploadBytes(storageRef, file);
      return await getDownloadURL(uploadResult.ref);
    } catch (fbErr: any) {
      console.error("Firebase Storage fallback also failed:", fbErr);
      throw new Error(error.message || "Failed to upload file. Please check your internet connection.");
    }
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface GlobalSettings {
  site_name?: string;
  support_email?: string;
  support_phone?: string;
  contact_location?: string;
  contact_hours?: string;
  site_description?: string;
  premium_only_mode?: boolean;
  notify_registrations?: boolean;
  notify_subscriptions?: boolean;
  notify_reports?: boolean;
}

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  site_name: 'Hamro +2 Hub',
  support_email: 'hamroplus2support@gmail.com',
  support_phone: '+977 9800000000',
  contact_location: 'Kathmandu, Nepal',
  contact_hours: 'Sunday – Friday, 9:00 AM – 6:00 PM NPT',
  site_description: 'The premier academic resource platform for Class 11 and 12 in Nepal.',
  premium_only_mode: true,
  notify_registrations: true,
  notify_subscriptions: true,
  notify_reports: true,
};

export const getGlobalSettings = async (): Promise<GlobalSettings> => {
  try {
    const docRef = doc(db, 'settings', 'global');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...DEFAULT_GLOBAL_SETTINGS, ...(docSnap.data() as GlobalSettings) };
    }
    return DEFAULT_GLOBAL_SETTINGS;
  } catch (error) {
    console.error("Failed to get global settings:", error);
    return DEFAULT_GLOBAL_SETTINGS;
  }
};

export const subscribeToGlobalSettings = (callback: (settings: GlobalSettings) => void) => {
  const docRef = doc(db, 'settings', 'global');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ ...DEFAULT_GLOBAL_SETTINGS, ...(docSnap.data() as GlobalSettings) });
    } else {
      callback(DEFAULT_GLOBAL_SETTINGS);
    }
  }, (err) => {
    console.warn("Failed to subscribe to global settings:", err);
    callback(DEFAULT_GLOBAL_SETTINGS);
  });
};

export const updateGlobalSettings = async (data: Partial<GlobalSettings>) => {
  try {
    const docRef = doc(db, 'settings', 'global');
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'settings/global');
  }
};

export const getColleges = async () => {
  try {
    const q = query(collection(db, 'colleges'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'colleges');
    return [];
  }
};

export const getSubjects = async (collegeId?: string) => {
  try {
    let q = collection(db, 'subjects') as any;
    if (collegeId === 'all') {
      // No filter, fetch all
    } else if (collegeId && collegeId !== '0') {
      const collegeIds = Array.from(new Set([collegeId, null]));
      q = query(q, where('college_id', 'in', collegeIds));
    } else {
      q = query(q, where('college_id', '==', null));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
  } catch (error) {
    console.warn("getSubjects direct query error, attempting collection fallback:", error);
    try {
      const snap = await getDocs(collection(db, 'subjects'));
      const all = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      if (collegeId && collegeId !== 'all' && collegeId !== '0') {
        return all.filter(s => s.college_id === collegeId || !s.college_id);
      } else if (collegeId === '0') {
        return all.filter(s => !s.college_id);
      }
      return all;
    } catch (e) {
      console.error("Failed to fetch subjects:", e);
      return [];
    }
  }
};

const DEFAULT_CONTENT_TYPES = [
  { id: 'def-syllabus', name: 'syllabus', college_id: null },
  { id: 'def-notes', name: 'notes', college_id: null },
  { id: 'def-pyq', name: 'pyq', college_id: null },
  { id: 'def-solutions', name: 'solutions', college_id: null },
  { id: 'def-model_questions', name: 'model_questions', college_id: null }
];

export const getContentTypes = async (collegeId?: string, year?: string) => {
  try {
    let q = collection(db, 'content_types') as any;
    if (collegeId === 'all') {
      // No filter
    } else if (collegeId && collegeId !== '0') {
      const collegeIds = Array.from(new Set([collegeId, null]));
      q = query(q, where('college_id', 'in', collegeIds));
    } else {
      q = query(q, where('college_id', '==', null));
    }
    if (year && year !== 'all') {
      q = query(q, where('year', '==', year));
    }
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    if (results.length > 0) return results;
    
    // If no custom content types found for this class/college, provide standard defaults
    return DEFAULT_CONTENT_TYPES.map(t => ({ ...t, year: year || 'Class 11' }));
  } catch (error) {
    console.warn("getContentTypes direct query error, using standard defaults:", error);
    return DEFAULT_CONTENT_TYPES.map(t => ({ ...t, year: year || 'Class 11' }));
  }
};

const DEFAULT_EXAM_YEARS = [
  { id: 'def-2026', year_value: '2026', college_id: null },
  { id: 'def-2025', year_value: '2025', college_id: null },
  { id: 'def-2024', year_value: '2024', college_id: null },
  { id: 'def-2023', year_value: '2023', college_id: null },
  { id: 'def-2022', year_value: '2022', college_id: null },
  { id: 'def-2021', year_value: '2021', college_id: null },
  { id: 'def-2020', year_value: '2020', college_id: null }
];

export const getExamYears = async (collegeId?: string, year?: string) => {
  try {
    let q = collection(db, 'exam_years') as any;
    if (collegeId === 'all') {
      // No filter
    } else if (collegeId && collegeId !== '0') {
      const collegeIds = Array.from(new Set([collegeId, null]));
      q = query(q, where('college_id', 'in', collegeIds));
    } else {
      q = query(q, where('college_id', '==', null));
    }
    if (year && year !== 'all') {
      q = query(q, where('year', '==', year));
    }
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    if (results.length > 0) return results;

    // Fallback: Return standard default exam years
    return DEFAULT_EXAM_YEARS.map(y => ({ ...y, year: year || 'Class 11' }));
  } catch (error) {
    console.warn("getExamYears direct query error, using standard defaults:", error);
    return DEFAULT_EXAM_YEARS.map(y => ({ ...y, year: year || 'Class 11' }));
  }
};

export const getContributions = async (userId?: string) => {
  let q = collection(db, 'contributions') as any;
  if (userId) {
    q = query(q, where('user_id', '==', userId));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
};

export const getWithdrawals = async (userId?: string) => {
  let q = collection(db, 'withdrawals') as any;
  if (userId) {
    q = query(q, where('user_id', '==', userId));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
};

export const addWithdrawal = async (data: any) => {
  try {
    let userName = '';
    let userEmail = '';
    let userData: any = null;
    
    if (data.user_id) {
      const userRef = doc(db, 'users', data.user_id);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        userData = userSnap.data();
        userName = userData.name || '';
        userEmail = userData.email || '';
      }
    }

    const batch = writeBatch(db);

    // Create withdrawal document
    const withdrawalRef = doc(collection(db, 'withdrawals'));
    batch.set(withdrawalRef, {
      ...data,
      user_name: userName,
      user_email: userEmail,
      created_at: serverTimestamp(),
      status: 'pending'
    });

    // Deduct from user wallet and add to holding balance
    if (data.user_id && userData) {
      const currentWalletBalance = userData.wallet_balance || 0;
      if (currentWalletBalance < data.amount) {
        throw new Error("Insufficient wallet balance.");
      }
      const userRef = doc(db, 'users', data.user_id);
      batch.update(userRef, {
        wallet_balance: currentWalletBalance - data.amount,
        holding_balance: (userData.holding_balance || 0) + data.amount
      });
    }

    await batch.commit();

    return withdrawalRef;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'withdrawals');
  }
};

export const addContribution = async (data: any, user?: any) => {
  return await addDoc(collection(db, 'contributions'), {
    ...data,
    user_name: user?.name || 'Anonymous',
    user_email: user?.email || 'No email',
    created_at: serverTimestamp(),
    status: data.status || 'pending', // Default to pending unless explicitly specified (e.g. by admin)
    solution_status: data.solution_status || 'verified',
    upvotes: 0,
    rating: 0,
    rating_count: 0
  });
};

export const addCollege = async (data: any) => {
  return await addDoc(collection(db, 'colleges'), data);
};

export const addSubject = async (data: any) => {
  return await addDoc(collection(db, 'subjects'), data);
};

export const addContentType = async (data: any) => {
  return await addDoc(collection(db, 'content_types'), data);
};

export const addExamYear = async (data: any) => {
  return await addDoc(collection(db, 'exam_years'), data);
};

export const getContent = async (type: string, subjectId?: string, year?: string, term?: string, examYear?: string, collegeId?: string, includePending: boolean = false) => {
  try {
    let q = collection(db, 'contributions') as any;
    q = query(q, where('type', '==', type));
    
    // Only show verified content unless explicitly requested (e.g., for admin)
    if (!includePending) {
      q = query(q, where('status', '==', 'verified'));
    }
    
    if (subjectId) q = query(q, where('subject_id', '==', subjectId));
    if (term) q = query(q, where('term', '==', term));
    if (examYear) q = query(q, where('exam_year', '==', examYear));
    
    if (collegeId === 'all') {
      // Admin sees all
    } else if (collegeId && collegeId !== '0') {
      const collegeIds = Array.from(new Set([collegeId, null]));
      q = query(q, where('college_id', 'in', collegeIds));
    } else if (collegeId !== undefined) {
      q = query(q, where('college_id', '==', null));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
  } catch (error) {
    console.warn("Direct query failed (likely missing composite index), activating resilient in-memory filter fallback:", error);
    try {
      let fallbackQ = query(collection(db, 'contributions'), where('type', '==', type));
      if (!includePending) {
        fallbackQ = query(fallbackQ, where('status', '==', 'verified'));
      }
      const snapshot = await getDocs(fallbackQ);
      let results = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

      if (subjectId) {
        results = results.filter(item => item.subject_id === subjectId);
      }
      if (term) {
        results = results.filter(item => item.term === term);
      }
      if (examYear) {
        results = results.filter(item => item.exam_year === examYear);
      }
      if (collegeId && collegeId !== 'all' && collegeId !== '0') {
        results = results.filter(item => item.college_id === collegeId || item.college_id === null || !item.college_id);
      } else if (collegeId === '0') {
        results = results.filter(item => !item.college_id);
      }
      return results;
    } catch (fallbackError) {
      console.error("Fallback getContent error:", fallbackError);
      return [];
    }
  }
};

export const upvoteContent = async (id: string, userId: string) => {
  const ref = doc(db, 'contributions', id);
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    const data = docSnap.data();
    const upvotedBy = data.upvoted_by || [];
    const downvotedBy = data.downvoted_by || [];
    
    if (upvotedBy.includes(userId)) {
      // Already upvoted, remove upvote
      await updateDoc(ref, { 
        upvotes: Math.max(0, (data.upvotes || 0) - 1),
        upvoted_by: upvotedBy.filter((uid: string) => uid !== userId)
      });
      return { action: 'removed_upvote' };
    } else {
      // Add upvote, remove downvote if exists
      const newDownvotes = downvotedBy.includes(userId) ? Math.max(0, (data.downvotes || 0) - 1) : (data.downvotes || 0);
      await updateDoc(ref, { 
        upvotes: (data.upvotes || 0) + 1,
        upvoted_by: [...upvotedBy, userId],
        downvotes: newDownvotes,
        downvoted_by: downvotedBy.filter((uid: string) => uid !== userId)
      });
      return { action: 'added_upvote' };
    }
  }
  return null;
};

export const downvoteContent = async (id: string, userId: string) => {
  const ref = doc(db, 'contributions', id);
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    const data = docSnap.data();
    const upvotedBy = data.upvoted_by || [];
    const downvotedBy = data.downvoted_by || [];
    
    if (downvotedBy.includes(userId)) {
      // Already downvoted, remove downvote
      await updateDoc(ref, { 
        downvotes: Math.max(0, (data.downvotes || 0) - 1),
        downvoted_by: downvotedBy.filter((uid: string) => uid !== userId)
      });
      return { action: 'removed_downvote' };
    } else {
      // Add downvote, remove upvote if exists
      const newUpvotes = upvotedBy.includes(userId) ? Math.max(0, (data.upvotes || 0) - 1) : (data.upvotes || 0);
      await updateDoc(ref, { 
        downvotes: (data.downvotes || 0) + 1,
        downvoted_by: [...downvotedBy, userId],
        upvotes: newUpvotes,
        upvoted_by: upvotedBy.filter((uid: string) => uid !== userId)
      });
      return { action: 'added_downvote' };
    }
  }
  return null;
};

export const rateContent = async (id: string, rating: number) => {
  const ref = doc(db, 'contributions', id);
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    const data = docSnap.data();
    const currentRating = data.rating || 0;
    const count = data.rating_count || 0;
    const newRating = ((currentRating * count) + rating) / (count + 1);
    await updateDoc(ref, { rating: newRating, rating_count: count + 1 });
  }
};

export const reportContent = async (id: string, reason: string, reporterName: string = 'Unknown') => {
  const ref = doc(db, 'contributions', id);
  await updateDoc(ref, { 
    reported: true, 
    report_reason: reason,
    reporter_name: reporterName,
    reported_at: serverTimestamp()
  });
};

export const updateSolutionStatus = async (id: string, status: string) => {
  const ref = doc(db, 'contributions', id);
  await updateDoc(ref, { solution_status: status });
};

export const getPendingContributions = async () => {
  const q = query(collection(db, 'contributions'), where('status', '==', 'pending'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
};

export const getReportedContributions = async () => {
  const q = query(collection(db, 'contributions'), where('reported', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
};

export const dismissReport = async (id: string) => {
  const ref = doc(db, 'contributions', id);
  await updateDoc(ref, { reported: false });
};

export const getAllWithdrawals = async () => {
  const q = query(collection(db, 'withdrawals'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
};

export const approveContribution = async (id: string, reward: number, comment: string) => {
  const ref = doc(db, 'contributions', id);
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    const data = docSnap.data();
    const batch = writeBatch(db);
    batch.update(ref, { status: 'verified', reward, admin_comment: comment });
    
    // Update user wallet
    if (data.user_id) {
      const userRef = doc(db, 'users', data.user_id);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        batch.update(userRef, {
          wallet_balance: (userData.wallet_balance || 0) + reward,
          points: (userData.points || 0) + 10
        });
        
        // Create notification
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
          user_id: data.user_id,
          title: 'Contribution Approved',
          message: `Your contribution "${data.description || 'Material'}" has been approved. You earned Rs. ${reward}.`,
          type: 'approval',
          created_at: serverTimestamp(),
          read: false
        });
      }
    }
    await batch.commit();
  }
};

export const rejectContribution = async (id: string, comment: string) => {
  const ref = doc(db, 'contributions', id);
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    const data = docSnap.data();
    const batch = writeBatch(db);
    batch.update(ref, { status: 'rejected', admin_comment: comment });
    
    if (data.user_id) {
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        user_id: data.user_id,
        title: 'Contribution Rejected',
        message: `Your contribution "${data.description || 'Material'}" was rejected. Reason: ${comment}`,
        type: 'correction',
        created_at: serverTimestamp(),
        read: false
      });
    }
    await batch.commit();
  }
};

export const updateWithdrawalStatus = async (id: string, status: string, comment: string) => {
  try {
    const ref = doc(db, 'withdrawals', id);
    const docSnap = await getDoc(ref);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const batch = writeBatch(db);
      batch.update(ref, { status, admin_comment: comment });
      
      if (data.user_id) {
        const userRef = doc(db, 'users', data.user_id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (status === 'rejected') {
            // Refund user wallet from holding balance
            batch.update(userRef, {
              wallet_balance: (userData.wallet_balance || 0) + data.amount,
              holding_balance: Math.max(0, (userData.holding_balance || 0) - data.amount)
            });
          } else if (status === 'approved') {
            // Deduct from holding balance
            batch.update(userRef, {
              holding_balance: Math.max(0, (userData.holding_balance || 0) - data.amount)
            });
          }
          
          // Create notification
          const notifRef = doc(collection(db, 'notifications'));
          batch.set(notifRef, {
            user_id: data.user_id,
            title: `Withdrawal ${status === 'approved' ? 'Approved' : 'Rejected'}`,
            message: `Your withdrawal request for Rs. ${data.amount} has been ${status}. ${comment ? `Reason: ${comment}` : ''}`,
            type: 'withdrawal',
            created_at: serverTimestamp(),
            read: false
          });
        }
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `withdrawals/${id}`);
  }
};

export const extractCloudinaryPublicId = (url: string): { publicId: string; resourceType: string } | null => {
  if (!url || !url.includes('cloudinary.com')) return null;

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;

    const resourceType = parts[uploadIndex - 1] || 'image';
    let afterUpload = parts.slice(uploadIndex + 1);

    if (afterUpload[0] && /^v\d+$/.test(afterUpload[0])) {
      afterUpload = afterUpload.slice(1);
    }

    const fullPathWithExt = afterUpload.join('/');
    const publicId = resourceType === 'raw' 
      ? fullPathWithExt 
      : fullPathWithExt.replace(/\.[^/.]+$/, '');

    return { publicId, resourceType };
  } catch (e) {
    console.warn("Failed to extract Cloudinary publicId:", e);
    return null;
  }
};

export const deleteStorageAsset = async (fileUrl?: string): Promise<boolean> => {
  if (!fileUrl) return false;

  // 1. Cloudinary asset
  if (fileUrl.includes('cloudinary.com')) {
    const extracted = extractCloudinaryPublicId(fileUrl);
    if (extracted) {
      try {
        const res = await fetch('/api/delete-asset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: extracted.publicId, resourceType: extracted.resourceType })
        });
        return res.ok;
      } catch (err) {
        console.warn("Could not delete Cloudinary asset:", err);
      }
    }
  }

  // 2. Firebase Storage asset
  if (fileUrl.includes('firebasestorage.googleapis.com')) {
    try {
      const urlObj = new URL(fileUrl);
      const pathname = urlObj.pathname;
      const match = pathname.match(/\/o\/(.+)$/);
      if (match && match[1]) {
        const decodedPath = decodeURIComponent(match[1]);
        const storageRef = ref(storage, decodedPath);
        await deleteObject(storageRef);
        return true;
      }
    } catch (err) {
      console.warn("Could not delete Firebase Storage asset:", err);
    }
  }

  return false;
};

export const deleteContribution = async (id: string) => {
  try {
    const docRef = doc(db, 'contributions', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Permanently remove physical assets from Cloudinary / Firebase Storage
      if (data.file_url) await deleteStorageAsset(data.file_url);
      if (data.solution_url) await deleteStorageAsset(data.solution_url);
    }
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `contributions/${id}`);
  }
};

export const deleteContributionFile = async (id: string, fileType: 'file_url' | 'solution_url') => {
  try {
    const docRef = doc(db, 'contributions', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const targetUrl = data[fileType];
      if (targetUrl) {
        // Permanently remove specific file asset from Cloudinary / Firebase Storage
        await deleteStorageAsset(targetUrl);
      }
    }
    await updateDoc(docRef, { [fileType]: '' });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `contributions/${id}`);
  }
};

export const deleteSubject = async (id: string) => {
  try {
    // Delete related contributions and their underlying files
    const q = query(collection(db, 'contributions'), where('subject_id', '==', id));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      if (data.file_url) await deleteStorageAsset(data.file_url);
      if (data.solution_url) await deleteStorageAsset(data.solution_url);
      return deleteDoc(docSnap.ref);
    });
    await Promise.all(deletePromises);
    
    // Delete the subject
    await deleteDoc(doc(db, 'subjects', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `subjects/${id}`);
  }
};

export const deleteContentType = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'content_types', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `content_types/${id}`);
  }
};

export const deleteExamYear = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'exam_years', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `exam_years/${id}`);
  }
};

export const deleteCollege = async (id: string) => {
  try {
    // Delete related subjects
    const subjectsQ = query(collection(db, 'subjects'), where('college_id', '==', id));
    const subjectsSnap = await getDocs(subjectsQ);
    for (const subjectDoc of subjectsSnap.docs) {
      await deleteSubject(subjectDoc.id);
    }
    
    // Delete related content types
    const typesQ = query(collection(db, 'content_types'), where('college_id', '==', id));
    const typesSnap = await getDocs(typesQ);
    const typesPromises = typesSnap.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(typesPromises);
    
    // Delete related exam years
    const yearsQ = query(collection(db, 'exam_years'), where('college_id', '==', id));
    const yearsSnap = await getDocs(yearsQ);
    const yearsPromises = yearsSnap.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(yearsPromises);
    
    // Delete related contributions
    const contributionsQ = query(collection(db, 'contributions'), where('college_id', '==', id));
    const contributionsSnap = await getDocs(contributionsQ);
    const contributionsPromises = contributionsSnap.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(contributionsPromises);
    
    // Delete the college
    await deleteDoc(doc(db, 'colleges', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `colleges/${id}`);
  }
};

export const setCollegeExamTimer = async (collegeId: string, term: string, date: string) => {
  try {
    const ref = doc(db, 'college_exams', collegeId);
    await setDoc(ref, {
      college_id: collegeId,
      term,
      date,
      updated_at: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `college_exams/${collegeId}`);
  }
};

export const getCollegeExamTimer = async (collegeId: string) => {
  if (!collegeId || collegeId === '0') return null;
  try {
    const ref = doc(db, 'college_exams', collegeId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() as any };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `college_exams/${collegeId}`);
    return null;
  }
};

export const seedDefaultCurriculumData = async () => {
  let countAdded = 0;
  try {
    // 1. Settings / Global
    const globalRef = doc(db, 'settings', 'global');
    const globalSnap = await getDoc(globalRef);
    if (!globalSnap.exists()) {
      await setDoc(globalRef, { ...DEFAULT_GLOBAL_SETTINGS, updated_at: serverTimestamp() });
      countAdded++;
    } else {
      await setDoc(globalRef, { support_email: 'hamroplus2support@gmail.com' }, { merge: true });
    }

    // 2. Content Types for Class 11 and Class 12
    const typesSnap = await getDocs(collection(db, 'content_types'));
    const existingTypes = typesSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
    const defaultTypes = [
      { name: 'syllabus', years: ['Class 11', 'Class 12'] },
      { name: 'notes', years: ['Class 11', 'Class 12'] },
      { name: 'pyq', years: ['Class 11', 'Class 12'] },
      { name: 'solutions', years: ['Class 11', 'Class 12'] },
      { name: 'model_questions', years: ['Class 11', 'Class 12'] }
    ];

    for (const t of defaultTypes) {
      for (const yr of t.years) {
        const exists = existingTypes.some(e => e.name?.toLowerCase() === t.name.toLowerCase() && e.year === yr && (!e.college_id || e.college_id === null));
        if (!exists) {
          await addDoc(collection(db, 'content_types'), {
            name: t.name,
            year: yr,
            college_id: null
          });
          countAdded++;
        }
      }
    }

    // 3. Exam Years for Class 11 and Class 12
    const examYearsSnap = await getDocs(collection(db, 'exam_years'));
    const existingExamYears = examYearsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
    const standardYears = ['2026', '2025', '2024', '2023', '2022', '2021', '2020'];

    for (const yv of standardYears) {
      for (const cl of ['Class 11', 'Class 12']) {
        const exists = existingExamYears.some(e => e.year_value === yv && e.year === cl && (!e.college_id || e.college_id === null));
        if (!exists) {
          await addDoc(collection(db, 'exam_years'), {
            year_value: yv,
            year: cl,
            college_id: null
          });
          countAdded++;
        }
      }
    }

    // 4. Standard Subjects
    const subjectsSnap = await getDocs(collection(db, 'subjects'));
    const existingSubjects = subjectsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

    const standardSubjects = [
      // Class 11 Science
      { name: 'Physics', code: 'PHY-101', stream: 'Science', year: 'Class 11' },
      { name: 'Chemistry', code: 'CHE-101', stream: 'Science', year: 'Class 11' },
      { name: 'Mathematics', code: 'MTH-101', stream: 'Science', year: 'Class 11' },
      { name: 'Biology', code: 'BIO-101', stream: 'Science', year: 'Class 11' },
      { name: 'English', code: 'ENG-101', stream: 'Science', year: 'Class 11' },
      { name: 'Nepali', code: 'NEP-101', stream: 'Science', year: 'Class 11' },
      { name: 'Computer Science', code: 'COM-101', stream: 'Science', year: 'Class 11' },

      // Class 12 Science
      { name: 'Physics', code: 'PHY-201', stream: 'Science', year: 'Class 12' },
      { name: 'Chemistry', code: 'CHE-201', stream: 'Science', year: 'Class 12' },
      { name: 'Mathematics', code: 'MTH-201', stream: 'Science', year: 'Class 12' },
      { name: 'Biology', code: 'BIO-201', stream: 'Science', year: 'Class 12' },
      { name: 'English', code: 'ENG-201', stream: 'Science', year: 'Class 12' },
      { name: 'Nepali', code: 'NEP-201', stream: 'Science', year: 'Class 12' },
      { name: 'Computer Science', code: 'COM-201', stream: 'Science', year: 'Class 12' },

      // Class 11 Management
      { name: 'Accountancy', code: 'ACC-101', stream: 'Management', year: 'Class 11' },
      { name: 'Economics', code: 'ECO-101', stream: 'Management', year: 'Class 11' },
      { name: 'Business Studies', code: 'BST-101', stream: 'Management', year: 'Class 11' },
      { name: 'English', code: 'ENG-101', stream: 'Management', year: 'Class 11' },
      { name: 'Nepali', code: 'NEP-101', stream: 'Management', year: 'Class 11' },
      { name: 'Basic Mathematics', code: 'BMTH-101', stream: 'Management', year: 'Class 11' },
      { name: 'Computer Science', code: 'COM-101', stream: 'Management', year: 'Class 11' },

      // Class 12 Management
      { name: 'Accountancy', code: 'ACC-201', stream: 'Management', year: 'Class 12' },
      { name: 'Economics', code: 'ECO-201', stream: 'Management', year: 'Class 12' },
      { name: 'Business Studies', code: 'BST-201', stream: 'Management', year: 'Class 12' },
      { name: 'English', code: 'ENG-201', stream: 'Management', year: 'Class 12' },
      { name: 'Nepali', code: 'NEP-201', stream: 'Management', year: 'Class 12' },
      { name: 'Business Mathematics', code: 'BMTH-201', stream: 'Management', year: 'Class 12' },
      { name: 'Computer Science', code: 'COM-201', stream: 'Management', year: 'Class 12' }
    ];

    for (const s of standardSubjects) {
      const exists = existingSubjects.some(e => 
        e.name?.toLowerCase() === s.name.toLowerCase() && 
        e.stream?.toLowerCase() === s.stream.toLowerCase() && 
        e.year === s.year && 
        (!e.college_id || e.college_id === null)
      );
      if (!exists) {
        await addDoc(collection(db, 'subjects'), {
          name: s.name,
          code: s.code,
          stream: s.stream,
          year: s.year,
          college_id: null
        });
        countAdded++;
      }
    }

    return { success: true, countAdded };
  } catch (error: any) {
    console.error("Error in seedDefaultCurriculumData:", error);
    throw error;
  }
};

export interface PurgeResult {
  materialsCount: number;
  filesDeletedCount: number;
  messagesCount: number;
  notificationsCount: number;
  contactMessagesCount: number;
  withdrawalsCount: number;
}

export const purgeAllPreviousData = async (
  options: {
    wipeMaterials?: boolean;
    wipeMessages?: boolean;
    wipeNotifications?: boolean;
    wipeContacts?: boolean;
    wipeWithdrawals?: boolean;
    wipeCurriculum?: boolean;
    reseedCurriculum?: boolean;
  } = {},
  onProgress?: (msg: string, percent: number) => void
): Promise<PurgeResult> => {
  const wipeMaterials = options.wipeMaterials !== false;
  const wipeMessages = options.wipeMessages !== false;
  const wipeNotifications = options.wipeNotifications !== false;
  const wipeContacts = options.wipeContacts !== false;
  const wipeWithdrawals = options.wipeWithdrawals !== false;
  const wipeCurriculum = options.wipeCurriculum === true;
  const reseedCurriculum = options.reseedCurriculum !== false;

  let materialsCount = 0;
  let filesDeletedCount = 0;
  let messagesCount = 0;
  let notificationsCount = 0;
  let contactMessagesCount = 0;
  let withdrawalsCount = 0;

  // 1. Purge Materials (contributions & academic_resources) + Cloudinary/Firebase files
  if (wipeMaterials) {
    onProgress?.('Fetching uploaded materials...', 10);
    try {
      const contribSnap = await getDocs(collection(db, 'contributions'));
      materialsCount += contribSnap.size;
      let count = 0;
      for (const d of contribSnap.docs) {
        count++;
        onProgress?.(`Deleting material ${count}/${contribSnap.size} & cloud files...`, 10 + Math.round((count / Math.max(1, contribSnap.size)) * 30));
        const data = d.data();
        if (data.file_url) {
          await deleteStorageAsset(data.file_url);
          filesDeletedCount++;
        }
        if (data.solution_url) {
          await deleteStorageAsset(data.solution_url);
          filesDeletedCount++;
        }
        await deleteDoc(d.ref);
      }
    } catch (err) {
      console.warn("Error wiping contributions:", err);
    }

    try {
      const resSnap = await getDocs(collection(db, 'academic_resources'));
      materialsCount += resSnap.size;
      for (const d of resSnap.docs) {
        const data = d.data();
        if (data.cloudinary_public_id) {
          await fetch('/api/delete-asset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId: data.cloudinary_public_id, resourceType: 'image' })
          }).catch(() => null);
          filesDeletedCount++;
        }
        await deleteDoc(d.ref);
      }
    } catch (err) {
      console.warn("Error wiping academic_resources:", err);
    }
  }

  // 2. Purge Messages
  if (wipeMessages) {
    onProgress?.('Purging chat messages...', 45);
    try {
      const msgSnap = await getDocs(collection(db, 'messages'));
      messagesCount = msgSnap.size;
      for (let i = 0; i < msgSnap.docs.length; i += 300) {
        const chunk = msgSnap.docs.slice(i, i + 300);
        const batch = writeBatch(db);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (err) {
      console.warn("Error wiping messages:", err);
    }
  }

  // 3. Purge Notifications
  if (wipeNotifications) {
    onProgress?.('Purging notifications...', 60);
    try {
      const notifSnap = await getDocs(collection(db, 'notifications'));
      notificationsCount = notifSnap.size;
      const batch = writeBatch(db);
      notifSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (err) {
      console.warn("Error wiping notifications:", err);
    }
  }

  // 4. Purge Contact Inquiries
  if (wipeContacts) {
    onProgress?.('Purging contact inquiries...', 70);
    try {
      const contactSnap = await getDocs(collection(db, 'contact_messages'));
      contactMessagesCount = contactSnap.size;
      const batch = writeBatch(db);
      contactSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (err) {
      console.warn("Error wiping contact_messages:", err);
    }
  }

  // 5. Purge Withdrawals & Subscriptions
  if (wipeWithdrawals) {
    onProgress?.('Purging withdrawals & subscription requests...', 80);
    try {
      const withSnap = await getDocs(collection(db, 'withdrawals'));
      withdrawalsCount = withSnap.size;
      const batch = writeBatch(db);
      withSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();

      const subSnap = await getDocs(collection(db, 'subscription_requests'));
      const subBatch = writeBatch(db);
      subSnap.docs.forEach(d => subBatch.delete(d.ref));
      await subBatch.commit();

      const bookmarkSnap = await getDocs(collection(db, 'bookmarks'));
      const bmBatch = writeBatch(db);
      bookmarkSnap.docs.forEach(d => bmBatch.delete(d.ref));
      await bmBatch.commit();
    } catch (err) {
      console.warn("Error wiping withdrawals/subscriptions/bookmarks:", err);
    }
  }

  // 6. Optional: Reset Curriculum
  if (wipeCurriculum) {
    onProgress?.('Resetting curriculum data...', 90);
    try {
      for (const col of ['subjects', 'content_types', 'exam_years']) {
        const snap = await getDocs(collection(db, col));
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
      if (reseedCurriculum) {
        onProgress?.('Reseeding fresh standard NEB curriculum...', 95);
        await seedDefaultCurriculumData();
      }
    } catch (err) {
      console.warn("Error resetting curriculum:", err);
    }
  }

  onProgress?.('All data successfully purged!', 100);

  return {
    materialsCount,
    filesDeletedCount,
    messagesCount,
    notificationsCount,
    contactMessagesCount,
    withdrawalsCount
  };
};
