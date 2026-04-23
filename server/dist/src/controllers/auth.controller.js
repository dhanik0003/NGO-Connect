"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("../services/auth.service");
exports.authController = {
    registerUser: async (req, res) => {
        const result = await auth_service_1.authService.registerUser({
            ...req.body,
            profileImageUrl: req.uploadedFileUrl,
        });
        res.status(201).json({ success: true, data: result });
    },
    registerNgo: async (req, res) => {
        const result = await auth_service_1.authService.registerNgo({
            ...req.body,
            verificationDocumentUrl: req.uploadedFileUrl,
        });
        res.status(201).json({ success: true, data: result });
    },
    registerSurveyor: async (req, res) => {
        const result = await auth_service_1.authService.registerSurveyor({
            ...req.body,
            idProofUrl: req.uploadedFileUrl,
        });
        res.status(201).json({ success: true, data: result });
    },
    registerVolunteer: async (req, res) => {
        const result = await auth_service_1.authService.registerVolunteer({
            ...req.body,
            idProofUrl: req.uploadedFileUrl,
        });
        res.status(201).json({ success: true, data: result });
    },
    login: async (req, res) => {
        const result = await auth_service_1.authService.login(req.body.email, req.body.password);
        res.json({ success: true, data: result });
    },
    refresh: async (req, res) => {
        const result = await auth_service_1.authService.refresh(req.body.refreshToken);
        res.json({ success: true, data: result });
    },
    logout: async (req, res) => {
        const result = await auth_service_1.authService.logout(req.body.refreshToken);
        res.json({ success: true, data: result });
    },
    forgotPassword: async (req, res) => {
        const result = await auth_service_1.authService.forgotPassword(req.body.email);
        res.json({ success: true, data: result });
    },
    resetPassword: async (req, res) => {
        const result = await auth_service_1.authService.resetPassword(req.body.token, req.body.password);
        res.json({ success: true, data: result });
    },
    me: async (req, res) => {
        const result = await auth_service_1.authService.getMe(req.user.id);
        res.json({ success: true, data: result });
    },
    updateMe: async (req, res) => {
        const result = await auth_service_1.authService.updateProfile(req.user.id, req.body);
        res.json({ success: true, data: result });
    },
};
