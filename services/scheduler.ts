import type { Teacher, RosterMonth, RosterDay, DutyLocation, DayOfWeek } from '../types';
import { DUTY_LOCATIONS } from '../constants';
import { isWorkDay } from './dateUtils';

/**
 * Verilen bir tarihin ISO 8601 standardına göre hafta kimliğini (YYYY-Www) döndürür.
 * Bu, ay geçişlerinde bile haftanın bütünlüğünü korumak için kullanılır.
 * @param date Hafta kimliği alınacak tarih.
 * @returns 'YYYY-Www' formatında bir string.
 */
function getWeekId(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // Haftanın gününü al (Pazar=0, Pzt=1... -> Pzt=1, ... Pazar=7)
    const dayNum = d.getUTCDay() || 7;
    // Haftanın Perşembesine git (ISO 8601'de hafta Perşembe'ye göre belirlenir)
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Yılın başından bu yana geçen gün sayısını hesapla ve haftaya böl
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}


export function generateSchedule(year: number, month: number, teachers: Teacher[], history: RosterMonth[], dayOverrides: Map<string, boolean>): RosterMonth {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const rosterDays: RosterDay[] = [];

    type DutyCount = { total: number; Kat: number; Bahçe: number };

    const historicalDutyCounts = new Map<string, DutyCount>();
    teachers.forEach(t => historicalDutyCounts.set(t.id, { total: 0, Kat: 0, Bahçe: 0 }));
    history.forEach(roster => {
        roster.days.forEach(day => {
            day.duties.forEach(duty => {
                const counts = historicalDutyCounts.get(duty.teacherId);
                if (counts) {
                    counts.total++;
                    if (duty.location === 'Kat') counts.Kat++;
                    else if (duty.location === 'Bahçe') counts.Bahçe++;
                }
            });
        });
    });

    const monthlyDutyCounts = new Map<string, DutyCount>();
    teachers.forEach(t => monthlyDutyCounts.set(t.id, { total: 0, Kat: 0, Bahçe: 0 }));
    
    const lastDutyDay = new Map<string, number>(); // TeacherId -> Day of month
    const weeklyDutyInfo = new Map<string, { location: DutyLocation }>();
    let currentWeekId = '';
    
    for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(year, month, i);
        const dateString = currentDate.toISOString().split('T')[0];
        
        const override = dayOverrides.get(dateString);
        const isDayForDuty = override !== undefined ? override : isWorkDay(currentDate);

        if (isDayForDuty) {
            const weekId = getWeekId(currentDate);
            if (weekId !== currentWeekId) {
                currentWeekId = weekId;
                weeklyDutyInfo.clear(); // Yeni haftaya başlarken haftalık nöbet yeri bilgisini sıfırla
            }
            
            const dayOfWeek = currentDate.getDay() as DayOfWeek;

            // Ardışık gün nöbet tutmamış ve o gün için uygun olan öğretmenleri filtrele
            let eligibleTeachers = teachers.filter(t => {
                const isAvailableOnDay = t.availableDays.includes(dayOfWeek);
                const hadDutyYesterday = (lastDutyDay.get(t.id) || -1) === (i - 1);
                return isAvailableOnDay && !hadDutyYesterday;
            });

            const dutiesForDay: RosterDay = {
                date: dateString,
                duties: [],
            };
            const assignedTeacherIds = new Set<string>();

            for (const location of DUTY_LOCATIONS) {
                const unassignedTeachers = eligibleTeachers.filter(t => !assignedTeacherIds.has(t.id));
                if (unassignedTeachers.length === 0) continue;

                // Nöbet yeri ve sayısına göre en uygun öğretmeni bul
                unassignedTeachers.sort((a, b) => {
                    const monthlyCountsA = monthlyDutyCounts.get(a.id)!;
                    const historicalCountsA = historicalDutyCounts.get(a.id)!;
                    const totalDutiesA = historicalCountsA.total + monthlyCountsA.total;

                    const monthlyCountsB = monthlyDutyCounts.get(b.id)!;
                    const historicalCountsB = historicalDutyCounts.get(b.id)!;
                    const totalDutiesB = historicalCountsB.total + monthlyCountsB.total;
                    
                    // 1. Toplam nöbet sayısına göre sırala (azdan çoğa)
                    if (totalDutiesA !== totalDutiesB) return totalDutiesA - totalDutiesB;
                    
                    // 2. Aylık toplam nöbet sayısına göre sırala
                    if (monthlyCountsA.total !== monthlyCountsB.total) return monthlyCountsA.total - monthlyCountsB.total;

                    // 3. Kat/Bahçe dengesizliğine göre sırala (Tarihsel + Aylık)
                    // Dengesizlik = Toplam Kat - Toplam Bahçe.
                    // Pozitif değer: Daha çok Kat nöbeti var. Negatif değer: Daha çok Bahçe nöbeti var.
                    const imbalanceA = (historicalCountsA.Kat + monthlyCountsA.Kat) - (historicalCountsA.Bahçe + monthlyCountsA.Bahçe);
                    const imbalanceB = (historicalCountsB.Kat + monthlyCountsB.Kat) - (historicalCountsB.Bahçe + monthlyCountsB.Bahçe);

                    // 'Bahçe' nöbeti atıyorsak, en çok Kat nöbeti olanı (en yüksek dengesizlik) önceliklendir.
                    if (location === 'Bahçe') {
                        if (imbalanceA !== imbalanceB) {
                            return imbalanceB - imbalanceA; // Yüksekten düşüğe sırala
                        }
                    } 
                    // 'Kat' nöbeti atıyorsak, en çok Bahçe nöbeti olanı (en düşük dengesizlik) önceliklendir.
                    else { // location === 'Kat'
                        if (imbalanceA !== imbalanceB) {
                            return imbalanceA - imbalanceB; // Düşükten yükseğe sırala
                        }
                    }

                    // 4. Haftalık yer dengeleme: Eğer öğretmen bu hafta zaten bu yerde nöbet tuttuysa ceza puanı ver
                    const weeklyInfoA = weeklyDutyInfo.get(a.id);
                    const penaltyA = (weeklyInfoA && weeklyInfoA.location === location) ? 1000 : 0;
                    const weeklyInfoB = weeklyDutyInfo.get(b.id);
                    const penaltyB = (weeklyInfoB && weeklyInfoB.location === location) ? 1000 : 0;
                    if (penaltyA !== penaltyB) return penaltyA - penaltyB;

                    // 5. Eşitlik durumunda rastgele seç
                    return Math.random() - 0.5;
                });

                const teacherToAssign = unassignedTeachers[0];

                if (teacherToAssign) {
                    dutiesForDay.duties.push({
                        teacherId: teacherToAssign.id,
                        location: location,
                    });
                    assignedTeacherIds.add(teacherToAssign.id);
                    
                    // İstatistikleri güncelle
                    const counts = monthlyDutyCounts.get(teacherToAssign.id)!;
                    counts.total++;
                    if (location === 'Kat') counts.Kat++;
                    else if (location === 'Bahçe') counts.Bahçe++;
                    
                    lastDutyDay.set(teacherToAssign.id, i);
                    
                    // Haftalık ilk nöbetiyse yer bilgisini kaydet
                    if (!weeklyDutyInfo.has(teacherToAssign.id)) {
                        weeklyDutyInfo.set(teacherToAssign.id, { location });
                    }
                }
            }
             rosterDays.push(dutiesForDay);
        }
    }

    return {
        id: `${year}-${month}`,
        year,
        month,
        days: rosterDays,
    };
}