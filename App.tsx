import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Calendar } from './components/Calendar';
import { Summary } from './components/Summary';
import { AddDutyModal } from './components/AddDutyModal';
import { useAppStorage } from './hooks/useAppStorage';
import { generateSchedule } from './services/scheduler';
import { isWorkDay } from './services/dateUtils';
import type { Teacher, RosterMonth, AppState, Duty } from './types';
import { InfoIcon } from './components/icons';

const App: React.FC = () => {
    const { appState, setAppState, clearAllData } = useAppStorage();
    const [currentDate, setCurrentDate] = useState(new Date(2025, 8, 1)); // Start of 2025-2026 school year
    const [generatedSchedule, setGeneratedSchedule] = useState<RosterMonth | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [editingDutyDate, setEditingDutyDate] = useState<string | null>(null);
    const [dayOverrides, setDayOverrides] = useState<Map<string, boolean>>(new Map());


    const fileInputRef = useRef<HTMLInputElement>(null);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleAddTeacher = (teacher: Omit<Teacher, 'id'>) => {
        setAppState(prevState => ({
            ...prevState,
            teachers: [...prevState.teachers, { ...teacher, id: Date.now().toString() }]
        }));
    };

    const handleUpdateTeacher = (updatedTeacher: Teacher) => {
        setAppState(prevState => ({
            ...prevState,
            teachers: prevState.teachers.map(t => t.id === updatedTeacher.id ? updatedTeacher : t)
        }));
    };

    const handleDeleteTeacher = (teacherId: string) => {
        setAppState(prevState => ({
            ...prevState,
            teachers: prevState.teachers.filter(t => t.id !== teacherId)
        }));
    };

    const handleGenerateSchedule = () => {
        if (appState.teachers.length < 2) {
            showNotification('Nöbet çizelgesi oluşturmak için en az 2 öğretmen eklemelisiniz.', 'error');
            return;
        }
        const schedule = generateSchedule(currentDate.getFullYear(), currentDate.getMonth(), appState.teachers, appState.rosters, dayOverrides);
        setGeneratedSchedule(schedule);
    };

    const handleConfirmSchedule = () => {
        if (generatedSchedule) {
            const rosterId = `${generatedSchedule.year}-${generatedSchedule.month}`;
            setAppState(prevState => {
                const existingRosterIndex = prevState.rosters.findIndex(r => r.id === rosterId);
                const newRosters = [...prevState.rosters];
                if(existingRosterIndex > -1) {
                    newRosters[existingRosterIndex] = { ...generatedSchedule, id: rosterId };
                } else {
                    newRosters.push({ ...generatedSchedule, id: rosterId });
                }
                newRosters.sort((a,b) => new Date(a.year, a.month).getTime() - new Date(b.year, b.month).getTime());

                return { ...prevState, rosters: newRosters };
            });
            setGeneratedSchedule(null);
            showNotification(`${generatedSchedule.month + 1}. ay nöbet çizelgesi onaylandı ve kaydedildi.`);
        }
    };
    
    const handleExportData = () => {
        try {
            const dataStr = JSON.stringify(appState, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `nobet_cizelgesi_yedek_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showNotification('Veriler başarıyla bilgisayarınızın İndirilenler klasörüne kaydedildi.');
        } catch (error) {
            console.error("Export failed:", error);
            showNotification('Veri dışa aktarılırken bir hata oluştu.', 'error');
        }
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    const importedState = JSON.parse(text) as AppState;
                    // Basic validation
                    if (importedState.teachers && Array.isArray(importedState.teachers) && importedState.rosters && Array.isArray(importedState.rosters)) {
                        setAppState(importedState);
                        showNotification('Veriler başarıyla yüklendi.');
                    } else {
                        throw new Error('Invalid file format');
                    }
                }
            } catch (error) {
                console.error("Import failed:", error);
                showNotification('Veri yüklenirken bir hata oluştu. Lütfen dosya formatını kontrol edin.', 'error');
            } finally {
                if(fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsText(file);
    };

    const triggerImport = () => {
        fileInputRef.current?.click();
    };

    const displayedSchedule = useMemo(() => {
        if (generatedSchedule) return generatedSchedule;
        const rosterId = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
        return appState.rosters.find(r => r.id === rosterId) || null;
    }, [generatedSchedule, appState.rosters, currentDate]);

    const handleMonthChange = (direction: 'prev' | 'next' | 'prevYear' | 'nextYear') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') newDate.setMonth(newDate.getMonth() - 1);
            if (direction === 'next') newDate.setMonth(newDate.getMonth() + 1);
            if (direction === 'prevYear') newDate.setFullYear(newDate.getFullYear() - 1);
            if (direction === 'nextYear') newDate.setFullYear(newDate.getFullYear() + 1);
            return newDate;
        });
        setGeneratedSchedule(null);
        setDayOverrides(new Map());
    };

    const handleOpenAddDutyModal = (date: string) => {
        if (!generatedSchedule) return;
        setEditingDutyDate(date);
    };

    const handleCloseAddDutyModal = () => {
        setEditingDutyDate(null);
    };

    const handleAddDuty = (duty: Duty) => {
        if (!editingDutyDate || !generatedSchedule) return;

        const newSchedule = { ...generatedSchedule, days: [...generatedSchedule.days] };
        const dayIndex = newSchedule.days.findIndex(d => d.date === editingDutyDate);

        if (dayIndex > -1) {
            newSchedule.days[dayIndex] = {
                ...newSchedule.days[dayIndex],
                duties: [...newSchedule.days[dayIndex].duties, duty]
            };
        } else {
            newSchedule.days.push({ date: editingDutyDate, duties: [duty] });
            newSchedule.days.sort((a, b) => a.date.localeCompare(b.date));
        }
        setGeneratedSchedule(newSchedule);
    };

    const handleRemoveDuty = (date: string, teacherId: string) => {
        if (!generatedSchedule) return;

        setGeneratedSchedule(prevSchedule => {
            if (!prevSchedule) return null;
            
            const newDays = [...prevSchedule.days];
            const dayIndex = newDays.findIndex(d => d.date === date);

            if (dayIndex > -1) {
                const updatedDuties = newDays[dayIndex].duties.filter(
                    d => d.teacherId !== teacherId
                );
                
                newDays[dayIndex] = { ...newDays[dayIndex], duties: updatedDuties };
            }
            return { ...prevSchedule, days: newDays };
        });
    };
    
    const handleDayOverrideToggle = (date: Date) => {
        const dateString = date.toISOString().split('T')[0];
        setDayOverrides(prev => {
            const newOverrides = new Map(prev);
            const defaultIsWorkDay = isWorkDay(date);

            if (newOverrides.has(dateString)) {
                newOverrides.delete(dateString);
            } else {
                newOverrides.set(dateString, !defaultIsWorkDay);
            }
            return newOverrides;
        });
    };


    return (
        <div className="flex flex-col lg:flex-row h-screen font-sans">
            <input type="file" ref={fileInputRef} onChange={handleImportData} className="hidden" accept=".json" />
            <Sidebar
                teachers={appState.teachers}
                onAddTeacher={handleAddTeacher}
                onUpdateTeacher={handleUpdateTeacher}
                onDeleteTeacher={handleDeleteTeacher}
                onGenerate={handleGenerateSchedule}
                onExport={handleExportData}
                onImport={triggerImport}
                onClearData={clearAllData}
                currentDate={currentDate}
                onMonthChange={handleMonthChange}
            />
            <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto">
                {generatedSchedule && (
                    <div className="bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-500 text-blue-800 dark:text-blue-200 p-4 rounded-md mb-6 shadow-md flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <p className="font-bold text-lg">Önizleme Modu Aktif</p>
                            <p className="text-sm">Oluşturulan çizelgeyi inceleyin. Gerekirse takvimden manuel değişiklik yapabilir veya onaylayarak kalıcı olarak kaydedebilirsiniz.</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <button
                                onClick={() => setGeneratedSchedule(null)}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                            >
                                İptal Et
                            </button>
                            <button
                                onClick={handleConfirmSchedule}
                                className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold shadow"
                            >
                                Onayla ve Kaydet
                            </button>
                        </div>
                    </div>
                )}
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                            {currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })} Nöbet Çizelgesi
                        </h1>
                    </div>
                     {appState.teachers.length < 2 && !generatedSchedule && (
                        <div className="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 p-4 rounded-md mb-4 flex items-start">
                            <InfoIcon className="h-5 w-5 mr-3 mt-0.5 text-yellow-500" />
                            <p>Çizelge oluşturmak için lütfen kenar çubuğundan en az 2 öğretmen ekleyin. Eklediğiniz her öğretmen için nöbet tutabileceği günleri seçtiğinizden emin olun.</p>
                        </div>
                    )}
                    <Calendar 
                        schedule={displayedSchedule} 
                        currentDate={currentDate} 
                        teachers={appState.teachers}
                        isEditable={!!generatedSchedule}
                        onAddDutyClick={handleOpenAddDutyModal}
                        onRemoveDutyClick={handleRemoveDuty}
                        dayOverrides={dayOverrides}
                        onDayOverrideToggle={generatedSchedule ? undefined : handleDayOverrideToggle}
                    />
                </div>
                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Onaylanmış Çizelge Özetleri</h2>
                    <Summary rosters={appState.rosters} teachers={appState.teachers} />
                </div>
            </main>
            {notification && (
                <div className={`fixed bottom-5 right-5 p-4 rounded-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {notification.message}
                </div>
            )}
            <AddDutyModal
                isOpen={!!editingDutyDate}
                onClose={handleCloseAddDutyModal}
                onSave={handleAddDuty}
                teachers={appState.teachers}
                date={editingDutyDate!}
                existingDuties={
                    generatedSchedule?.days.find(d => d.date === editingDutyDate)?.duties || []
                }
            />
        </div>
    );
};

export default App;