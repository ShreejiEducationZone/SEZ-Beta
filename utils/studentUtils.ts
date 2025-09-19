
import { Board } from '../types';

export const getProgramStage = (board?: Board, grade?: string): string | null => {
    if (!board || !grade) return null;
    const gradeNum = parseInt(grade, 10);

    if (board === 'Cambridge') {
        if (gradeNum >= 1 && gradeNum <= 5) return `Primary (Stage ${gradeNum})`;
        if (gradeNum === 6) return 'Lower Secondary (Stage 7)';
        if (gradeNum === 7) return 'Lower Secondary (Stage 8)';
        if (gradeNum === 8) return 'Lower Secondary (Stage 9)';
        if (gradeNum === 9) return 'IGCSE (Year 1)';
        if (gradeNum === 10) return 'IGCSE (Year 2)';
        if (gradeNum === 11) return 'AS Level (A1)';
        if (gradeNum === 12) return 'A Level (A2)';
    } else if (board === 'IB') {
        if (gradeNum >= 1 && gradeNum <= 5) return 'PYP';
        if (gradeNum >= 6 && gradeNum <= 10) return 'MYP';
        if (gradeNum >= 11 && gradeNum <= 12) return 'DP';
    }
    return null;
};

export const getBatchFromTime = (timeSlot?: string): string => {
    if (timeSlot === '3:00–4:30') return 'A';
    if (timeSlot === '4:30–6:00') return 'B';
    if (timeSlot === '6:00–8:00') return 'C';
    return '';
};
