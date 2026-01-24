import { v4 as uuidv4 } from 'uuid';

export const getDeviceId = () => {
    let deviceId = localStorage.getItem('serenity_device_id');
    if (!deviceId) {
        // Generate a random MAC-like string
        const hex = '0123456789A';
        deviceId = 'XX:XX:XX:XX:XX:XX'.replace(/X/g, () => {
            return hex.charAt(Math.floor(Math.random() * hex.length));
        });
        // Or just use a UUID if uniqueness is more important than format, 
        // but user asked for "linked to mac address" so let's mock the format.
        // Actually, let's make it look cleaner.
        deviceId = Array.from({ length: 6 }, () =>
            Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0')
        ).join(':');

        localStorage.setItem('serenity_device_id', deviceId);
    }
    return deviceId;
};

export const checkActivationStatus = () => {
    return localStorage.getItem('serenity_activated') === 'true';
};

export const activateDevice = (code) => {
    // Mock backend validation
    // In a real app, this would ping an API with the code and deviceId
    if (code === '1234') { // Simple mock code
        localStorage.setItem('serenity_activated', 'true');
        return true;
    }
    return false;
};
