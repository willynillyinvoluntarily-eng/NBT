
export enum DayOfWeek {
    Sunday = 0,
    Monday = 1,
    Tuesday = 2,
    Wednesday = 3,
    Thursday = 4,
    Friday = 5,
    Saturday = 6,
}

export interface Teacher {
    id: string;
    name: string;
    availableDays: DayOfWeek[];
}

export type DutyLocation = 'Kat' | 'Bahçe';

export interface Duty {
    teacherId: string;
    location: DutyLocation;
}

export interface RosterDay {
    date: string; // YYYY-MM-DD
    duties: Duty[];
}

export interface RosterMonth {
    id: string; // YYYY-M
    year: number;
    month: number; // 0-11
    days: RosterDay[];
}

export interface AppState {
    teachers: Teacher[];
    rosters: RosterMonth[];
}
