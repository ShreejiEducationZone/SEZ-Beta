import { Doubt, WorkItem } from '../types';

export function updateDoubtStatusFromWorkItems(doubt: Doubt, workItems: WorkItem[]): Doubt {
  const linkedItem = workItems.find(w => w.linkedDoubtId === doubt.id);

  if (linkedItem && linkedItem.status === 'Completed' && doubt.status !== 'Resolved') {
    // FIX: Reconstruct the doubt object explicitly to create a "clean" plain JavaScript object.
    // Using the spread operator `{ ...doubt }` can carry over internal properties from Firestore objects,
    // leading to "converting circular structure to JSON" errors when the object is later serialized.
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
