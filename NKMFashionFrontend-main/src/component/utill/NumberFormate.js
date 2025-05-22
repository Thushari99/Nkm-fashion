export default function formatWithCustomCommas(number) {
    const [integerPart, decimalPart] = parseFloat(number).toFixed(2).split('.'); // Ensure 2 decimal places
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ','); // Add commas every 3 digits
    return `${formattedInteger}.${decimalPart}`; // Combine formatted integer part with decimal part
}
