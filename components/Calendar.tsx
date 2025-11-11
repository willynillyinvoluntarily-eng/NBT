
import React from 'react';
import type { RosterMonth, Teacher } from '../types';
import { DUTY_LOCATIONS } from '../constants';
import { isWorkDay } from '../services/dateUtils';
import { PlusIcon, TrashIcon } from './icons';


interface CalendarProps {
    schedule: RosterMonth | null;
    currentDate: Date;
    teachers: Teacher[];
    isEditable?: boolean;
    onAddDutyClick?: (date: string) => void;
    onRemoveDutyClick?: (date: string, teacherId: string) => void;
    dayOverrides: Map<string, boolean>;
    onDayOverrideToggle?: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ schedule, currentDate, teachers, isEditable, onAddDutyClick, onRemoveDutyClick, dayOverrides, onDayOverrideToggle }) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = (new Date(year, month, 1).getDay() + 6) % 7; // Pazartesi = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const teacherMap = new Map(teachers.map(t => [t.id, t.name]));

    const calendarDays = [];
    // Boş günler (önceki aydan)
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(<div key={`empty-start-${i}`} className="border rounded-lg bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"></div>);
    }

    // Ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = date.toISOString().split('T')[0];
        
        const overrideStatus = dayOverrides.get(dateString);
        const hasOverride = overrideStatus !== undefined;
        const isWorkable = hasOverride ? overrideStatus : isWorkDay(date);
        
        const daySchedule = schedule?.days.find(d => d.date === dateString);

        let cellClass = "border rounded-lg p-2 flex flex-col min-h-[120px] relative transition-colors";
        
        if (onDayOverrideToggle) { // Hazırlık modu
            cellClass += " cursor-pointer hover:border-blue-500 dark:hover:border-blue-400";
            if(isWorkable) {
                cellClass += " bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-700";
            } else {
                cellClass += " bg-gray-100 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400";
            }
        } else { // Görüntüleme/Düzenleme modu
             if (!isWorkable && !daySchedule?.duties.length) {
                cellClass += " bg-gray-200 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700";
            } else {
                cellClass += " bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";
            }
        }

        calendarDays.push(
            <div key={day} className={cellClass} onClick={onDayOverrideToggle ? () => onDayOverrideToggle(date) : undefined}>
                {hasOverride && (
                    <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-blue-500" title="Bu günün durumu manuel olarak değiştirildi."></div>
                )}
                <span className="font-bold self-end">{day}</span>
                <div className="flex-1 mt-1 text-sm space-y-1">
                    {daySchedule?.duties.map((duty, index) => (
                         <div key={index} className="group p-1.5 rounded-md text-white bg-blue-500 dark:bg-blue-600 shadow flex items-center justify-between">
                            <span>
                                <span className="font-semibold">{duty.location}:</span> {teacherMap.get(duty.teacherId) || 'Bilinmeyen'}
                            </span>
                            {isEditable && onRemoveDutyClick && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onRemoveDutyClick(dateString, duty.teacherId); }} 
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-red-200"
                                    aria-label={`${teacherMap.get(duty.teacherId)} görevini sil`}
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                     {isEditable && onAddDutyClick && isWorkable && (!daySchedule || daySchedule.duties.length < DUTY_LOCATIONS.length) && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onAddDutyClick(dateString); }}
                            className="w-full mt-2 flex items-center justify-center gap-1 text-xs p-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Nöbet Ekle
                        </button>
                    )}
                </div>
            </div>
        );
    }
    
    // Boş günler (sonraki aydan)
    const totalCells = calendarDays.length;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) {
        calendarDays.push(<div key={`empty-end-${i}`} className="border rounded-lg bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"></div>);
    }

    return (
        <div className="grid grid-cols-7 gap-2">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                <div key={day} className="text-center font-bold text-gray-600 dark:text-gray-400 p-2">{day}</div>
            ))}
            {calendarDays}
        </div>
    );
};
