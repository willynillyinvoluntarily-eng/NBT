
import { useState, useEffect } from 'react';
import type { AppState } from '../types';

const STORAGE_KEY = 'teacherDutySchedulerState';

const getInitialState = (): AppState => {
    try {
        const item = window.localStorage.getItem(STORAGE_KEY);
        if (item) {
            return JSON.parse(item);
        }
    } catch (error) {
        console.error("Error reading from localStorage", error);
    }
    return {
        teachers: [],
        rosters: [],
    };
};

export const useAppStorage = () => {
    const [appState, setAppState] = useState<AppState>(getInitialState);

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
        } catch (error) {
            console.error("Error writing to localStorage", error);
        }
    }, [appState]);

    const clearAllData = () => {
        if (window.confirm('Tüm verileri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
            setAppState({ teachers: [], rosters: [] });
        }
    };

    return { appState, setAppState, clearAllData };
};
