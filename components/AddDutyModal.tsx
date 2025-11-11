
import React, { useState, useMemo, useEffect } from 'react';
import type { Teacher, Duty, DutyLocation } from '../types';
import { DUTY_LOCATIONS } from '../constants';
import { XMarkIcon } from './icons';

interface AddDutyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (duty: Duty) => void;
    teachers: Teacher[];
    date: string;
    existingDuties: Duty[];
}

export const AddDutyModal: React.FC<AddDutyModalProps> = ({ isOpen, onClose, onSave, teachers, date, existingDuties }) => {
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    const [selectedLocation, setSelectedLocation] = useState<DutyLocation | ''>('');

    const availableTeachers = useMemo(() => {
        const assignedTeacherIds = new Set(existingDuties.map(d => d.teacherId));
        return teachers.filter(t => !assignedTeacherIds.has(t.id));
    }, [teachers, existingDuties]);

    const availableLocations = useMemo(() => {
        const assignedLocations = new Set(existingDuties.map(d => d.location));
        return DUTY_LOCATIONS.filter(l => !assignedLocations.has(l as DutyLocation));
    }, [existingDuties]);

    useEffect(() => {
        if (isOpen) {
            setSelectedTeacherId(availableTeachers[0]?.id || '');
            setSelectedLocation(availableLocations[0] as DutyLocation || '');
        }
    }, [isOpen, availableTeachers, availableLocations]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (selectedTeacherId && selectedLocation) {
            onSave({
                teacherId: selectedTeacherId,
                location: selectedLocation as DutyLocation,
            });
            onClose();
        }
    };
    
    const formattedDate = new Date(date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{formattedDate} - Nöbet Ekle</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="teacher-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Öğretmen</label>
                        <select
                            id="teacher-select"
                            value={selectedTeacherId}
                            onChange={e => setSelectedTeacherId(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            <option value="" disabled>Öğretmen Seçin</option>
                            {availableTeachers.map(teacher => (
                                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="location-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nöbet Yeri</label>
                        <select
                            id="location-select"
                            value={selectedLocation}
                            onChange={e => setSelectedLocation(e.target.value as DutyLocation)}
                            className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            <option value="" disabled>Yer Seçin</option>
                            {availableLocations.map(location => (
                                <option key={location} value={location}>{location}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors">İptal</button>
                    <button onClick={handleSave} disabled={!selectedTeacherId || !selectedLocation} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed">Kaydet</button>
                </div>
            </div>
        </div>
    );
};
