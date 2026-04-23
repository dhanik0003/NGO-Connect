"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haversineDistanceKm = void 0;
const EARTH_RADIUS_KM = 6371;
const toRadians = (value) => (value * Math.PI) / 180;
const haversineDistanceKm = (pointA, pointB) => {
    const deltaLat = toRadians(pointB.latitude - pointA.latitude);
    const deltaLng = toRadians(pointB.longitude - pointA.longitude);
    const lat1 = toRadians(pointA.latitude);
    const lat2 = toRadians(pointB.latitude);
    const a = Math.sin(deltaLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
exports.haversineDistanceKm = haversineDistanceKm;
