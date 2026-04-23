"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metaRouter = void 0;
const express_1 = require("express");
const meta_controller_1 = require("../controllers/meta.controller");
const async_handler_1 = require("../utils/async-handler");
exports.metaRouter = (0, express_1.Router)();
exports.metaRouter.get("/bootstrap", (0, async_handler_1.asyncHandler)(meta_controller_1.metaController.bootstrap));
