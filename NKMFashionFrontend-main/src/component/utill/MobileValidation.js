// Helper function to validate the mobile number input
export const isValidMobileInput = (value) => /^[+\d]*$/.test(value);

// Helper function to determine if a key is allowed
export const isAllowedKey = (key) => {
    const allowedKeys = [
        "Backspace",
        "Delete",
        "Tab",
        "ArrowLeft",
        "ArrowRight",
        "Enter",
        "Escape"
    ];
    return allowedKeys.includes(key) || /[\d+]/.test(key);
};