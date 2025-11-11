import React from 'react';
import type { RosterMonth, Teacher } from '../types';

interface SummaryProps {
    rosters: RosterMonth[];
    teachers: Teacher[];
}

export const Summary: React.FC<SummaryProps> = ({ rosters, teachers }) => {
    if (rosters.length === 0) {
        return <div className="p-4 text-center bg-gray-100 dark:bg-gray-800 rounded-lg">Henüz onaylanmış bir çizelge bulunmuyor.</div>;
    }

    const teacherMap = new Map(teachers.map(t => [t.id, t.name]));
    const dutyCounts = new Map<string, any>();

    teachers.forEach(teacher => {
        dutyCounts.set(teacher.id, { total: 0, totalKat: 0, totalBahce: 0 });
    });

    rosters.forEach(roster => {
        const monthId = `${roster.year}-${roster.month}`;
        teachers.forEach(teacher => {
            const counts = dutyCounts.get(teacher.id);
            if (counts) {
                counts[monthId] = 0;
            }
        });
        roster.days.forEach(day => {
            day.duties.forEach(duty => {
                const counts = dutyCounts.get(duty.teacherId);
                if (counts) {
                    counts[monthId] = (counts[monthId] || 0) + 1;
                    counts.total += 1;
                    if (duty.location === 'Kat') {
                        counts.totalKat += 1;
                    } else if (duty.location === 'Bahçe') {
                        counts.totalBahce += 1;
                    }
                }
            });
        });
    });

    return (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3">Öğretmen</th>
                        {rosters.map(roster => (
                            <th key={roster.id} scope="col" className="px-6 py-3 text-center">
                                {new Date(roster.year, roster.month).toLocaleString('tr-TR', { month: 'short', year: '2-digit' })}
                            </th>
                        ))}
                        <th scope="col" className="px-6 py-3 text-center">Toplam (Kat / Bahçe)</th>
                    </tr>
                </thead>
                <tbody>
                    {teachers.map(teacher => {
                        const counts = dutyCounts.get(teacher.id);
                        if (!counts) return null;
                        return (
                            <tr key={teacher.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                    {teacherMap.get(teacher.id)}
                                </th>
                                {rosters.map(roster => (
                                    <td key={roster.id} className="px-6 py-4 text-center">
                                        {counts[`${roster.year}-${roster.month}`] || 0}
                                    </td>
                                ))}
                                <td className="px-6 py-4 font-bold text-center text-gray-900 dark:text-white">
                                    {counts.total}
                                    <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                                        ({counts.totalKat} / {counts.totalBahce})
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};