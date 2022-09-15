/*
 * MIT License
 *
 * Copyright (c) 2022 Fatih Aziz (https://github.com/fatihaziz)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
 * Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH
 * THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// !NOTE: all this function will assume the input is in UTC!

import moment, { Moment, unitOfTime } from 'moment-mini'
import { isEmpty } from './is_empty'

export type { Moment } from 'moment-mini'
export type DateType = Date | string | number

export const weekDayNames = [
  `SUNDAY`,
  `MONDAY`,
  `TUESDAY`,
  `WEDNESDAY`,
  `THURSDAY`,
  `FRIDAY`,
  `SATURDAY`,
  `WEEKDAY`,
  `WEEKEND`,
] as const
export type WeekDayNames = typeof weekDayNames[number]

/* >> main func >> */
export type GetDateFunctionOptions = {
  /**
   * @type {boolean}
   * @default true
   */
  utc?: boolean;
}
export interface GetDateFunction {
  <DateInput extends DateType>(date: DateInput | undefined | null, options?: GetDateFunctionOptions): DateInput extends undefined | null ? undefined : moment.Moment;
  <DateInput extends DateType>(date: DateInput, options?: GetDateFunctionOptions): moment.Moment;
  <DateInput extends Moment>(date: DateInput, options?: GetDateFunctionOptions): moment.Moment;
}

const DEFAULT_GET_DATE_OPTIONS: GetDateFunctionOptions = {
  utc: true,
}

export const getDate = ((date, options?: GetDateFunctionOptions) => {
  const { utc } = Object.assign(DEFAULT_GET_DATE_OPTIONS, options ?? {})
  
  if (isEmpty(date))
    return void 0

  if (!isValidDate(date))
    throw new Error(`Invalid date: ${ date }`)
  
  const dateUTC = utc ? moment.utc(date) : moment(date).utc()
  return dateUTC
}) as GetDateFunction
/* << main func << */

/* >> Checker date helpers >> */

export const isValidDate = (unk: unknown): unk is DateType => {
  // Empty => false
  if (isEmpty(unk)) return false
  
  // Is Date instance => true
  if (moment.isDate(unk)) return true
  
  // Is moment instance => true
  if (moment.isMoment(unk)) return true
  
  // If its string or number, then converted to date, its valid date => true
  if (typeof unk === `string` || typeof unk === `number`) {
    try {
      if (typeof unk === `string`) {
        const dateISO = moment(unk, moment.ISO_8601, true)
        const dateRFC = moment(unk, moment.RFC_2822, true)
        return dateISO.isValid() || dateRFC.isValid()
      }

      const date = moment(unk)
      return date.isValid()
    } catch {
      return false
    }
  }

  return false
}

export const isDateOnWeekend = (date: DateType) => {
  if (!isValidDate(date)) 
    throw new Error(`IsDateOnWeekend: INVALID_DATE`)
  
  const dateUTC = moment.utc(date)
  return dateUTC.day() === 0 || dateUTC.day() === 6
}

export const isDateOnDay = (date: DateType, isDay: WeekDayNames | WeekDayNames[]) => {
  if (!isValidDate(date)) 
    throw new Error(`IsDateOnDay: INVALID_DATE`)
  
  const dateUTC = moment.utc(date)
  
  const selectWeekday = () => !isDateOnWeekend(date)
  const selectWeekend = () => isDateOnWeekend(date)
  const selectOneDay = (day: WeekDayNames) => {
    if (day === `WEEKEND`) 
      return selectWeekend()

    if (day === `WEEKDAY`) 
      return selectWeekday()

    return dateUTC.day() === weekDayNames.indexOf(day)
  }

  const selectManyDays = (days: WeekDayNames[]) => days.some(selectOneDay)
  
  if (Array.isArray(isDay)) 
    return selectManyDays(isDay)

  return selectOneDay(isDay)
}

/* << Checker date helpers << */

/**
 * Assume input as UTC Date, until explicitly stated otherwise
 * @param {T} unk - T extends undefined | null ? Date | undefined : Date
 * @returns A function that takes a type T
 * that extends DateType and returns a Date
 * or undefined.
 * @deprecated because it return inconsistent results
 */

export const dateForceUtc = <T extends DateType>(unk: T): T extends undefined | null ? Date | undefined : Date => {
  if (isEmpty(unk))
    return void 0 as T extends undefined | null ? Date | undefined : Date
  if (isValidDate(unk)) {
    const date = new Date(unk)
    // Return date
    const containExplicitUtc = typeof unk === `string` && (/Z|\+/.exec(unk))
    const userTimezoneOffset = containExplicitUtc && date.getTimezoneOffset() !== 0 ? 0 : new Date().getTimezoneOffset() * 60_000
    return new Date(date.valueOf() - userTimezoneOffset)
  }

  throw new Error(`DateForceUTC: INVALID_DATE`)
}

export const getFormattedDate = (date: DateType | undefined, format?: string) => {
  if (!isValidDate(date)) 
    throw new Error(`GetFormattedDate: INVALID_DATE`)
  
  const dateUTC = moment.utc(date).format(format ?? `YYYY-MM-DD HH:mm:ss`)
  return dateUTC
}

export const getDateInt = (date: DateType | undefined): number => {
  if (!isValidDate(date)) 
    throw new Error(`GetDateInt: INVALID_DATE`)
  
  const dateUTC = moment.utc(date).format(`YYYYMMDD`)
  return Number(`${ dateUTC }`)
}

export const getStartEndOfTheDay = (date: DateType | undefined, opt: `END` | `START`) => {
  if (!isValidDate(date)) 
    throw new Error(`GetStartEndOfTheDay: INVALID_DATE`)
  
  const dateUTC = moment.utc(date)
  
  if (opt === `END`) 
    return dateUTC.endOf(`day`)

  if (opt === `START`) 
    return dateUTC.startOf(`day`)

  throw `SELECT END/START!`
}

export const getDateOffset = (date: DateType, offset = 1, unit: unitOfTime.DurationConstructor = `days`) => {
  if (!isValidDate(date)) 
    throw new Error(`GetDateOffset: INVALID_DATE`)
  
  const dateUTC = moment.utc(date)
  return dateUTC.add(offset, unit)
}

export const getDateTimezone = (date: DateType, timezone: number) => getDateOffset(date, timezone, `hour`).toDate()

export const getDateDifference = (date1: DateType, date2: DateType, unit: unitOfTime.DurationConstructor = `seconds`) => {
  if (!isValidDate(date1) || !isValidDate(date2)) 
    throw new Error(`GetDateDifference: INVALID_DATE`)
  
  const dateUTC1 = moment.utc(date1)
  const dateUTC2 = moment.utc(date2)
  return dateUTC1.diff(dateUTC2, `seconds`)
}
export const getStartEndOfTheMonth = (date: DateType | undefined, opt: `END` | `START`) => {
  if (!isValidDate(date)) 
    throw new Error(`GetStartEndOfTheMonth: INVALID_DATE`)
  
  const dateUTC = moment.utc(date)
  
  if (opt === `END`) 
    return dateUTC.endOf(`month`)

  if (opt === `START`) 
    return dateUTC.startOf(`month`)

  throw `SELECT END/START!`
}

export const getDateRangeArray = (
  start: DateType,
  end: DateType,
  unit: unitOfTime.DurationConstructor = `day`,
) => {
  if (!isValidDate(start) || !isValidDate(end)) 
    throw new Error(`GetDateRangeArray: INVALID_DATE`)
  
  const fromDate = moment.utc(start)
  const toDate = moment.utc(end)
  const diff = toDate.diff(fromDate, `seconds`)
  
  const dateRange: DateType[] = [fromDate.toDate()]
  
  for (const [index, _] of new Array(diff).fill(0).entries()) {
    const dayOffset = index + 1
    dateRange.push(getDateOffset(start, dayOffset, unit).toDate())
  }
  
  return dateRange
}

export const getAllDatesInMonth = (date: DateType) => {
  if (!isValidDate(date)) 
    throw new Error(`GetAllDatesInMonth: INVALID_DATE`)
  
  const dateUTC = moment.utc(date)
  const monthDays = getDateRangeArray(
    dateUTC.startOf(`month`).toDate(),
    dateUTC.endOf(`month`).toDate(),
    `day`,
  )
  
  if (dateUTC.daysInMonth() !== monthDays.length) 
    throw new Error(`GetAllDatesInMonth:  incorrect dates length`)

  for (const [index, day] of monthDays.entries()) {
    if (!dateUTC.isSame(day, `month`)) 
      throw new Error(`GetAllDatesInMonth: incorrect date in month`)
  }

  return monthDays
}

export const getDurations = (dateFrom: DateType, dateTo: DateType) => {
  const from = new Date(dateFrom).valueOf()
  const to = new Date(dateTo).valueOf()
  const diff = to - from

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor(
    (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  )
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds }
}

export const isTimeInBetween = (now: DateType, startTime: string, endTime: string) => {
  const validatorRegexp
    = /^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)(?:\.(\d+))?$/
  const validStartTime = validatorRegexp.exec(String(startTime))
  if (isEmpty(validStartTime))
    throw new Error(`isTimeInBetween: validStartTime invalid format`)
  const validEndTime = validatorRegexp.exec(String(endTime))
  if (isEmpty(validEndTime))
    throw new Error(`isTimeInBetween: validEndTime invalid format`)

  const nowMoment = getDate(now)
  if (!nowMoment) throw new Error(`isTimeInBetween: now is invalid`)

  const startDate = getStartEndOfTheDay(now, `START`).add(
    validStartTime[1],
    `hour`,
  )
  const endDate = getStartEndOfTheDay(now, `START`).add(
    validEndTime[1],
    `hour`,
  )

  return nowMoment.isBetween(startDate, endDate)
}
