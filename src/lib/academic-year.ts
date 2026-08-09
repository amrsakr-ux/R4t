// Egyptian academic year runs September → August.
// A date in Jan 2027 belongs to the 2026-2027 year; Sep 2027 starts 2027-2028.

export function currentAcademicYear(date = new Date()): string {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0-indexed
  if (m >= 8) return `${y}-${y + 1}`;
  return `${y - 1}-${y}`;
}

export function academicYearOptions(count = 3): string[] {
  const now = currentAcademicYear();
  const [start] = now.split("-").map(Number);
  const years: string[] = [];
  for (let i = 0; i < count; i++) {
    years.push(`${start - 1 + i}-${start + i}`);
  }
  return years;
}

export function academicYearRange(academicYear: string): { startDate: Date; endDate: Date } {
  const [startY, endY] = academicYear.split("-").map(Number);
  return {
    startDate: new Date(Date.UTC(startY, 8, 1)),  // Sep 1
    endDate: new Date(Date.UTC(endY, 7, 31)),     // Aug 31
  };
}
