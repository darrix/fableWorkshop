// TODO does this perfectly match the .NET behavior ?
// TODO does this perfectly match the .NET behavior ?
export function tryParse(s, radix, initial) {
    if (s != null) {
        if (radix === 10) {
            const v = +s;
            if (!Number.isNaN(v)) {
                return [true, v];
            }
        }
    }
    return [false, initial];
}
export function parse(s, radix = 10) {
    const a = tryParse(s, radix, 0);
    if (a[0]) {
        return a[1];
    }
    else {
        // TODO FormatException ?
        throw new Error("Input string was not in a correct format.");
    }
}
