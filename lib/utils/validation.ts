/**
 * The version string consists of 1 to 4 numbers separated by dots.
 * Non-zero numbers must not include a leading zero (e.g., "1.0" is valid, but "1.01" is not).
 * @param version
 * @returns {boolean}
 */
export function validateVersion(version: string) {
    return /^(0|[1-9][0-9]{0,8})([.](0|[1-9][0-9]{0,8})){0,3}$/.test(version)
}