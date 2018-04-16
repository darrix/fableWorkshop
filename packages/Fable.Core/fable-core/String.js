import { second } from "./Date";
import { minute } from "./Date";
import { hour } from "./Date";
import { day } from "./Date";
import { month } from "./Date";
import { year } from "./Date";
import { escape } from "./RegExp";
import { toString } from "./Util";
const fsFormatRegExp = /(^|[^%])%([0+ ]*)(-?\d+)?(?:\.(\d+))?(\w)/;
const formatRegExp = /\{(\d+)(,-?\d+)?(?:\:(.+?))?\}/g;
const StringComparison = {
    CurrentCulture: 0,
    CurrentCultureIgnoreCase: 1,
    InvariantCulture: 2,
    InvariantCultureIgnoreCase: 3,
    Ordinal: 4,
    OrdinalIgnoreCase: 5,
};
function cmp(x, y, ic) {
    function isIgnoreCase(i) {
        return i === true ||
            i === StringComparison.CurrentCultureIgnoreCase ||
            i === StringComparison.InvariantCultureIgnoreCase ||
            i === StringComparison.OrdinalIgnoreCase;
    }
    function isOrdinal(i) {
        return i === StringComparison.Ordinal ||
            i === StringComparison.OrdinalIgnoreCase;
    }
    if (x == null) {
        return y == null ? 0 : -1;
    }
    if (y == null) {
        return 1;
    } // everything is bigger than null
    if (isOrdinal(ic)) {
        if (isIgnoreCase(ic)) {
            x = x.toLowerCase();
            y = y.toLowerCase();
        }
        return (x === y) ? 0 : (x < y ? -1 : 1);
    }
    else {
        if (isIgnoreCase(ic)) {
            x = x.toLocaleLowerCase();
            y = y.toLocaleLowerCase();
        }
        return x.localeCompare(y);
    }
}
export function compare(...args) {
    switch (args.length) {
        case 2: return cmp(args[0], args[1], false);
        case 3: return cmp(args[0], args[1], args[2]);
        case 4: return cmp(args[0], args[1], args[2] === true);
        case 5: return cmp(args[0].substr(args[1], args[4]), args[2].substr(args[3], args[4]), false);
        case 6: return cmp(args[0].substr(args[1], args[4]), args[2].substr(args[3], args[4]), args[5]);
        case 7: return cmp(args[0].substr(args[1], args[4]), args[2].substr(args[3], args[4]), args[5] === true);
        default: throw new Error("String.compare: Unsupported number of parameters");
    }
}
export function compareTo(x, y) {
    return cmp(x, y, false);
}
export function startsWith(str, pattern, ic) {
    if (str.length >= pattern.length) {
        return cmp(str.substr(0, pattern.length), pattern, ic) === 0;
    }
    return false;
}
export function indexOfAny(str, anyOf, ...args) {
    if (str == null || str === "") {
        return -1;
    }
    const startIndex = (args.length > 0) ? args[0] : 0;
    if (startIndex < 0) {
        throw new Error("String.indexOfAny: Start index cannot be negative");
    }
    const length = (args.length > 1) ? args[1] : str.length - startIndex;
    if (length < 0) {
        throw new Error("String.indexOfAny: Length cannot be negative");
    }
    if (length > str.length - startIndex) {
        throw new Error("String.indexOfAny: Invalid startIndex and length");
    }
    str = str.substr(startIndex, length);
    for (const c of anyOf) {
        const index = str.indexOf(c);
        if (index > -1) {
            return index + startIndex;
        }
    }
    return -1;
}
function toHex(value) {
    return value < 0
        ? "ff" + (16777215 - (Math.abs(value) - 1)).toString(16)
        : value.toString(16);
}
export function fsFormat(str, ...args) {
    function formatOnce(str2, rep) {
        return str2.replace(fsFormatRegExp, (_, prefix, flags, pad, precision, format) => {
            switch (format) {
                case "f":
                case "F":
                    rep = rep.toFixed(precision || 6);
                    break;
                case "g":
                case "G":
                    rep = rep.toPrecision(precision);
                    break;
                case "e":
                case "E":
                    rep = rep.toExponential(precision);
                    break;
                case "O":
                    rep = toString(rep);
                    break;
                case "A":
                    rep = toString(rep, true);
                    break;
                case "x":
                    rep = toHex(Number(rep));
                    break;
                case "X":
                    rep = toHex(Number(rep)).toUpperCase();
                    break;
            }
            const plusPrefix = flags.indexOf("+") >= 0 && parseInt(rep, 10) >= 0;
            pad = parseInt(pad, 10);
            if (!isNaN(pad)) {
                const ch = pad >= 0 && flags.indexOf("0") >= 0 ? "0" : " ";
                rep = padLeft(rep, Math.abs(pad) - (plusPrefix ? 1 : 0), ch, pad < 0);
            }
            const once = prefix + (plusPrefix ? "+" + rep : rep);
            return once.replace(/%/g, "%%");
        });
    }
    if (args.length === 0) {
        return (cont) => {
            if (fsFormatRegExp.test(str)) {
                return (...args2) => {
                    let strCopy = str;
                    for (const arg of args2) {
                        strCopy = formatOnce(strCopy, arg);
                    }
                    return cont(strCopy.replace(/%%/g, "%"));
                };
            }
            else {
                return cont(str);
            }
        };
    }
    else {
        for (const arg of args) {
            str = formatOnce(str, arg);
        }
        return str.replace(/%%/g, "%");
    }
}
export function format(str, ...args) {
    return str.replace(formatRegExp, (match, idx, pad, format) => {
        let rep = args[idx];
        let padSymbol = " ";
        if (typeof rep === "number") {
            switch ((format || "").substring(0, 1)) {
                case "f":
                case "F":
                    rep = format.length > 1 ? rep.toFixed(format.substring(1)) : rep.toFixed(2);
                    break;
                case "g":
                case "G":
                    rep = format.length > 1 ? rep.toPrecision(format.substring(1)) : rep.toPrecision();
                    break;
                case "e":
                case "E":
                    rep = format.length > 1 ? rep.toExponential(format.substring(1)) : rep.toExponential();
                    break;
                case "p":
                case "P":
                    rep = (format.length > 1 ? (rep * 100).toFixed(format.substring(1)) : (rep * 100).toFixed(2)) + " %";
                    break;
                case "x":
                    rep = toHex(Number(rep));
                    break;
                case "X":
                    rep = toHex(Number(rep)).toUpperCase();
                    break;
                default:
                    const m = /^(0+)(\.0+)?$/.exec(format);
                    if (m != null) {
                        let decs = 0;
                        if (m[2] != null) {
                            rep = rep.toFixed(decs = m[2].length - 1);
                        }
                        pad = "," + (m[1].length + (decs ? decs + 1 : 0)).toString();
                        padSymbol = "0";
                    }
                    else if (format) {
                        rep = format;
                    }
            }
        }
        else if (rep instanceof Date) {
            if (format.length === 1) {
                switch (format) {
                    case "D":
                        rep = rep.toDateString();
                        break;
                    case "T":
                        rep = rep.toLocaleTimeString();
                        break;
                    case "d":
                        rep = rep.toLocaleDateString();
                        break;
                    case "t":
                        rep = rep.toLocaleTimeString().replace(/:\d\d(?!:)/, "");
                        break;
                    case "o":
                    case "O":
                        if (rep.kind === 2 /* Local */) {
                            const offset = rep.getTimezoneOffset() * -1;
                            rep = format("{0:yyyy-MM-dd}T{0:HH:mm}:{1:00.000}{2}{3:00}:{4:00}", rep, second(rep), offset >= 0 ? "+" : "-", ~~(offset / 60), offset % 60);
                        }
                        else {
                            rep = rep.toISOString();
                        }
                }
            }
            else {
                rep = format.replace(/\w+/g, (match2) => {
                    let rep2 = match2;
                    switch (match2.substring(0, 1)) {
                        case "y":
                            rep2 = match2.length < 4 ? year(rep) % 100 : year(rep);
                            break;
                        case "h":
                            rep2 = rep.getHours() > 12 ? hour(rep) % 12 : hour(rep);
                            break;
                        case "M":
                            rep2 = month(rep);
                            break;
                        case "d":
                            rep2 = day(rep);
                            break;
                        case "H":
                            rep2 = hour(rep);
                            break;
                        case "m":
                            rep2 = minute(rep);
                            break;
                        case "s":
                            rep2 = second(rep);
                            break;
                    }
                    if (rep2 !== match2 && rep2 < 10 && match2.length > 1) {
                        rep2 = "0" + rep2;
                    }
                    return rep2;
                });
            }
        }
        pad = parseInt((pad || "").substring(1), 10);
        if (!isNaN(pad)) {
            rep = padLeft(rep, Math.abs(pad), padSymbol, pad < 0);
        }
        return rep;
    });
}
export function endsWith(str, search) {
    const idx = str.lastIndexOf(search);
    return idx >= 0 && idx === str.length - search.length;
}
export function initialize(n, f) {
    if (n < 0) {
        throw new Error("String length must be non-negative");
    }
    const xs = new Array(n);
    for (let i = 0; i < n; i++) {
        xs[i] = f(i);
    }
    return xs.join("");
}
export function insert(str, startIndex, value) {
    if (startIndex < 0 || startIndex > str.length) {
        throw new Error("startIndex is negative or greater than the length of this instance.");
    }
    return str.substring(0, startIndex) + value + str.substring(startIndex);
}
export function isNullOrEmpty(str) {
    return typeof str !== "string" || str.length === 0;
}
export function isNullOrWhiteSpace(str) {
    return typeof str !== "string" || /^\s*$/.test(str);
}
export function join(delimiter, xs) {
    let xs2 = xs;
    if (typeof xs === "string") {
        const len = arguments.length;
        xs2 = Array(len - 1);
        for (let key = 1; key < len; key++) {
            xs2[key - 1] = arguments[key];
        }
    }
    else if (!Array.isArray(xs)) {
        xs2 = Array.from(xs);
    }
    return xs2.join(delimiter);
}
export function newGuid() {
    let uuid = "";
    for (let i = 0; i < 32; i++) {
        const random = Math.random() * 16 | 0;
        if (i === 8 || i === 12 || i === 16 || i === 20) {
            uuid += "-";
        }
        uuid += (i === 12 ? 4 : i === 16 ? random & 3 | 8 : random).toString(16);
    }
    return uuid;
}
export function padLeft(str, len, ch, isRight) {
    ch = ch || " ";
    str = String(str);
    len = len - str.length;
    for (let i = 0; i < len; i++) {
        str = isRight ? str + ch : ch + str;
    }
    return str;
}
export function padRight(str, len, ch) {
    return padLeft(str, len, ch, true);
}
export function remove(str, startIndex, count) {
    if (startIndex >= str.length) {
        throw new Error("startIndex must be less than length of string");
    }
    if (typeof count === "number" && (startIndex + count) > str.length) {
        throw new Error("Index and count must refer to a location within the string.");
    }
    return str.slice(0, startIndex) + (typeof count === "number" ? str.substr(startIndex + count) : "");
}
export function replace(str, search, replace) {
    return str.replace(new RegExp(escape(search), "g"), replace);
}
export function replicate(n, x) {
    return initialize(n, () => x);
}
export function getCharAtIndex(input, index) {
    if (index < 0 || index > input.length) {
        throw new Error("System.IndexOutOfRangeException: Index was outside the bounds of the array.");
    }
    return input[index];
}
export function split(str, splitters, count, removeEmpty) {
    count = typeof count === "number" ? count : null;
    removeEmpty = typeof removeEmpty === "number" ? removeEmpty : null;
    if (count < 0) {
        throw new Error("Count cannot be less than zero");
    }
    if (count === 0) {
        return [];
    }
    let splitters2 = splitters;
    if (!Array.isArray(splitters)) {
        const len = arguments.length;
        splitters2 = Array(len - 1);
        for (let key = 1; key < len; key++) {
            splitters2[key - 1] = arguments[key];
        }
    }
    splitters2 = splitters2.map((x) => escape(x));
    splitters2 = splitters2.length > 0 ? splitters2 : [" "];
    let i = 0;
    const splits = [];
    const reg = new RegExp(splitters2.join("|"), "g");
    while (count == null || count > 1) {
        const m = reg.exec(str);
        if (m === null) {
            break;
        }
        if (!removeEmpty || (m.index - i) > 0) {
            count = count != null ? count - 1 : count;
            splits.push(str.substring(i, m.index));
        }
        i = reg.lastIndex;
    }
    if (!removeEmpty || (str.length - i) > 0) {
        splits.push(str.substring(i));
    }
    return splits;
}
export function trim(str, side, ...chars) {
    if (side === "both" && chars.length === 0) {
        return str.trim();
    }
    if (side === "start" || side === "both") {
        const reg = chars.length === 0 ? /^\s+/ : new RegExp("^[" + escape(chars.join("")) + "]+");
        str = str.replace(reg, "");
    }
    if (side === "end" || side === "both") {
        const reg = chars.length === 0 ? /\s+$/ : new RegExp("[" + escape(chars.join("")) + "]+$");
        str = str.replace(reg, "");
    }
    return str;
}
