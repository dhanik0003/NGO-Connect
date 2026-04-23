"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.signRefreshToken = exports.signAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const accessTokenOptions = {
    expiresIn: env_1.env.ACCESS_TOKEN_TTL,
};
const refreshTokenOptions = {
    expiresIn: `${env_1.env.REFRESH_TOKEN_TTL_DAYS}d`,
};
const signAccessToken = (payload) => jsonwebtoken_1.default.sign(payload, env_1.env.JWT_ACCESS_SECRET, accessTokenOptions);
exports.signAccessToken = signAccessToken;
const signRefreshToken = (payload) => jsonwebtoken_1.default.sign(payload, env_1.env.JWT_REFRESH_SECRET, refreshTokenOptions);
exports.signRefreshToken = signRefreshToken;
const verifyAccessToken = (token) => jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET);
exports.verifyRefreshToken = verifyRefreshToken;
