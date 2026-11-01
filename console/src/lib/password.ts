const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz" // no I, O, l: easy to misread
const DIGITS = "23456789" // no 0, 1

// Uniform in [0, n): values from the unfair tail are thrown away.
function randomBelow(n: number) {
    const limit = Math.floor(0x100000000 / n) * n
    const buf = new Uint32Array(1)
    do {
        crypto.getRandomValues(buf)
    } while (buf[0] >= limit)
    return buf[0] % n
}

// A random password that meets the gateway's policy: at least one letter and
// one digit. The one rule it cannot check is "must not contain the email name";
// a clash is practically impossible, and the gateway would say so.
export function generatePassword(length = 16) {
    const all = LETTERS + DIGITS
    const chars = [
        LETTERS[randomBelow(LETTERS.length)],
        DIGITS[randomBelow(DIGITS.length)],
        ...Array.from({ length: length - 2 }, () => all[randomBelow(all.length)]),
    ]
    // Shuffle, so the guaranteed letter and digit are not always first.
    for (let i = chars.length - 1; i > 0; i--) {
        const j = randomBelow(i + 1)
        ;[chars[i], chars[j]] = [chars[j], chars[i]]
    }
    return chars.join("")
}
