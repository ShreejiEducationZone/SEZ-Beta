import React, { useMemo, useRef, useEffect } from 'react';
import { Test } from '../types';
import CalendarIcon from './icons/CalendarIcon';
import EditIcon from './icons/EditIcon';

interface TestScheduleProps {
    tests: Test[];
    onTestSelect: (test: Test) => void;
}

const PlaceholderCard: React.FC<{ isOnlyCard?: boolean }> = ({ isOnlyCard }) => (
    <div className={`
        flex-shrink-0 w-72 h-48 p-4 rounded-xl flex flex-col justify-center items-center
        border-2 border-dashed border-gray-300 dark:border-gray-600
        text-gray-400 dark:text-gray-500
        ${isOnlyCard ? '' : 'snap-center'}
    `}>
        <CalendarIcon className="h-8 w-8 mb-2" />
        <p className="font-semibold">No Upcoming Tests</p>
        <p className="text-xs">New tests will appear here.</p>
    </div>
);

// Helper to parse 'YYYY-MM-DD' strings into local Date objects safely.
const parseDateAsLocal = (dateStr: string) => {
    if (!dateStr) return new Date(0);
    const [year, month, day] = dateStr.split('-').map(Number);
    // Creates a date at midnight in the local timezone
    return new Date(year, month - 1, day);
};


const TestSchedule: React.FC<TestScheduleProps> = ({ tests, onTestSelect }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const nearestTestRef = useRef<HTMLDivElement>(null);
    
    const { sortedTests, nearestUpcomingTestIndex } = useMemo(() => {
        if (!tests || tests.length === 0) {
            return { sortedTests: [], nearestUpcomingTestIndex: -1 };
        }
    
        const today = new Date();
        today.setHours(0, 0, 0, 0);
    
        const upcomingTests: Test[] = [];
        const pastTests: Test[] = [];
    
        tests.forEach(test => {
            const testDate = parseDateAsLocal(test.testDate);
            // An 'upcoming' test is one with the status 'Upcoming' and its date is on or after today.
            // All other tests (completed, absent, or overdue upcoming) are considered 'past'.
            if (test.status === 'Upcoming' && testDate >= today) {
                upcomingTests.push(test);
            } else {
                pastTests.push(test);
            }
        });
    
        // Sort upcoming tests by date: nearest is first.
        upcomingTests.sort((a, b) => parseDateAsLocal(a.testDate).getTime() - parseDateAsLocal(b.testDate).getTime());
        
        // Sort past tests by date: most recent is first.
        pastTests.sort((a, b) => parseDateAsLocal(b.testDate).getTime() - parseDateAsLocal(a.testDate).getTime());
    
        const nearestTest = upcomingTests.length > 0 ? upcomingTests[0] : null;
        // All other upcoming tests are considered "future" tests.
        const futureTests = upcomingTests.slice(1);
    
        // The final list is ordered: [Past Tests] -> [Nearest Upcoming] -> [Future Tests]
        let finalSortedTests: Test[] = [...pastTests];
        let finalNearestIndex = -1;
        
        if (nearestTest) {
            finalSortedTests.push(nearestTest);
            finalNearestIndex = pastTests.length; // The index of the nearest test
            finalSortedTests.push(...futureTests);
        }
        
        return { sortedTests: finalSortedTests, nearestUpcomingTestIndex: finalNearestIndex };
    }, [tests]);

    useEffect(() => {
        // Scroll the nearest upcoming test to the center on initial load or when tests change.
        if (nearestTestRef.current) {
            setTimeout(() => {
                nearestTestRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    inline: 'center',
                    block: 'nearest'
                });
            }, 100); // A small delay ensures the element is ready
        }
    }, [sortedTests, nearestUpcomingTestIndex]);

    const calculateDaysLeft = (dateStr: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const testDate = parseDateAsLocal(dateStr);
        const diffTime = testDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    if (tests.length === 0) {
         return (
             <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-sm">
                <h3 className="text-xl font-bold mb-4">Test Schedule</h3>
                <div className="flex justify-center items-center h-48">
                    <PlaceholderCard isOnlyCard={true} />
                </div>
            </div>
         );
    }

    return (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold mb-4">Test Schedule</h3>
            
            <div 
                ref={scrollContainerRef} 
                className="flex overflow-x-auto pt-2 pb-4 -mb-4 space-x-6 snap-x snap-mandatory thin-scrollbar px-[calc(50%-144px)] scroll-smooth"
            >
                {sortedTests.map((test, index) => {
                    const daysLeft = calculateDaysLeft(test.testDate);
                    const isMarkingPending = test.status === 'Upcoming' && daysLeft < 0;
                    let statusText: string;
                    
                    const isNearest = index === nearestUpcomingTestIndex;

                    let borderColorClass = 'border-blue-500'; // Default for Past tests
                    if (isNearest) {
                        borderColorClass = 'border-red-500'; // Highlight Nearest upcoming test
                    } else if (nearestUpcomingTestIndex !== -1 && index > nearestUpcomingTestIndex) {
                        borderColorClass = 'border-green-500'; // Future tests
                    }

                    if (isMarkingPending) {
                        statusText = 'Marking Pending';
                    } else if (test.status !== 'Upcoming') {
                        statusText = test.status;
                    } else if (daysLeft === 0) {
                        statusText = 'Today';
                    } else {
                        statusText = `${daysLeft}d left`;
                    }
                    
                    const syllabusText = test.chapters.map(c => c.name).join(', ');
                    
                    return (
                        <div 
                            key={test.id} 
                            ref={isNearest ? nearestTestRef : null}
                            onClick={() => onTestSelect(test)} 
                            className={`
                                flex-shrink-0 w-72 h-48 p-4 rounded-xl cursor-pointer
                                transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1
                                border-l-8 snap-center
                                bg-light-bg dark:bg-dark-bg/50
                                ${borderColorClass}
                            `}
                        >
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                        <CalendarIcon className="h-4 w-4" />
                                        {parseDateAsLocal(test.testDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: '2-digit'})}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {isMarkingPending && (
                                            <div title="Marking Pending">
                                                <EditIcon className="h-4 w-4 text-orange-500" />
                                            </div>
                                        )}
                                        <p className={`text-sm font-bold ${isMarkingPending ? 'text-orange-500' : 'text-gray-800 dark:text-gray-200'}`}>{statusText}</p>
                                    </div>
                                </div>

                                <div className="my-2 flex-grow overflow-hidden">
                                    <h4 className="font-bold text-lg text-gray-900 dark:text-white truncate" title={test.title}>{test.title}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{test.subject}</p>
                                </div>
                                
                                <div className="mt-auto pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={syllabusText}>
                                        Syllabus: {syllabusText}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                })}
                
                {/* Show placeholder if no upcoming tests exist but past tests do */}
                {sortedTests.length > 0 && nearestUpcomingTestIndex === -1 && <PlaceholderCard />}
            </div>
        </div>
    );
};

export default TestSchedule;