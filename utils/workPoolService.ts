import { Doubt, WorkItem } from '../types';

export function updateDoubtStatusFromWorkItems(doubt: Doubt, workItems: WorkItem[]): Doubt {
  const linkedItem = workItems.find(w => w.linkedDoubtId === doubt.id);

  if (linkedItem && linkedItem.status === 'Completed' && doubt.status !== 'Resolved') {
    return { ...doubt, status: 'Resolved', resolvedAt: new Date().toISOString().split('T')[0] };
  }

  return doubt;
}