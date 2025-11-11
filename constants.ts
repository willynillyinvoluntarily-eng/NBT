// MEB 2025-2026 Eğitim-Öğretim Yılı Çalışma Takvimi (Tahmini)
// Not: Resmi takvim yayınlandığında bu veriler güncellenmelidir.
export const ACADEMIC_CALENDAR_2025_2026 = {
    // YYYY-MM-DD formatında tatil günleri
    holidays: new Set([
        // Resmi Tatiller
        '2025-10-29', // Cumhuriyet Bayramı
        '2026-01-01', // Yılbaşı
        '2026-04-23', // Ulusal Egemenlik ve Çocuk Bayramı
        '2026-05-01', // Emek ve Dayanışma Günü
        '2026-05-19', // Atatürk'ü Anma, Gençlik ve Spor Bayramı
        
        // Dini Bayramlar (Tahmini - Hicri takvime göre değişir)
        // Ramazan Bayramı (Örnek tarihler)
        '2026-03-20', // Arefe
        '2026-03-21',
        '2026-03-22',
        '2026-03-23',

        // Kurban Bayramı (Örnek tarihler)
        '2026-05-28', // Arefe
        '2026-05-29',
        '2026-05-30',
        '2026-05-31',
        '2026-06-01',
    ]),

    // Eğitim yapılmayan dönemler
    periods: [
        { start: '2025-01-01', end: '2025-09-07' }, // Okul öncesi
        { start: '2025-11-10', end: '2025-11-14' }, // 1. Ara Tatil
        { start: '2026-01-26', end: '2026-02-06' }, // Yarıyıl Tatili
        { start: '2026-04-06', end: '2026-04-10' }, // 2. Ara Tatil
        { start: '2026-06-15', end: '2026-12-31' }, // Yaz Tatili
    ]
};

export const DAY_NAMES = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
export const DAY_NAMES_FULL = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

// Fix: Use 'as const' to infer a narrow, specific type for DUTY_LOCATIONS ('Kat' | 'Bahçe').
// This ensures type safety and resolves the type error in services/scheduler.ts.
export const DUTY_LOCATIONS = ['Kat', 'Bahçe'] as const;