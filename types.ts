// FIX: Removed self-import which caused type declaration conflicts.
export type Board = 'CBSE' | 'ICSE' | 'GSEB' | 'Cambridge' | 'IB';
export type Gender = 'Male' | 'Female' | 'Other';

export interface Student {
  id: string;
  name: string;
  grade: string;
  board: Board;
  school: string;
  batch: string;
  timeSlot: string;
  personalPhone?: string;
  fatherPhone?: string;
  motherPhone?: string;
  address?: string;
  isArchived: boolean;
  avatarUrl: string | null;
  programStage?: string;
  notes?: string;

  // New fields
  fatherName?: string;
  motherName?: string;
  occupation?: string;
  gender?: Gender;
  email?: string;
  dob?: string; // YYYY-MM-DD
  password?: string;
}

// FIX: Added missing Chapter interface export.
export interface Chapter {
  no: string | number;
  name: string;
}

export interface SyllabusNode {
  no: string | number;
  name: string;
  children?: SyllabusNode[];
}

// FIX: Added missing CambridgeSyllabusNode interface export.
export interface CambridgeSyllabusNode {
  no: string | number;
  name: string;
  children?: CambridgeSyllabusNode[];
}

export interface SheetColumn {
  id: string;
  name: string;
}

export interface SubjectData {
  subject: string;
  chapters: SyllabusNode[];
  sheetColumns?: SheetColumn[];
}

// FIX: Added missing CambridgeSubjectData interface export.
export interface CambridgeSubjectData {
  subject: string;
  chapters: CambridgeSyllabusNode[];
  sheetColumns?: SheetColumn[];
}

export interface ProgressEntry {
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface SyllabusProgress {
  id: string; // Composite key: studentId-subject-nodeNo
  studentId: string;
  subject: string;
  nodeNo: string | number;
  isCompleted: boolean;
  entries: ProgressEntry[];
}

export type WorkStatus = 'Assign' | 'Pending' | 'Completed';
export type WorkPriority = 'Low' | 'Medium' | 'High';
export type WorkHealthStatus = 'Healthy' | 'Warning' | 'Critical';

export interface WorkItem {
  id: string;
  studentId: string;
  title: string;
  subject: string;
  chapterNo: string | number;
  chapterName: string;
  topic?: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  status: WorkStatus;
  priority: WorkPriority;
  links?: string[];
  files?: { name: string; dataUrl: string }[];
  mentorNote?: string;
  dateCreated: string; // YYYY-MM-DD
  linkedDoubtId?: string;
  source?: 'syllabus' | 'doubt' | 'sheets';
  sheetTasks?: string[]; // Array of task names, e.g., ["Reading", "Videos"]
  sheetTaskIds?: string[]; // Array of task IDs, e.g., ["reading", "videos_123"]
}

export type DoubtStatus = 'Open' | 'Resolved' | 'Tasked';
export type DoubtPriority = 'Low' | 'Medium' | 'High';
export type DoubtOrigin = 'During Reading' | 'During Work Task' | 'During Notes' | 'Before Test' | 'After Test' | 'Other';

export interface Doubt {
  id: string;
  studentId: string;
  subject: string;
  chapterNo?: string | number;
  chapterName?: string;
  topic?: string;
  testId?: string;
  text: string;
  priority: DoubtPriority;
  origin: DoubtOrigin;
  createdAt: string; // YYYY-MM-DD
  status: DoubtStatus;
  resolvedAt?: string; // YYYY-MM-DD
  attachment?: { name: string; dataUrl: string };
  voiceNote?: { name: string; dataUrl: string };
}

// New Types for Reports & Tests
export type TestType = 'School Test' | 'Self-Test' | 'Class Test';
export type TestStatus = 'Upcoming' | 'Completed' | 'Absent';
export type TestPriority = 'Low' | 'Medium' | 'High';

export interface MistakeTypeDefinition {
  title: string;
  description: string;
}

export interface AreaDefinition {
  title: string;
  description: string;
}

export interface Test {
  id: string; 
  studentId: string;
  title: string;
  subject: string;
  // FIX: Updated to use the exported Chapter interface.
  chapters: Chapter[];
  testDate: string; // YYYY-MM-DD
  status: TestStatus;
  priority: TestPriority;

  // For completed tests
  testType?: TestType;
  marksObtained?: number;
  totalMarks?: number;
  mistakeTypes?: string[];
  strongArea?: string[];
  weakArea?: string[];
  retestRequired?: 'Yes' | 'No';
}

export interface FaceDescriptorData {
  id: string; // Student ID
  descriptor: number[];
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Holiday' | 'Leave' | 'None';

export interface AttendanceRecord {
  id: string; // Composite key: studentId_YYYY-MM-DD
  studentId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  inTime?: string; // HH:MM:SS
  lastSeen?: string; // HH:MM:SS
  reason?: string; // For Holiday or Leave
}

export interface Holiday {
    id: string; // YYYY-MM-DD
    date: string; // YYYY-MM-DD
    reason: string;
}

export interface VideoLink {
  id: string;
  title: string;
  url: string;
}

export interface VideoLibraryEntry {
  id: string; // Composite key, e.g., CBSE-10-Mathematics-1.1 or 'universal'
  videos: VideoLink[];
}

export type SheetTaskType = 'reading' | 'videos' | 'notes' | 'exercise' | 'test';

export interface SheetProgress {
  id: string; // Composite key: studentId__subject__chapterNo
  studentId: string;
  subject: string;
  chapterNo: string | number;
  tasks: Record<string, boolean>;
}