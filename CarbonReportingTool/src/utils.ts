
import { addDays, addHours, addSeconds, differenceInHours, eachDayOfInterval, eachHourOfInterval, endOfDay, formatDate, formatDistanceToNow, getDate, getDay, getHours, isValid, startOfDay } from "date-fns";
import { hasValue, isRelativeDate, toDate, toNum } from "uxp/components";

export function formatToDateString(d: string | number | Date, format: string) {
    const date = toDate(d)
    if (!!date) return formatDate(date, format);
    return null
}

export function getRelativeTime(d: string | number | Date) {
    const date = toDate(d)
    if (!!date) return formatDistanceToNow(date) + ' ago'
    return null
}

export function getStartDate(d: string | Date) {
    const date = toDate(d)
    if (!date) return null
    return (startOfDay(date)).toISOString()
}

export function getEndDate(d: string | Date) {
    const date = toDate(d)
    if (!date) return null
    return (endOfDay(date)).toISOString()
}

export function getPreviousRangeFromRelativeDates(startDate: any, endDate: any, numOfRange: number) {

    if (!isRelativeDate(startDate) || !isRelativeDate(endDate)) return null

    const sd = getStartDate(startDate)
    const ed = getEndDate(endDate)

    if (!sd || !ed) return null
    if (!hasValue(numOfRange)) return { startDate: sd, endDate: ed }

    const durationInHours = differenceInHours(ed, sd)

    const prevRangeEndDate = getEndDate(addHours(addDays(sd, -1), -((numOfRange - 1) * durationInHours)))
    const prevRangeStartDate = getStartDate(addHours(prevRangeEndDate, -durationInHours))

    return { startDate: prevRangeStartDate, endDate: prevRangeEndDate }
}
