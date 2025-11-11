
import { ACADEMIC_CALENDAR_2025_2026 } from '../constants';

export const isHoliday = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    if (ACADEMIC_CALENDAR_2025_2026.holidays.has(dateStr)) {
        return true;
    }

    for (const period of ACADEMIC_CALENDAR_2025_2026.periods) {
        const startDate = new Date(period.start);
        const endDate = new Date(period.end);
        // Tarih karşılaştırmalarında saat farkı sorunlarını önlemek için tarihleri sıfırla
        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);
        
        if (compareDate >= startDate && compareDate <= endDate) {
            return true;
        }
    }
    return false;
};

export const isWorkDay = (date: Date): boolean => {
    const day = date.getDay();
    if (day === 0 || day === 6) { // Pazar veya Cumartesi
        return false;
    }
    if (isHoliday(date)) {
        return false;
    }
    return true;
};
