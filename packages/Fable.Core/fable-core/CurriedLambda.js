export default function CurriedLambda(f, _this, expectedArgsLength) {
    return (...args) => {
        // _this = _this || this;
        expectedArgsLength = expectedArgsLength || f.length;
        if (args.length >= expectedArgsLength) {
            const restArgs = args.splice(expectedArgsLength);
            const res = f.apply(_this, args);
            if (typeof res === "function") {
                const newLambda = CurriedLambda(res, _this);
                return restArgs.length === 0 ? newLambda : newLambda.apply(_this, restArgs);
            }
            else {
                return res;
            }
        }
        else {
            return CurriedLambda((...args2) => {
                return f.apply(_this, args.concat(args2));
            }, _this, expectedArgsLength - args.length);
        }
    };
}
