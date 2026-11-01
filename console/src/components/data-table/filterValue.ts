// Date filters travel as unix seconds, which name one instant everywhere. The
// clock the user reads and types is the browser's own time zone.

const pad = (n: number) => String(n).padStart(2, "0")

export type Moment = { day: Date; time: string } // time is "HH:mm"

export const formatDay = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// A day and a clock time, read in the local time zone, as unix seconds.
// NaN when the time is empty.
export function momentToUnix({ day, time }: Moment) {
    const [h, m] = time.split(":").map(Number)
    return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m).getTime() / 1000
}

export function unixToMoment(unix: number): Moment {
    const d = new Date(unix * 1000)
    return {
        day: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    }
}
