"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema, source = "body") => (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
        return res.status(422).json({
            success: false,
            message: "Validation failed.",
            issues: result.error.flatten(),
        });
    }
    req[source] = result.data;
    return next();
};
exports.validate = validate;
