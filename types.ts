

export type Board = 'CBSE' | 'ICSE' | 'GSEB' | 'Cambridge' | 'IB';

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
}

export interface Chapter {
  no: string | number;
  name:string;
}

export interface SubjectData {
  subject: string;
  chapters: Chapter[];
}

export interface ChapterProgressEntry {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'start' | 'milestone' | 'finish';
  note?: string;
}

export interface ChapterProgress {
  id: string; // Composite key: studentId-subject-chapterNo
  studentId: string;
  subject: string;
  chapterNo: string | number;
  chapterName: string;
  entries: ChapterProgressEntry[];
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
  source?: 'syllabus' | 'doubt';
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
