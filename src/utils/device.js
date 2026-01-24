import { deviceService } from '../services/api';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Cache the promise to avoid multiple loads
const fpPromise = FingerprintJS.load();

export const getDeviceId = async () => {
    // 1. Try local storage first
    let storedId = localStorage.getItem('serenity_device_id');

    // FORCE MIGRATION: If ID looks like legacy MAC (contains ':'), purge it.
    // This forces the user to generate a new stable Fingerprint ID.
    if (storedId && storedId.includes(':')) {
        localStorage.removeItem('serenity_device_id');
        storedId = null;
    }

    if (storedId && storedId.length > 20) {
        return storedId;
    }

    // 2. Generate stable fingerprint
    const fp = await fpPromise;
    const result = await fp.get();
    const visitorId = result.visitorId;

    // 3. Persist
    localStorage.setItem('serenity_device_id', visitorId);

    // 4. Try explicit registration check in background
    deviceService.register(visitorId).catch(console.error);

    return visitorId;
};

export const checkActivationStatus = async () => {
    try {
        const deviceId = await getDeviceId();
        const response = await deviceService.checkStatus(deviceId);
        // Valid statuses: ACTIVE, TRIAL, PAID
        const validStatuses = ['ACTIVE', 'TRIAL', 'PAID'];
        return validStatuses.includes(response.data.status);
    } catch (error) {
        console.error("Status check failed", error);
        return false;
    }
};

export const activateDevice = async (code) => {
    const deviceId = await getDeviceId();
    try {
        const response = await deviceService.activate(code, deviceId);
        return response.data.status === 'active';
    } catch (error) {
        throw error;
    }
};
