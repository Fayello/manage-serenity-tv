import { deviceService } from '../services/api';

export const getDeviceId = () => {
    let deviceId = localStorage.getItem('serenity_device_id');
    if (!deviceId) {
        // Generate a random MAC-like string for consistency
        deviceId = Array.from({ length: 6 }, () =>
            Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0')
        ).join(':');

        localStorage.setItem('serenity_device_id', deviceId);

        // Try to register implicitly on first creation (fire and forget)
        deviceService.register(deviceId).catch(console.error);
    }
    return deviceId;
};

export const checkActivationStatus = async () => {
    try {
        const deviceId = getDeviceId();
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
    const deviceId = getDeviceId();
    try {
        const response = await deviceService.activate(code, deviceId);
        return response.data.status === 'active';
    } catch (error) {
        throw error;
    }
};
