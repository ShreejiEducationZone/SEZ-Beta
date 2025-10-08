import { Doubt, WorkItem } from '../types';

export function updateDoubtStatusFromWorkItems(doubt: Doubt, workItems: WorkItem[]): Doubt {
  const linkedItem = workItems.find(w => w.linkedDoubtId === doubt.id);

  if (linkedItem && linkedItem.status === 'Completed' && doubt.status !== 'Resolved') {
    const cleanDoubt: Doubt = {
      id: doubt.id,
      studentId: doubt.studentId,
      subject: doubt.subject,
      chapterNo: doubt.chapterNo,
      chapterName: doubt.chapterName,
      testId: doubt.testId,
      text: doubt.text,
      priority: doubt.priority,
      origin: doubt.origin,
      createdAt: doubt.createdAt,
      status: 'Resolved', // Set the new status
      resolvedAt: new Date().toISOString().split('T')[0], // Set the resolved date
      attachment: doubt.attachment,
      voiceNote: doubt.voiceNote,
    };
    return cleanDoubt;
  }

  return doubt;
}