export type CalendarPeriod = 'day' | 'week' | 'month'

export interface SelectedDay {
  date: Date
}

export interface SelectedWeek {
  start: Date
  end: Date
}
