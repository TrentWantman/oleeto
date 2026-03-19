export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const mostRecent = new Date(dates[0] + 'T00:00:00')
  const gap = Math.floor((today.getTime() - mostRecent.getTime()) / 86400000)
  if (gap > 1) return 0

  let streak = 1
  for (let i = 1; i < dates.length; i++) {
    const curr = new Date(dates[i - 1] + 'T00:00:00')
    const prev = new Date(dates[i] + 'T00:00:00')
    if (Math.floor((curr.getTime() - prev.getTime()) / 86400000) === 1) streak++
    else break
  }
  return streak
}
