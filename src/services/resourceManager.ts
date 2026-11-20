import { db, storage } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '../firebase';

// ===============================================================
// Types & Interfaces
// ===============================================================

export type ResourceType = 'question_paper' | 'solution' | 'note' | 'syllabus';

export type ClassLevel = 'class11' | 'class12' | string;
export type StreamType = 'science' | 'commerce' | 'management' | 'diploma' | string;

export interface FolderPathParams {
  college: string;             // e.g. "CCRC", "KMC", or "universal"
  classLevel: ClassLevel;      // e.g. "Class 11", "class11"
  stream: StreamType;          // e.g. "Science", "Commerce", "Management", "Diploma"
  resourceType: ResourceType;  // 'question_paper' | 'solution' | 'note' | 'syllabus'
  subject?: string;            // e.g. "Physics" (required for question_paper, solution, note)
  term?: string;               // e.g. "1st_term", "2nd_term", "Final"
  year?: string;               // e.g. "2024", "2080"
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  fileName: string;
  folder: string;
  bytes?: number;
  format?: string;
}

export interface AcademicResource {
  id?: string;
  college_name: string;
  college_slug: string;
  class_level: string;
  stream: string;
  subject: string;
  resource_type: ResourceType;
  term?: string;
  year?: string;
  pdf_filename: string;
  cloudinary_public_id: string;
  cloudinary_secure_url: string;
  cloudinary_folder: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  access_level?: 'free' | 'premium';
  description?: string;
  linked_question_paper_id?: string; // Optional: Link solution to a specific question paper
  created_at?: Timestamp | any;
  updated_at?: Timestamp | any;
}

export interface QuestionPaperFilter {
  college?: string;
  classLevel?: string;
  stream?: string;
  subject?: string;
  term?: string;
  year?: string;
}

export interface SolutionFilter {
  college?: string;
  classLevel?: string;
  stream?: string;
  subject?: string;
  term?: string;
  year?: string;
  questionPaperId?: string;
}

export interface NotesFilter {
  college?: string;
  classLevel?: string;
  stream?: string;
  subject?: string;
}

export interface SyllabusFilter {
  college?: string;
  classLevel?: string;
  stream?: string;
}

export interface AvailableFilters {
  colleges: string[];
  classes: string[];
  streams: string[];
  subjects: string[];
  terms: string[];
  years: string[];
}

// ===============================================================
// Utility Helpers
// ===============================================================

/**
 * Normalizes text to a clean URL/path-safe slug
 * Examples: "Class 11" -> "class11", "1st Term" -> "1st_term", "Computer Science" -> "computer_science"
 */
export const slugify = (str?: string | null): string => {
  if (!str) return 'general';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'general';
};

// ===============================================================
// 1. Dynamic Cloudinary Folder Path Generator
// ===============================================================

/**
 * Creates dynamic folder paths based on academic hierarchy rules:
 * - Question Papers: main/plus2/{college}/{class}/{stream}/{subject}/question_papers/{term}/{year}
 * - Solutions:       main/plus2/{college}/{class}/{stream}/{subject}/solutions/{term}/{year}
 * - Notes:           main/plus2/{college}/{class}/{stream}/notes/{subject}
 * - Syllabus:        main/plus2/{college}/{class}/{stream}/syllabus
 */
export const generateCloudinaryPath = (params: FolderPathParams): string => {
  const college = slugify(params.college);
  const classLevel = slugify(params.classLevel);
  const stream = slugify(params.stream);
  const basePath = `main/plus2/${college}/${classLevel}/${stream}`;

  switch (params.resourceType) {
    case 'question_paper': {
      const subject = slugify(params.subject || 'general');
      const term = slugify(params.term || 'final');
      const year = slugify(params.year || new Date().getFullYear().toString());
      return `${basePath}/${subject}/question_papers/${term}/${year}`;
    }

    case 'solution': {
      const subject = slugify(params.subject || 'general');
      const term = slugify(params.term || 'final');
      const year = slugify(params.year || new Date().getFullYear().toString());
      return `${basePath}/${subject}/solutions/${term}/${year}`;
    }

    case 'note': {
      const subject = slugify(params.subject || 'general');
      return `${basePath}/notes/${subject}`;
    }

    case 'syllabus': {
      return `${basePath}/syllabus`;
    }

    default:
      return `${basePath}/general`;
  }
};

// ===============================================================
// 2. Cloudinary PDF Upload Function
// ===============================================================

/**
 * Validates, securely uploads a PDF to Cloudinary under the structured folder,
 * and returns secure_url, public_id, and fileName.
 */
export const uploadPdfToCloudinary = async (
  file: File,
  folderPath: string
): Promise<CloudinaryUploadResult> => {
  // 1. Validate file format
  const isPdfMime = file.type === 'application/pdf';
  const isPdfExtension = file.name.toLowerCase().endsWith('.pdf');
  if (!isPdfMime && !isPdfExtension) {
    throw new Error('Invalid file format. Only PDF documents (.pdf) are allowed.');
  }

  // 2. Generate unique filename to prevent overwriting
  const rawBaseName = file.name.replace(/\.[^/.]+$/, '');
  const cleanBaseName = rawBaseName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const uniqueFileName = `${cleanBaseName}_${uniqueSuffix}`;

  let cloudName = '';
  let apiKey = '';
  let timestamp = Math.round(new Date().getTime() / 1000);
  let signature = '';

  // 3. Obtain signature from backend endpoint
  try {
    const encodedFolder = encodeURIComponent(folderPath);
    const sigRes = await fetch(`/api/upload-signature?folder=${encodedFolder}`);
    if (sigRes.ok) {
      const contentType = sigRes.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const sigData = await sigRes.json();
        if (sigData.signature) {
          timestamp = sigData.timestamp;
          signature = sigData.signature;
          cloudName = sigData.cloudName;
          apiKey = sigData.apiKey;
        }
      }
    }
  } catch (err) {
    console.warn('Backend signature endpoint unreachable:', err);
  }

  if (!signature || !cloudName || !apiKey) {
    throw new Error('Unable to obtain secure upload signature from server. Please verify server configuration.');
  }

  // 4. Upload to Cloudinary API
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folderPath);
    formData.append('public_id', uniqueFileName);

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    });

    if (uploadRes.ok) {
      const data = await uploadRes.json();
      return {
        secure_url: data.secure_url,
        public_id: data.public_id,
        fileName: `${uniqueFileName}.pdf`,
        folder: folderPath,
        bytes: data.bytes,
        format: data.format || 'pdf',
      };
    }

    const errorPayload = await uploadRes.json().catch(() => null);
    throw new Error(errorPayload?.error?.message || 'Failed to upload to Cloudinary');
  } catch (cloudinaryError: any) {
    console.warn('Cloudinary upload encountered an issue, checking Firebase Storage fallback:', cloudinaryError);
    
    // Secondary fallback: Firebase Storage
    try {
      const storageRef = ref(storage, `${folderPath}/${uniqueFileName}.pdf`);
      const uploadSnapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(uploadSnapshot.ref);

      return {
        secure_url: downloadUrl,
        public_id: `${folderPath}/${uniqueFileName}.pdf`,
        fileName: `${uniqueFileName}.pdf`,
        folder: folderPath,
      };
    } catch (fbError: any) {
      console.error('Firebase Storage fallback also failed:', fbError);
      throw new Error(`Upload failed: ${cloudinaryError.message || fbError.message}`);
    }
  }
};

// ===============================================================
// 3. Save PDF Metadata & URL to Firestore
// ===============================================================

/**
 * Saves PDF metadata to the 'academic_resources' collection.
 * Prevents accidental duplicate records with identical attributes.
 */
export const saveResourceMetadata = async (
  resource: Omit<AcademicResource, 'id' | 'created_at' | 'updated_at'>
): Promise<string> => {
  const collectionRef = collection(db, 'academic_resources');

  // Check for potential duplicate record
  const duplicateQuery = query(
    collectionRef,
    where('college_slug', '==', slugify(resource.college_name)),
    where('class_level', '==', slugify(resource.class_level)),
    where('stream', '==', slugify(resource.stream)),
    where('resource_type', '==', resource.resource_type),
    where('cloudinary_public_id', '==', resource.cloudinary_public_id)
  );

  const existingDocs = await getDocs(duplicateQuery);
  if (!existingDocs.empty) {
    console.warn('Resource already exists with public_id:', resource.cloudinary_public_id);
    return existingDocs.docs[0].id;
  }

  const currentUser = auth.currentUser;
  const docRef = await addDoc(collectionRef, {
    ...resource,
    college_slug: slugify(resource.college_name),
    class_level: slugify(resource.class_level),
    stream: slugify(resource.stream),
    subject: slugify(resource.subject),
    term: resource.term ? slugify(resource.term) : null,
    year: resource.year ? slugify(resource.year) : null,
    user_id: resource.user_id || currentUser?.uid || 'anonymous',
    user_name: resource.user_name || currentUser?.displayName || 'Anonymous',
    user_email: resource.user_email || currentUser?.email || '',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return docRef.id;
};

// ===============================================================
// 4. Fetch Question Papers
// ===============================================================

export const getQuestionPapers = async (filter: QuestionPaperFilter = {}): Promise<AcademicResource[]> => {
  try {
    let q = query(collection(db, 'academic_resources'), where('resource_type', '==', 'question_paper'));

    if (filter.college && filter.college !== 'all') {
      q = query(q, where('college_slug', '==', slugify(filter.college)));
    }
    if (filter.classLevel && filter.classLevel !== 'all') {
      q = query(q, where('class_level', '==', slugify(filter.classLevel)));
    }
    if (filter.stream && filter.stream !== 'all') {
      q = query(q, where('stream', '==', slugify(filter.stream)));
    }
    if (filter.subject && filter.subject !== 'all') {
      q = query(q, where('subject', '==', slugify(filter.subject)));
    }
    if (filter.term && filter.term !== 'all') {
      q = query(q, where('term', '==', slugify(filter.term)));
    }
    if (filter.year && filter.year !== 'all') {
      q = query(q, where('year', '==', slugify(filter.year)));
    }

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AcademicResource));
  } catch (error) {
    console.warn('getQuestionPapers direct query fallback to in-memory filter:', error);
    const snap = await getDocs(query(collection(db, 'academic_resources'), where('resource_type', '==', 'question_paper')));
    let items = snap.docs.map(d => ({ id: d.id, ...d.data() } as AcademicResource));

    if (filter.college && filter.college !== 'all') {
      const colSlug = slugify(filter.college);
      items = items.filter(i => i.college_slug === colSlug);
    }
    if (filter.classLevel && filter.classLevel !== 'all') {
      const clsSlug = slugify(filter.classLevel);
      items = items.filter(i => i.class_level === clsSlug);
    }
    if (filter.stream && filter.stream !== 'all') {
      const strSlug = slugify(filter.stream);
      items = items.filter(i => i.stream === strSlug);
    }
    if (filter.subject && filter.subject !== 'all') {
      const subSlug = slugify(filter.subject);
      items = items.filter(i => i.subject === subSlug);
    }
    if (filter.term && filter.term !== 'all') {
      const termSlug = slugify(filter.term);
      items = items.filter(i => i.term === termSlug);
    }
    if (filter.year && filter.year !== 'all') {
      const yrSlug = slugify(filter.year);
      items = items.filter(i => i.year === yrSlug);
    }
    return items;
  }
};

// ===============================================================
// 5. Fetch Solutions
// ===============================================================

export const getSolutions = async (filter: SolutionFilter = {}): Promise<AcademicResource[]> => {
  try {
    let q = query(collection(db, 'academic_resources'), where('resource_type', '==', 'solution'));

    if (filter.questionPaperId) {
      q = query(q, where('linked_question_paper_id', '==', filter.questionPaperId));
    }
    if (filter.college && filter.college !== 'all') {
      q = query(q, where('college_slug', '==', slugify(filter.college)));
    }
    if (filter.classLevel && filter.classLevel !== 'all') {
      q = query(q, where('class_level', '==', slugify(filter.classLevel)));
    }
    if (filter.stream && filter.stream !== 'all') {
      q = query(q, where('stream', '==', slugify(filter.stream)));
    }
    if (filter.subject && filter.subject !== 'all') {
      q = query(q, where('subject', '==', slugify(filter.subject)));
    }
    if (filter.term && filter.term !== 'all') {
      q = query(q, where('term', '==', slugify(filter.term)));
    }
    if (filter.year && filter.year !== 'all') {
      q = query(q, where('year', '==', slugify(filter.year)));
    }

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AcademicResource));
  } catch (error) {
    console.warn('getSolutions in-memory fallback:', error);
    const snap = await getDocs(query(collection(db, 'academic_resources'), where('resource_type', '==', 'solution')));
    let items = snap.docs.map(d => ({ id: d.id, ...d.data() } as AcademicResource));

    if (filter.questionPaperId) {
      items = items.filter(i => i.linked_question_paper_id === filter.questionPaperId);
    }
    if (filter.college && filter.college !== 'all') {
      const colSlug = slugify(filter.college);
      items = items.filter(i => i.college_slug === colSlug);
    }
    if (filter.classLevel && filter.classLevel !== 'all') {
      const clsSlug = slugify(filter.classLevel);
      items = items.filter(i => i.class_level === clsSlug);
    }
    if (filter.stream && filter.stream !== 'all') {
      const strSlug = slugify(filter.stream);
      items = items.filter(i => i.stream === strSlug);
    }
    if (filter.subject && filter.subject !== 'all') {
      const subSlug = slugify(filter.subject);
      items = items.filter(i => i.subject === subSlug);
    }
    if (filter.term && filter.term !== 'all') {
      const termSlug = slugify(filter.term);
      items = items.filter(i => i.term === termSlug);
    }
    if (filter.year && filter.year !== 'all') {
      const yrSlug = slugify(filter.year);
      items = items.filter(i => i.year === yrSlug);
    }
    return items;
  }
};

// ===============================================================
// 6. Fetch Notes
// ===============================================================

export const getNotes = async (filter: NotesFilter = {}): Promise<AcademicResource[]> => {
  try {
    let q = query(collection(db, 'academic_resources'), where('resource_type', '==', 'note'));

    if (filter.college && filter.college !== 'all') {
      q = query(q, where('college_slug', '==', slugify(filter.college)));
    }
    if (filter.classLevel && filter.classLevel !== 'all') {
      q = query(q, where('class_level', '==', slugify(filter.classLevel)));
    }
    if (filter.stream && filter.stream !== 'all') {
      q = query(q, where('stream', '==', slugify(filter.stream)));
    }
    if (filter.subject && filter.subject !== 'all') {
      q = query(q, where('subject', '==', slugify(filter.subject)));
    }

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AcademicResource));
  } catch (error) {
    console.warn('getNotes in-memory fallback:', error);
    const snap = await getDocs(query(collection(db, 'academic_resources'), where('resource_type', '==', 'note')));
    let items = snap.docs.map(d => ({ id: d.id, ...d.data() } as AcademicResource));

    if (filter.college && filter.college !== 'all') {
      const colSlug = slugify(filter.college);
      items = items.filter(i => i.college_slug === colSlug);
    }
    if (filter.classLevel && filter.classLevel !== 'all') {
      const clsSlug = slugify(filter.classLevel);
      items = items.filter(i => i.class_level === clsSlug);
    }
    if (filter.stream && filter.stream !== 'all') {
      const strSlug = slugify(filter.stream);
      items = items.filter(i => i.stream === strSlug);
    }
    if (filter.subject && filter.subject !== 'all') {
      const subSlug = slugify(filter.subject);
      items = items.filter(i => i.subject === subSlug);
    }
    return items;
  }
};

// ===============================================================
// 7. Fetch Syllabus
// ===============================================================

export const getSyllabus = async (filter: SyllabusFilter = {}): Promise<AcademicResource[]> => {
  try {
    let q = query(collection(db, 'academic_resources'), where('resource_type', '==', 'syllabus'));

    if (filter.college && filter.college !== 'all') {
      q = query(q, where('college_slug', '==', slugify(filter.college)));
    }
    if (filter.classLevel && filter.classLevel !== 'all') {
      q = query(q, where('class_level', '==', slugify(filter.classLevel)));
    }
    if (filter.stream && filter.stream !== 'all') {
      q = query(q, where('stream', '==', slugify(filter.stream)));
    }

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AcademicResource));
  } catch (error) {
    console.warn('getSyllabus in-memory fallback:', error);
    const snap = await getDocs(query(collection(db, 'academic_resources'), where('resource_type', '==', 'syllabus')));
    let items = snap.docs.map(d => ({ id: d.id, ...d.data() } as AcademicResource));

    if (filter.college && filter.college !== 'all') {
      const colSlug = slugify(filter.college);
      items = items.filter(i => i.college_slug === colSlug);
    }
    if (filter.classLevel && filter.classLevel !== 'all') {
      const clsSlug = slugify(filter.classLevel);
      items = items.filter(i => i.class_level === clsSlug);
    }
    if (filter.stream && filter.stream !== 'all') {
      const strSlug = slugify(filter.stream);
      items = items.filter(i => i.stream === strSlug);
    }
    return items;
  }
};

// ===============================================================
// 8. Delete PDF from Cloudinary and Firestore
// ===============================================================

/**
 * Deletes the asset from Cloudinary via the secure backend API endpoint,
 * then permanently removes the document from Firestore.
 */
export const deleteResource = async (resourceId: string): Promise<void> => {
  const docRef = doc(db, 'academic_resources', resourceId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Resource not found in Firestore.');
  }

  const data = docSnap.data() as AcademicResource;
  const publicId = data.cloudinary_public_id;

  // 1. Delete asset from Cloudinary
  if (publicId) {
    try {
      const token = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      await fetch('/api/delete-asset', {
        method: 'POST',
        headers,
        body: JSON.stringify({ publicId, resourceType: 'image' }),
      });
    } catch (err) {
      console.warn('Could not delete asset from Cloudinary:', err);
    }
  }

  // 2. Delete document from Firestore
  await deleteDoc(docRef);
};

// ===============================================================
// 9. Update PDF Metadata
// ===============================================================

export const updateResourceMetadata = async (
  resourceId: string,
  updates: Partial<AcademicResource>
): Promise<void> => {
  const docRef = doc(db, 'academic_resources', resourceId);
  const sanitizedUpdates: Record<string, any> = {
    ...updates,
    updated_at: serverTimestamp(),
  };

  if (updates.college_name) sanitizedUpdates.college_slug = slugify(updates.college_name);
  if (updates.class_level) sanitizedUpdates.class_level = slugify(updates.class_level);
  if (updates.stream) sanitizedUpdates.stream = slugify(updates.stream);
  if (updates.subject) sanitizedUpdates.subject = slugify(updates.subject);
  if (updates.term) sanitizedUpdates.term = slugify(updates.term);
  if (updates.year) sanitizedUpdates.year = slugify(updates.year);

  delete sanitizedUpdates.id;
  delete sanitizedUpdates.created_at;

  await updateDoc(docRef, sanitizedUpdates);
};

// ===============================================================
// 10. List Available Filter Options Dynamically
// ===============================================================

/**
 * Dynamically scans the database and returns all unique colleges,
 * classes, streams, subjects, terms, and years currently stored.
 */
export const getAvailableFilters = async (): Promise<AvailableFilters> => {
  try {
    const snap = await getDocs(collection(db, 'academic_resources'));
    const colleges = new Set<string>();
    const classes = new Set<string>();
    const streams = new Set<string>();
    const subjects = new Set<string>();
    const terms = new Set<string>();
    const years = new Set<string>();

    snap.docs.forEach(docSnap => {
      const d = docSnap.data() as AcademicResource;
      if (d.college_name) colleges.add(d.college_name);
      if (d.class_level) classes.add(d.class_level);
      if (d.stream) streams.add(d.stream);
      if (d.subject) subjects.add(d.subject);
      if (d.term) terms.add(d.term);
      if (d.year) years.add(d.year);
    });

    return {
      colleges: Array.from(colleges).sort(),
      classes: Array.from(classes).sort(),
      streams: Array.from(streams).sort(),
      subjects: Array.from(subjects).sort(),
      terms: Array.from(terms).sort(),
      years: Array.from(years).sort().reverse(),
    };
  } catch (error) {
    console.error('Failed to get available filters:', error);
    return {
      colleges: [],
      classes: ['class11', 'class12'],
      streams: ['science', 'commerce', 'management', 'diploma'],
      subjects: [],
      terms: ['1st_term', '2nd_term', 'final'],
      years: ['2026', '2025', '2024', '2023', '2022'],
    };
  }
};
