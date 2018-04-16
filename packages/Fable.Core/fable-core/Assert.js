import { equals } from "./Util";
export class AssertionError extends Error {
    constructor(msg, actual, expected) {
        super(msg);
        this.actual = actual;
        this.expected = expected;
    }
}
export function equal(actual, expected, msg) {
    if (!equals(actual, expected)) {
        throw new AssertionError(msg || `Expected: ${expected} - Actual: ${actual}`, actual, expected);
    }
}
