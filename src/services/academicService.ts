import { db, auth } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import {
  uploadPdfToCloudinary,
  deleteResource,
  slugify,
  AcademicResource,
  generateCloudinaryPath
} from './resourceManager';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type ItemStatus = 'active' | 'archived';
export type ResourceStatus = 'published' | 'premium_only' | 'draft' | 'archived';

export interface College {
  id: string;
  name: string;
  code?: string;
  location?: string;
  address?: string;
  description?: string;
  status: ItemStatus;
  created_at?: Timestamp | any;
  updated_at?: Timestamp | any;
}

export interface AcademicClass {
  id: string;
  college_id?: string | null; // null or '0' means Global / applicable to all colleges
  college_name?: string;
  class_name: string; // e.g. "Class 11", "Class 12"
  class_number: string; // e.g. "11", "12"
  description?: string;
  status: ItemStatus;
  created_at?: Timestamp | any;
  updated_at?: Timestamp | any;
}

export interface AcademicStream {
  id: string;
  college_id?: string | null;
  college_name?: string;
  class_id?: string | null;
  class_name?: string;
  stream_name: string; // e.g. "Science", "Management", "Humanities"
  description?: string;
  status: ItemStatus;
  created_at?: Timestamp | any;
  updated_at?: Timestamp | any;
}

export interface AcademicSubject {
  id: string;
  college_id?: string | null;
  college_name?: string;
  class_id?: string | null;
  class_name?: string;
  stream_id?: string | null;
  stream_name?: string;
  name: string;
  subject_code?: string;
  description?: string;
  year?: string; // Kept for backward compatibility e.g. "Class 11"
  stream?: string; // Kept for backward compatibility e.g. "Science"
  status: ItemStatus;
  created_at?: Timestamp | any;
  updated_at?: Timestamp | any;
}

export interface EducationalResourceItem {
  id: string;
  title: string;
  resource_type: 'notes' | 'syllabus' | 'pyq' | 'solution' | 'question_paper';
  college_id?: string | null;
  college_name: string;
  college_slug: string;
  class_id?: string | null;
  class_level: string; // e.g. "Class 11"
  stream_id?: string | null;
  stream: string; // e.g. "Science"
  subject_id?: string | null;
  subject: string; // e.g. "Physics"
  academic_year?: string;
  term?: string;
  exam_year?: string;
  examination_name?: string;
  chapter_name?: string;
  description?: string;
  pdf_filename: string;
  cloudinary_public_id: string;
  cloudinary_secure_url: string;
  cloudinary_folder?: string;
  linked_question_paper_id?: string;
  linked_question_paper_title?: string;
  status: ResourceStatus;
  access_level?: 'free' | 'premium';
  user_id?: string;
  user_name?: string;
  user_email?: string;
  created_at?: Timestamp | any;
  updated_at?: Timestamp | any;
}

export interface DependencyCount {
  classes: number;
  streams: number;
  subjects: number;
  resources: number;
}

// ============================================================================
// Helper Utilities
// ============================================================================

const cleanId = (val?: string | null) => {
  if (!val || val === '0' || val === 'all' || val === 'global') return null;
  return val;
};

// ============================================================================
// 1. College Operations
// ============================================================================

export const getCollegesList = async (includeArchived = false): Promise<College[]> => {
  try {
    const snap = await getDocs(collection(db, 'colleges'));
    const list = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || '',
        code: data.code || '',
        location: data.location || data.address || '',
        description: data.description || '',
        status: data.status || 'active',
        created_at: data.created_at,
        updated_at: data.updated_at
      } as College;
    });

    if (!includeArchived) {
      return list.filter(c => c.status !== 'archived');
    }
    return list;
  } catch (err) {
    console.error('Error fetching colleges list:', err);
    return [];
  }
};

export const createCollege = async (data: {
  name: string;
  code?: string;
  location?: string;
  description?: string;
}): Promise<string> => {
  const normalizedName = data.name.trim().toLowerCase();
  const existing = await getCollegesList(true);
  const duplicate = existing.find(c => c.name.trim().toLowerCase() === normalizedName);
  if (duplicate) {
    throw new Error(`A college with name "${data.name.trim()}" already exists.`);
  }

  const docRef = await addDoc(collection(db, 'colleges'), {
    name: data.name.trim(),
    code: data.code?.trim() || '',
    location: data.location?.trim() || '',
    address: data.location?.trim() || '',
    description: data.description?.trim() || '',
    status: 'active',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });

  return docRef.id;
};

export const updateCollege = async (
  collegeId: string,
  data: Partial<Omit<College, 'id' | 'created_at'>>
): Promise<void> => {
  if (data.name) {
    const normalizedName = data.name.trim().toLowerCase();
    const existing = await getCollegesList(true);
    const duplicate = existing.find(c => c.id !== collegeId && c.name.trim().toLowerCase() === normalizedName);
    if (duplicate) {
      throw new Error(`Another college with name "${data.name.trim()}" already exists.`);
    }
  }

  await updateDoc(doc(db, 'colleges', collegeId), {
    ...data,
    updated_at: serverTimestamp()
  });
};

export const toggleCollegeStatus = async (collegeId: string, newStatus: ItemStatus): Promise<void> => {
  await updateDoc(doc(db, 'colleges', collegeId), {
    status: newStatus,
    updated_at: serverTimestamp()
  });
};

export const getCollegeDependencies = async (collegeId: string): Promise<DependencyCount> => {
  const result: DependencyCount = { classes: 0, streams: 0, subjects: 0, resources: 0 };
  try {
    const [clsSnap, strSnap, subSnap, resSnap] = await Promise.all([
      getDocs(query(collection(db, 'classes'), where('college_id', '==', collegeId))),
      getDocs(query(collection(db, 'streams'), where('college_id', '==', collegeId))),
      getDocs(query(collection(db, 'subjects'), where('college_id', '==', collegeId))),
      getDocs(query(collection(db, 'academic_resources'), where('college_id', '==', collegeId)))
    ]);

    result.classes = clsSnap.size;
    result.streams = strSnap.size;
    result.subjects = subSnap.size;
    result.resources = resSnap.size;
  } catch (err) {
    console.warn('Error counting college dependencies:', err);
  }
  return result;
};

export const deleteCollegePermanent = async (collegeId: string): Promise<void> => {
  await deleteDoc(doc(db, 'colleges', collegeId));
};

// ============================================================================
// 2. Class Operations
// ============================================================================

export const getClassesList = async (
  collegeId?: string | null,
  includeArchived = false
): Promise<AcademicClass[]> => {
  try {
    const snap = await getDocs(collection(db, 'classes'));
    let list = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        college_id: data.college_id || null,
        college_name: data.college_name || '',
        class_name: data.class_name || data.name || '',
        class_number: data.class_number || '',
        description: data.description || '',
        status: data.status || 'active',
        created_at: data.created_at,
        updated_at: data.updated_at
      } as AcademicClass;
    });

    if (collegeId && collegeId !== 'all') {
      const cId = cleanId(collegeId);
      list = list.filter(c => !c.college_id || c.college_id === cId);
    }

    if (!includeArchived) {
      list = list.filter(c => c.status !== 'archived');
    }

    // Default system seed if collection is completely empty
    if (list.length === 0 && !collegeId) {
      return [
        { id: 'default-class-11', class_name: 'Class 11', class_number: '11', status: 'active' },
        { id: 'default-class-12', class_name: 'Class 12', class_number: '12', status: 'active' }
      ];
    }

    return list;
  } catch (err) {
    console.error('Error fetching classes:', err);
    return [
      { id: 'default-class-11', class_name: 'Class 11', class_number: '11', status: 'active' },
      { id: 'default-class-12', class_name: 'Class 12', class_number: '12', status: 'active' }
    ];
  }
};

export const createClass = async (data: {
  college_id?: string | null;
  college_name?: string;
  class_name: string;
  class_number?: string;
  description?: string;
}): Promise<string> => {
  const normName = data.class_name.trim();
  const cId = cleanId(data.college_id);

  // Check duplicate in same college scope
  const existing = await getClassesList(cId, true);
  const dup = existing.find(c => c.class_name.toLowerCase() === normName.toLowerCase() && cleanId(c.college_id) === cId);
  if (dup) {
    throw new Error(`Class "${normName}" already exists for this college.`);
  }

  const docRef = await addDoc(collection(db, 'classes'), {
    college_id: cId,
    college_name: data.college_name || '',
    class_name: normName,
    class_number: data.class_number?.trim() || normName.replace(/\D/g, '') || normName,
    description: data.description?.trim() || '',
    status: 'active',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });

  return docRef.id;
};

export const updateClass = async (
  classId: string,
  data: Partial<Omit<AcademicClass, 'id' | 'created_at'>>
): Promise<void> => {
  await updateDoc(doc(db, 'classes', classId), {
    ...data,
    updated_at: serverTimestamp()
  });
};

export const toggleClassStatus = async (classId: string, newStatus: ItemStatus): Promise<void> => {
  await updateDoc(doc(db, 'classes', classId), {
    status: newStatus,
    updated_at: serverTimestamp()
  });
};

export const getClassDependencies = async (classId: string, className?: string): Promise<DependencyCount> => {
  const result: DependencyCount = { classes: 0, streams: 0, subjects: 0, resources: 0 };
  try {
    const [strSnap, subSnap, resSnap] = await Promise.all([
      getDocs(query(collection(db, 'streams'), where('class_id', '==', classId))),
      getDocs(query(collection(db, 'subjects'), where('class_id', '==', classId))),
      getDocs(query(collection(db, 'academic_resources'), where('class_id', '==', classId)))
    ]);

    result.streams = strSnap.size;
    result.subjects = subSnap.size;
    result.resources = resSnap.size;

    // Fallback check by class_name for resources created prior to class_id
    if (result.resources === 0 && className) {
      const resNameSnap = await getDocs(
        query(collection(db, 'academic_resources'), where('class_level', '==', className))
      );
      result.resources = resNameSnap.size;
    }
  } catch (err) {
    console.warn('Error counting class dependencies:', err);
  }
  return result;
};

export const deleteClassPermanent = async (classId: string): Promise<void> => {
  await deleteDoc(doc(db, 'classes', classId));
};

// ============================================================================
// 3. Stream Operations
// ============================================================================

export const getStreamsList = async (
  collegeId?: string | null,
  classId?: string | null,
  includeArchived = false
): Promise<AcademicStream[]> => {
  try {
    const snap = await getDocs(collection(db, 'streams'));
    let list = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        college_id: data.college_id || null,
        college_name: data.college_name || '',
        class_id: data.class_id || null,
        class_name: data.class_name || '',
        stream_name: data.stream_name || data.name || '',
        description: data.description || '',
        status: data.status || 'active',
        created_at: data.created_at,
        updated_at: data.updated_at
      } as AcademicStream;
    });

    if (collegeId && collegeId !== 'all') {
      const cId = cleanId(collegeId);
      list = list.filter(s => !s.college_id || s.college_id === cId);
    }

    if (classId && classId !== 'all') {
      const clsId = cleanId(classId);
      list = list.filter(s => !s.class_id || s.class_id === clsId);
    }

    if (!includeArchived) {
      list = list.filter(s => s.status !== 'archived');
    }

    // Default stream seeds if completely empty
    if (list.length === 0 && !collegeId && !classId) {
      return [
        { id: 'default-stream-science', stream_name: 'Science', status: 'active' },
        { id: 'default-stream-management', stream_name: 'Management', status: 'active' },
        { id: 'default-stream-humanities', stream_name: 'Humanities', status: 'active' }
      ];
    }

    return list;
  } catch (err) {
    console.error('Error fetching streams:', err);
    return [
      { id: 'default-stream-science', stream_name: 'Science', status: 'active' },
      { id: 'default-stream-management', stream_name: 'Management', status: 'active' },
      { id: 'default-stream-humanities', stream_name: 'Humanities', status: 'active' }
    ];
  }
};

export const createStream = async (data: {
  college_id?: string | null;
  college_name?: string;
  class_id?: string | null;
  class_name?: string;
  stream_name: string;
  description?: string;
}): Promise<string> => {
  const normName = data.stream_name.trim();
  const cId = cleanId(data.college_id);
  const clsId = cleanId(data.class_id);

  const existing = await getStreamsList(cId, clsId, true);
  const dup = existing.find(
    s => s.stream_name.toLowerCase() === normName.toLowerCase() &&
         cleanId(s.college_id) === cId &&
         cleanId(s.class_id) === clsId
  );
  if (dup) {
    throw new Error(`Stream "${normName}" already exists for this class.`);
  }

  const docRef = await addDoc(collection(db, 'streams'), {
    college_id: cId,
    college_name: data.college_name || '',
    class_id: clsId,
    class_name: data.class_name || '',
    stream_name: normName,
    description: data.description?.trim() || '',
    status: 'active',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });

  return docRef.id;
};

export const updateStream = async (
  streamId: string,
  data: Partial<Omit<AcademicStream, 'id' | 'created_at'>>
): Promise<void> => {
  await updateDoc(doc(db, 'streams', streamId), {
    ...data,
    updated_at: serverTimestamp()
  });
};

export const toggleStreamStatus = async (streamId: string, newStatus: ItemStatus): Promise<void> => {
  await updateDoc(doc(db, 'streams', streamId), {
    status: newStatus,
    updated_at: serverTimestamp()
  });
};

export const getStreamDependencies = async (streamId: string, streamName?: string): Promise<DependencyCount> => {
  const result: DependencyCount = { classes: 0, streams: 0, subjects: 0, resources: 0 };
  try {
    const [subSnap, resSnap] = await Promise.all([
      getDocs(query(collection(db, 'subjects'), where('stream_id', '==', streamId))),
      getDocs(query(collection(db, 'academic_resources'), where('stream_id', '==', streamId)))
    ]);

    result.subjects = subSnap.size;
    result.resources = resSnap.size;

    if (result.resources === 0 && streamName) {
      const resNameSnap = await getDocs(
        query(collection(db, 'academic_resources'), where('stream', '==', streamName))
      );
      result.resources = resNameSnap.size;
    }
  } catch (err) {
    console.warn('Error counting stream dependencies:', err);
  }
  return result;
};

export const deleteStreamPermanent = async (streamId: string): Promise<void> => {
  await deleteDoc(doc(db, 'streams', streamId));
};

// ============================================================================
// 4. Subject Operations
// ============================================================================

export const getSubjectsList = async (
  collegeId?: string | null,
  classId?: string | null,
  streamId?: string | null,
  includeArchived = false
): Promise<AcademicSubject[]> => {
  try {
    const snap = await getDocs(collection(db, 'subjects'));
    let list = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        college_id: data.college_id || null,
        college_name: data.college_name || '',
        class_id: data.class_id || null,
        class_name: data.class_name || data.year || '',
        stream_id: data.stream_id || null,
        stream_name: data.stream_name || data.stream || '',
        name: data.name || '',
        subject_code: data.subject_code || '',
        description: data.description || '',
        year: data.year || data.class_name || 'Class 11',
        stream: data.stream || data.stream_name || 'Science',
        status: data.status || 'active',
        created_at: data.created_at,
        updated_at: data.updated_at
      } as AcademicSubject;
    });

    if (collegeId && collegeId !== 'all') {
      const cId = cleanId(collegeId);
      list = list.filter(s => !s.college_id || s.college_id === cId);
    }

    if (classId && classId !== 'all') {
      const clsId = cleanId(classId);
      list = list.filter(s => {
        if (!s.class_id && !clsId) return true;
        return s.class_id === clsId || s.year === classId;
      });
    }

    if (streamId && streamId !== 'all') {
      const strId = cleanId(streamId);
      list = list.filter(s => {
        if (!s.stream_id && !strId) return true;
        return s.stream_id === strId || s.stream?.toLowerCase() === streamId.toLowerCase();
      });
    }

    if (!includeArchived) {
      list = list.filter(s => s.status !== 'archived');
    }

    return list;
  } catch (err) {
    console.error('Error fetching subjects list:', err);
    return [];
  }
};

export const createSubject = async (data: {
  college_id?: string | null;
  college_name?: string;
  class_id?: string | null;
  class_name?: string;
  stream_id?: string | null;
  stream_name?: string;
  name: string;
  subject_code?: string;
  description?: string;
  year?: string;
  stream?: string;
}): Promise<string> => {
  const normName = data.name.trim();
  const cId = cleanId(data.college_id);
  const clsId = cleanId(data.class_id);
  const strId = cleanId(data.stream_id);
  const yearVal = data.year || data.class_name || 'Class 11';
  const streamVal = data.stream || data.stream_name || 'Science';

  // Prevent duplicates within same college, class, stream
  const existing = await getSubjectsList(cId, clsId || yearVal, strId || streamVal, true);
  const dup = existing.find(s => s.name.toLowerCase() === normName.toLowerCase());
  if (dup) {
    throw new Error(`Subject "${normName}" already exists in this stream.`);
  }

  const docRef = await addDoc(collection(db, 'subjects'), {
    college_id: cId,
    college_name: data.college_name || '',
    class_id: clsId,
    class_name: yearVal,
    stream_id: strId,
    stream_name: streamVal,
    name: normName,
    subject_code: data.subject_code?.trim() || '',
    description: data.description?.trim() || '',
    year: yearVal,
    stream: streamVal,
    status: 'active',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });

  return docRef.id;
};

export const updateSubject = async (
  subjectId: string,
  data: Partial<Omit<AcademicSubject, 'id' | 'created_at'>>
): Promise<void> => {
  await updateDoc(doc(db, 'subjects', subjectId), {
    ...data,
    updated_at: serverTimestamp()
  });
};

export const toggleSubjectStatus = async (subjectId: string, newStatus: ItemStatus): Promise<void> => {
  await updateDoc(doc(db, 'subjects', subjectId), {
    status: newStatus,
    updated_at: serverTimestamp()
  });
};

export const getSubjectDependencies = async (subjectId: string, subjectName?: string): Promise<DependencyCount> => {
  const result: DependencyCount = { classes: 0, streams: 0, subjects: 0, resources: 0 };
  try {
    const resSnap = await getDocs(
      query(collection(db, 'academic_resources'), where('subject_id', '==', subjectId))
    );
    result.resources = resSnap.size;

    if (result.resources === 0 && subjectName) {
      const resNameSnap = await getDocs(
        query(collection(db, 'academic_resources'), where('subject', '==', subjectName))
      );
      result.resources = resNameSnap.size;
    }
  } catch (err) {
    console.warn('Error counting subject dependencies:', err);
  }
  return result;
};

export const deleteSubjectPermanent = async (subjectId: string): Promise<void> => {
  await deleteDoc(doc(db, 'subjects', subjectId));
};

// ============================================================================
// 5. Educational Content Operations (Notes, Syllabus, PYQs, PYQ Solutions)
// ============================================================================

export interface ResourceFilterParams {
  collegeId?: string;
  classId?: string;
  streamId?: string;
  subjectId?: string;
  contentType?: string; // 'notes' | 'syllabus' | 'pyq' | 'solution' | 'all'
  academicYear?: string;
  status?: string; // 'published' | 'draft' | 'archived' | 'all'
  search?: string;
}

export const getEducationalResources = async (
  filters: ResourceFilterParams = {}
): Promise<EducationalResourceItem[]> => {
  try {
    let items: EducationalResourceItem[] = [];
    const seenIds = new Set<string>();

    // 1. Fetch from academic_resources
    try {
      const snap = await getDocs(collection(db, 'academic_resources'));
      snap.docs.forEach(d => {
        const data = d.data();
        seenIds.add(d.id);
        if (data.cloudinary_public_id) seenIds.add(data.cloudinary_public_id);
        items.push({
          id: d.id,
          title: data.title || data.description || 'Untitled Document',
          resource_type: data.resource_type || 'notes',
          college_id: data.college_id || null,
          college_name: data.college_name || 'Global',
          college_slug: data.college_slug || 'universal',
          class_id: data.class_id || null,
          class_level: data.class_level || 'Class 11',
          stream_id: data.stream_id || null,
          stream: data.stream || 'Science',
          subject_id: data.subject_id || null,
          subject: data.subject || '',
          academic_year: data.academic_year || data.year || '',
          term: data.term || '',
          exam_year: data.exam_year || data.year || '',
          examination_name: data.examination_name || '',
          chapter_name: data.chapter_name || '',
          description: data.description || '',
          pdf_filename: data.pdf_filename || '',
          cloudinary_public_id: data.cloudinary_public_id || '',
          cloudinary_secure_url: data.cloudinary_secure_url || data.file_url || '',
          cloudinary_folder: data.cloudinary_folder || '',
          linked_question_paper_id: data.linked_question_paper_id || '',
          linked_question_paper_title: data.linked_question_paper_title || '',
          status: data.status || 'published',
          access_level: data.access_level || 'free',
          user_id: data.user_id || '',
          user_name: data.user_name || '',
          user_email: data.user_email || '',
          created_at: data.created_at,
          updated_at: data.updated_at
        });
      });
    } catch (err) {
      console.warn('Could not read academic_resources collection:', err);
    }

    // 2. Also include verified items from contributions
    try {
      const contribSnap = await getDocs(query(collection(db, 'contributions'), where('status', '==', 'verified')));
      contribSnap.docs.forEach(d => {
        if (!seenIds.has(d.id)) {
          const data = d.data();
          const rawType = (data.type || '').toLowerCase();
          const resType = rawType.includes('note') ? 'notes' : (rawType.includes('pyq') || rawType.includes('question') ? 'pyq' : (rawType.includes('syllabus') ? 'syllabus' : 'notes'));
          items.push({
            id: d.id,
            title: data.title || data.description || 'Study Resource',
            resource_type: resType as any,
            college_id: data.college_id || null,
            college_name: data.college_name || 'Global',
            college_slug: slugify(data.college_name || 'universal'),
            class_id: null,
            class_level: data.year || 'Class 11',
            stream_id: null,
            stream: data.stream || 'Science',
            subject_id: data.subject_id || null,
            subject: data.subject_name || data.subject || 'General',
            academic_year: data.exam_year || '2081',
            term: data.term || 'Final Term',
            exam_year: data.exam_year || '2081',
            examination_name: data.title || '',
            description: data.description || '',
            pdf_filename: '',
            cloudinary_public_id: '',
            cloudinary_secure_url: data.file_url || '',
            cloudinary_folder: '',
            linked_question_paper_id: '',
            linked_question_paper_title: '',
            status: 'published',
            access_level: data.access_level || 'free',
            user_id: data.user_id || '',
            user_name: data.user_name || 'Contributor',
            user_email: data.user_email || '',
            created_at: data.created_at,
            updated_at: data.updated_at
          });
        }
      });
    } catch (err) {
      console.warn('Could not read contributions collection for resources:', err);
    }

    // Apply multi-faceted cascading filters
    if (filters.collegeId && filters.collegeId !== 'all') {
      const cId = cleanId(filters.collegeId);
      items = items.filter(i => {
        if (!cId) return !i.college_id || i.college_id === '0';
        return i.college_id === cId || i.college_name?.toLowerCase().includes(filters.collegeId!.toLowerCase());
      });
    }

    if (filters.classId && filters.classId !== 'all') {
      const cls = filters.classId.toLowerCase();
      items = items.filter(i => {
        return (i.class_id && i.class_id === filters.classId) ||
               i.class_level.toLowerCase().includes(cls);
      });
    }

    if (filters.streamId && filters.streamId !== 'all') {
      const str = filters.streamId.toLowerCase();
      items = items.filter(i => {
        return (i.stream_id && i.stream_id === filters.streamId) ||
               i.stream.toLowerCase().includes(str);
      });
    }

    if (filters.subjectId && filters.subjectId !== 'all') {
      const sub = filters.subjectId.toLowerCase();
      items = items.filter(i => {
        return (i.subject_id && i.subject_id === filters.subjectId) ||
               i.subject.toLowerCase().includes(sub);
      });
    }

    if (filters.contentType && filters.contentType !== 'all') {
      const t = filters.contentType.toLowerCase();
      items = items.filter(i => {
        const itemType = i.resource_type.toLowerCase();
        if (t === 'notes' || t === 'note') return itemType === 'notes' || itemType === 'note';
        if (t === 'pyq' || t === 'question_paper') return itemType === 'pyq' || itemType === 'question_paper';
        if (t === 'solution' || t === 'solutions') return itemType === 'solution' || itemType === 'solutions';
        if (t === 'syllabus') return itemType === 'syllabus';
        return itemType === t;
      });
    }

    if (filters.academicYear && filters.academicYear !== 'all') {
      items = items.filter(i => i.academic_year === filters.academicYear || i.exam_year === filters.academicYear);
    }

    if (filters.status && filters.status !== 'all') {
      items = items.filter(i => i.status === filters.status);
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      items = items.filter(i => {
        return i.title.toLowerCase().includes(q) ||
               i.subject.toLowerCase().includes(q) ||
               i.chapter_name?.toLowerCase().includes(q) ||
               i.examination_name?.toLowerCase().includes(q) ||
               i.description?.toLowerCase().includes(q) ||
               i.college_name.toLowerCase().includes(q) ||
               i.exam_year?.toLowerCase().includes(q);
      });
    }

    // Sort by created_at descending
    items.sort((a, b) => {
      const tA = a.created_at?.toDate ? a.created_at.toDate().getTime() : 0;
      const tB = b.created_at?.toDate ? b.created_at.toDate().getTime() : 0;
      return tB - tA;
    });

    return items;
  } catch (err) {
    console.error('Error fetching educational resources:', err);
    return [];
  }
};

/**
 * Fetch existing Question Papers to link a PYQ Solution to
 */
export const getAvailableQuestionPapers = async (
  collegeId?: string | null,
  classLevel?: string,
  stream?: string,
  subject?: string
): Promise<EducationalResourceItem[]> => {
  const allResources = await getEducationalResources({
    contentType: 'pyq',
    status: 'published'
  });

  return allResources.filter(r => {
    const matchCollege = !collegeId || collegeId === '0' || r.college_id === collegeId;
    const matchClass = !classLevel || r.class_level.toLowerCase() === classLevel.toLowerCase();
    const matchStream = !stream || r.stream.toLowerCase() === stream.toLowerCase();
    const matchSubj = !subject || r.subject.toLowerCase() === subject.toLowerCase();
    return matchCollege && matchClass && matchStream && matchSubj;
  });
};

/**
 * Upload and save a new educational resource
 */
export const uploadEducationalResource = async (
  resourceData: {
    college_id?: string | null;
    college_name: string;
    class_id?: string | null;
    class_level: string;
    stream_id?: string | null;
    stream: string;
    subject_id?: string | null;
    subject: string;
    resource_type: 'notes' | 'syllabus' | 'pyq' | 'solution';
    title: string;
    chapter_name?: string;
    academic_year?: string;
    term?: string;
    exam_year?: string;
    examination_name?: string;
    description?: string;
    access_level?: 'free' | 'premium';
    status?: ResourceStatus;
    linked_question_paper_id?: string;
    linked_question_paper_title?: string;
  },
  file: File,
  currentUser?: any
): Promise<string> => {
  // Validate solution requirement
  if (resourceData.resource_type === 'solution' && !resourceData.linked_question_paper_id) {
    throw new Error('PYQ Solution must be linked to an existing question paper.');
  }

  // 1. Generate folder path according to academic hierarchy
  const folderPath = generateCloudinaryPath({
    college: resourceData.college_name || 'universal',
    classLevel: resourceData.class_level || 'class11',
    stream: resourceData.stream || 'science',
    resourceType: resourceData.resource_type === 'notes' ? 'note' : (resourceData.resource_type === 'pyq' ? 'question_paper' : resourceData.resource_type),
    subject: resourceData.subject || 'general',
    term: resourceData.term || 'final',
    year: resourceData.exam_year || resourceData.academic_year || new Date().getFullYear().toString()
  });

  // 2. Upload file to Cloudinary
  const uploadResult = await uploadPdfToCloudinary(file, folderPath);

  // 3. Save to Firestore
  let docId = '';
  const currentUid = auth.currentUser?.uid || currentUser?.id || 'admin';
  const currentName = currentUser?.name || auth.currentUser?.displayName || 'Administrator';
  const currentEmail = currentUser?.email || auth.currentUser?.email || 'admin@hamroplus2.com.np';

  const mappedType = resourceData.resource_type === 'notes' ? 'Notes' : 
                     (resourceData.resource_type === 'pyq' ? 'PYQ' : 
                     (resourceData.resource_type === 'syllabus' ? 'Syllabus' : 'PYQ'));

  // 3a. Save to academic_resources (new dynamic hierarchy collection)
  const isPremiumOnly = resourceData.status === 'premium_only';
  const computedAccessLevel = isPremiumOnly ? 'premium' : (resourceData.access_level || 'free');

  try {
    const docRef = await addDoc(collection(db, 'academic_resources'), {
      title: resourceData.title.trim(),
      resource_type: resourceData.resource_type,
      college_id: cleanId(resourceData.college_id),
      college_name: resourceData.college_name,
      college_slug: slugify(resourceData.college_name),
      class_id: cleanId(resourceData.class_id),
      class_level: resourceData.class_level,
      stream_id: cleanId(resourceData.stream_id),
      stream: resourceData.stream,
      subject_id: cleanId(resourceData.subject_id),
      subject: resourceData.subject,
      academic_year: resourceData.academic_year || '',
      term: resourceData.term || '',
      exam_year: resourceData.exam_year || '',
      examination_name: resourceData.examination_name || '',
      chapter_name: resourceData.chapter_name || '',
      description: resourceData.description || '',
      pdf_filename: uploadResult.fileName,
      cloudinary_public_id: uploadResult.public_id,
      cloudinary_secure_url: uploadResult.secure_url,
      cloudinary_folder: uploadResult.folder,
      linked_question_paper_id: resourceData.linked_question_paper_id || null,
      linked_question_paper_title: resourceData.linked_question_paper_title || '',
      status: resourceData.status || 'published',
      access_level: computedAccessLevel,
      user_id: currentUid,
      user_name: currentName,
      user_email: currentEmail,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    docId = docRef.id;
  } catch (academicErr: any) {
    console.warn('Could not write to academic_resources (Firestore security rules might need publishing):', academicErr);
  }

  // 3b. Dual-write to contributions collection so that student pages (/pyq, /syllabus) immediately display the verified material
  try {
    const contribRef = await addDoc(collection(db, 'contributions'), {
      user_id: currentUid,
      user_name: currentName,
      user_email: currentEmail,
      college_id: cleanId(resourceData.college_id),
      college_name: resourceData.college_name || '',
      title: resourceData.title.trim(),
      description: resourceData.description || resourceData.title.trim(),
      type: mappedType,
      resource_type: resourceData.resource_type,
      class_level: resourceData.class_level || 'Class 11',
      year: resourceData.class_level || 'Class 11',
      stream: resourceData.stream || 'Science',
      stream_id: cleanId(resourceData.stream_id),
      class_id: cleanId(resourceData.class_id),
      subject_id: cleanId(resourceData.subject_id) || slugify(resourceData.subject) || 'general',
      subject_name: resourceData.subject,
      subject: resourceData.subject,
      term: resourceData.term || 'Final Term',
      exam_year: resourceData.exam_year || resourceData.academic_year || '2081',
      academic_year: resourceData.academic_year || resourceData.exam_year || '2081',
      file_url: uploadResult.secure_url,
      cloudinary_secure_url: uploadResult.secure_url,
      cloudinary_public_id: uploadResult.public_id,
      solution_url: resourceData.resource_type === 'solution' ? uploadResult.secure_url : null,
      access_level: computedAccessLevel,
      status: resourceData.status === 'premium_only' ? 'premium_only' : 'verified',
      solution_status: 'verified',
      upvotes: 0,
      rating: 0,
      rating_count: 0,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    if (!docId) {
      docId = contribRef.id;
    }
  } catch (contribErr: any) {
    console.warn('Failed to write to contributions collection:', contribErr);
    if (!docId) {
      throw contribErr;
    }
  }

  return docId || 'saved';
};

/**
 * Update resource metadata (and optionally replace PDF file)
 */
export const updateEducationalResource = async (
  resourceId: string,
  updates: Partial<EducationalResourceItem>,
  newFile?: File | null
): Promise<void> => {
  let fileUpdates: Partial<EducationalResourceItem> = {};

  if (newFile) {
    const existingSnap = await getDoc(doc(db, 'academic_resources', resourceId));
    if (existingSnap.exists()) {
      const existingData = existingSnap.data() as EducationalResourceItem;
      // Delete old Cloudinary asset
      if (existingData.cloudinary_public_id) {
        try {
          const token = await auth.currentUser?.getIdToken();
          await fetch('/api/delete-asset', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ publicId: existingData.cloudinary_public_id, resourceType: 'image' })
          });
        } catch (delErr) {
          console.warn('Failed to delete old asset during replacement:', delErr);
        }
      }

      const folderPath = generateCloudinaryPath({
        college: updates.college_name || existingData.college_name || 'universal',
        classLevel: updates.class_level || existingData.class_level || 'class11',
        stream: updates.stream || existingData.stream || 'science',
        resourceType: (updates.resource_type || existingData.resource_type) === 'notes' ? 'note' : 'question_paper',
        subject: updates.subject || existingData.subject || 'general',
        term: updates.term || existingData.term || 'final',
        year: updates.exam_year || updates.academic_year || existingData.exam_year || new Date().getFullYear().toString()
      });

      const upRes = await uploadPdfToCloudinary(newFile, folderPath);
      fileUpdates = {
        pdf_filename: upRes.fileName,
        cloudinary_public_id: upRes.public_id,
        cloudinary_secure_url: upRes.secure_url,
        cloudinary_folder: upRes.folder
      };
    }
  }

  await updateDoc(doc(db, 'academic_resources', resourceId), {
    ...updates,
    ...fileUpdates,
    updated_at: serverTimestamp()
  });
};

/**
 * Toggle status of an educational resource (publish / draft / archive)
 */
export const toggleResourceStatus = async (
  resourceId: string,
  newStatus: ResourceStatus
): Promise<void> => {
  await updateDoc(doc(db, 'academic_resources', resourceId), {
    status: newStatus,
    updated_at: serverTimestamp()
  });
};

/**
 * Delete educational resource permanently from Cloudinary & Firestore
 */
export const deleteEducationalResourcePermanent = async (resourceId: string): Promise<void> => {
  await deleteResource(resourceId);
};
