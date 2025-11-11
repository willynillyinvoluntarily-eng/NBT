
import React, { useState } from 'react';
import type { Teacher } from '../types';
import { DayOfWeek } from '../types';
import { PlusIcon, TrashIcon, DownloadIcon, UploadIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, InfoIcon } from './icons';

interface SidebarProps {
    teachers: Teacher[];
    onAddTeacher: (teacher: Omit<Teacher, 'id'>) => void;
    onUpdateTeacher: (teacher: Teacher) => void;
    onDeleteTeacher: (teacherId: string) => void;
    onGenerate: () => void;
    onExport: () => void;
    onImport: () => void;
    onClearData: () => void;
    currentDate: Date;
    onMonthChange: (direction: 'prev' | 'next' | 'prevYear' | 'nextYear') => void;
}

const dayOptions = [
    { id: DayOfWeek.Monday, label: 'Pzt' },
    { id: DayOfWeek.Tuesday, label: 'Sal' },
    { id: DayOfWeek.Wednesday, label: 'Çar' },
    { id: DayOfWeek.Thursday, label: 'Per' },
    { id: DayOfWeek.Friday, label: 'Cum' },
];

export const Sidebar: React.FC<SidebarProps> = ({
    teachers,
    onAddTeacher,
    onUpdateTeacher,
    onDeleteTeacher,
    onGenerate,
    onExport,
    onImport,
    onClearData,
    currentDate,
    onMonthChange,
}) => {
    const [newTeacherName, setNewTeacherName] = useState('');

    const handleAddTeacher = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTeacherName.trim()) {
            onAddTeacher({
                name: newTeacherName.trim(),
                availableDays: [DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday],
            });
            setNewTeacherName('');
        }
    };

    const handleDayToggle = (teacherId: string, day: DayOfWeek) => {
        const teacher = teachers.find(t => t.id === teacherId);
        if (teacher) {
            const newAvailableDays = teacher.availableDays.includes(day)
                ? teacher.availableDays.filter(d => d !== day)
                : [...teacher.availableDays, day];
            onUpdateTeacher({ ...teacher, availableDays: newAvailableDays });
        }
    };

    return (
        <aside className="w-full lg:w-96 bg-white dark:bg-gray-800 p-6 flex flex-col shadow-lg overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">Kontrol Paneli</h2>

            <div className="space-y-6 flex-1">
                {/* Ay Seçimi */}
                <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Ay Seçimi</h3>
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                           <button onClick={() => onMonthChange('prevYear')} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"><ChevronDoubleLeftIcon className="w-5 h-5"/></button>
                           <button onClick={() => onMonthChange('prev')} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"><ChevronLeftIcon className="w-5 h-5"/></button>
                           <span className="flex-1 text-center font-semibold">{currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}</span>
                           <button onClick={() => onMonthChange('next')} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"><ChevronRightIcon className="w-5 h-5"/></button>
                           <button onClick={() => onMonthChange('nextYear')} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"><ChevronDoubleRightIcon className="w-5 h-5"/></button>
                        </div>
                        <button onClick={onGenerate} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                            Nöbet Çizelgesi Oluştur
                        </button>
                    </div>
                </div>

                {/* Öğretmen Yönetimi */}
                <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Öğretmenler</h3>
                    <form onSubmit={handleAddTeacher} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newTeacherName}
                            onChange={(e) => setNewTeacherName(e.target.value)}
                            placeholder="Öğretmen adı ekle"
                            className="flex-1 p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                        <button type="submit" className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors">
                            <PlusIcon className="w-6 h-6" />
                        </button>
                    </form>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {teachers.map(teacher => (
                            <div key={teacher.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">{teacher.name}</span>
                                    <button onClick={() => onDeleteTeacher(teacher.id)} className="text-red-500 hover:text-red-700">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex justify-around items-center">
                                    {dayOptions.map(day => (
                                        <label key={day.id} className="flex flex-col items-center cursor-pointer">
                                            <span className="text-sm">{day.label}</span>
                                            <input
                                                type="checkbox"
                                                checked={teacher.availableDays.includes(day.id)}
                                                onChange={() => handleDayToggle(teacher.id, day.id)}
                                                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Veri Yönetimi */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">Veri Yönetimi</h3>
                <div className="flex items-start gap-2 p-3 mb-4 text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <InfoIcon className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-500" />
                    <p>
                        Bu uygulama internet olmadan da çalışır. Tüm verileriniz (öğretmenler, çizelgeler) yalnızca sizin bilgisayarınızdaki tarayıcıya kaydedilir.
                    </p>
                </div>
                <div className="space-y-2">
                     <button onClick={onImport} className="w-full flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        <UploadIcon className="w-5 h-5"/> Veri Yükle (JSON)
                    </button>
                    <button onClick={onExport} className="w-full flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        <DownloadIcon className="w-5 h-5" /> Verileri Kaydet (JSON)
                    </button>
                   
                    <button onClick={onClearData} className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors mt-4">
                        Tüm Verileri Temizle
                    </button>
                </div>
            </div>
        </aside>
    );
};
