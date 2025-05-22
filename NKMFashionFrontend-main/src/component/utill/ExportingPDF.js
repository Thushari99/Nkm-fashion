// import { jsPDF } from "jspdf";
// import axios from "axios";
// import { useEffect, useState } from "react";

// export const handleExportPdf = async (data, currency) => {
//     if (!Array.isArray(data)) {
//         console.error("Data passed to handleExportPdf is not an array:", data);
//         return;
//     }

//     try {
//         // Fetch company details
//         const fetchSettings = async () => {
//             try {
//                 const { data } = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getSettings`);
//                 return data;
//             } catch (error) {
//                 console.error("[DEBUG] Error fetching settings:", error);
//                 return {};
//             }
//         };

//         const settings = await fetchSettings();
//         const {
//             companyName,
//             companyMobile,
//             email,
//             address,
//             logo,
//         } = settings;

//         const pdf = new jsPDF("p", "mm", "a4");
//         const pageWidth = pdf.internal.pageSize.getWidth();
//         const pageHeight = pdf.internal.pageSize.getHeight();

//         let currentY = 0;

//         // Add Company Logo in the Center
//         if (logo) {
//             const logoImage = await loadImage(logo);
//             const logoWidth = 35;
//             const logoHeight = 35;
//             const logoX = (pageWidth - logoWidth) / 2;
//             pdf.addImage(logoImage, "JPEG", logoX, currentY, logoWidth, logoHeight);
//             currentY += logoHeight - 4;
//         }

//         // Company Info Section
//         pdf.setFontSize(12);
//         pdf.setTextColor(0, 0, 0);
//         pdf.setFont("helvetica", "normal");
//         pdf.text(`${companyName || "N/A"}`, pageWidth / 2, currentY, { align: "center" });
//         currentY += 6;
//         pdf.text(`${companyMobile || "N/A"}`, pageWidth / 2, currentY, { align: "center" });
//         currentY += 6;
//         pdf.text(`${email || "N/A"}`, pageWidth / 2, currentY, { align: "center" });
//         currentY += 6;
//         pdf.text(`${address || "N/A"}`, pageWidth / 2, currentY, { align: "center" });
//         currentY += 14;

//         // Title
//         pdf.setFont("helvetica", "bold");
//         pdf.setTextColor(26, 91, 99);
//         pdf.setFontSize(19);
//         pdf.text("Customer Sales Report", pageWidth / 2, currentY, { align: "center" });
//         currentY += 0;

//         // Table and Summary Generation
//         const tableColumn = ["Customer", "Mobile", "Total Sales", "Sale Amount", "Paid"];
//         const columnWidths = [40, 40, 30, 50, 40];
//         let startX = 10;
//         let startY = currentY + 10;
//         let rowHeight = 8;

//         pdf.setFillColor(200, 200, 200);
//         pdf.rect(startX, startY, columnWidths.reduce((a, b) => a + b, 0), rowHeight, "F");
//         pdf.setFontSize(10);
//         pdf.setFont("helvetica", "bold");
//         pdf.setTextColor(0, 0, 0);
//         let columnX = startX;

//         tableColumn.forEach((col, index) => {
//             pdf.text(col, columnX + 3, startY + 5);
//             pdf.rect(columnX, startY, columnWidths[index], rowHeight);
//             columnX += columnWidths[index];
//         });

//         currentY = startY + rowHeight;
//         let totalSalesCount = 0;
//         let totalSalesAmount = 0;
//         let totalPaidAmount = 0;

//         data.forEach((sale, rowIndex) => {
//             const totalSalesAmountPerCustomer = sale.sales.reduce((acc, sale) => acc + sale.amount, 0);
//             const totalPaidAmountPerCustomer = sale.sales.reduce((acc, sale) => acc + sale.paid, 0);
//             totalSalesCount += sale.sales.length;
//             totalSalesAmount += totalSalesAmountPerCustomer;
//             totalPaidAmount += totalPaidAmountPerCustomer;

//             const rowData = [
//                 sale.name,
//                 sale.mobile,
//                 sale.sales.length.toString(),
//                 `${currency} ${totalSalesAmountPerCustomer.toLocaleString()}`,
//                 `${currency} ${totalPaidAmountPerCustomer.toLocaleString()}`
//             ];

//             if (rowIndex % 2 === 0) {
//                 pdf.setFillColor(240, 240, 240);
//                 pdf.rect(startX, currentY, columnWidths.reduce((a, b) => a + b, 0), rowHeight, "F");
//             }

//             let columnX = startX;
//             rowData.forEach((cell, cellIndex) => {
//                 pdf.text(cell, columnX + 3, currentY + 5);
//                 pdf.rect(columnX, currentY, columnWidths[cellIndex], rowHeight);
//                 columnX += columnWidths[cellIndex];
//             });

//             currentY += rowHeight;

//             if (currentY + rowHeight > pageHeight - 40) {
//                 pdf.addPage();
//                 currentY = 20;
//             }
//         });

//         // Summary Section
//         currentY += 10;
//         pdf.setFillColor(228, 248, 243);
//         pdf.setDrawColor(26, 91, 99);
//         pdf.rect(10, currentY, pageWidth - 20, 30, "FD");

//         pdf.setFontSize(14);
//         pdf.setFont("helvetica", "bold");
//         pdf.setTextColor(26, 91, 99);
//         pdf.text("Sales Summary", pageWidth / 2, currentY + 8, { align: "center" });

//         pdf.setFontSize(10);
//         pdf.setFont("helvetica", "normal");
//         pdf.setTextColor(0, 0, 0);

//         currentY += 14;
//         pdf.text("Total Sales Transactions:", 15, currentY);
//         pdf.text(`${totalSalesCount}`, 120, currentY);
//         currentY += 6;
//         pdf.text("Total Sales Amount:", 15, currentY);
//         pdf.text(`${currency} ${totalSalesAmount.toLocaleString()}`, 120, currentY);
//         currentY += 6;
//         pdf.text("Total Paid Amount:", 15, currentY);
//         pdf.text(`${currency} ${totalPaidAmount.toLocaleString()}`, 120, currentY);

//         pdf.save("customer_report.pdf");
//     } catch (error) {
//         console.error("Failed to export PDF:", error);
//     }
// };

// const loadImage = (url) => {
//     return new Promise((resolve, reject) => {
//         const img = new Image();
//         img.onload = () => resolve(img);
//         img.onerror = (error) => reject(error);
//         img.src = url;
//     });
// };

import { jsPDF } from "jspdf";
import axios from "axios";

// Function to generate and download the PDF report
export const handleExportPdf = async ({
    data,
    currency,
    title,
    summaryTitle,
    tableColumns,
    dataKeys,
    additionalData = {},
}) => {
    if (!Array.isArray(data)) {
        console.error("Data passed to handleExportPdf is not an array:", data);
        return;
    }

    try {
        // Fetch company details
        const fetchSettings = async () => {
            try {
                const { data } = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getSettings`);
                return data;
            } catch (error) {
                console.error("[DEBUG] Error fetching settings:", error);
                return {};
            }
        };

        const settings = await fetchSettings();
        const { companyName, companyMobile, email, address, logo } = settings;

        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        let currentY = 10; // Initial Y position

        // Add Company Logo in the Center
        if (logo) {
            const logoImage = await loadImage(logo);
            const logoWidth = 25;  // Desired width
            const logoHeight = 25; // Desired height
            const logoX = (pageWidth - logoWidth) / 2;
        
            if (logoImage) {
                pdf.addImage(logoImage, "JPEG", logoX, currentY, logoWidth, logoHeight, '', 'FAST');
                currentY += logoHeight + 5;
            }
        }
        

        // Company Info Section
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "normal");
        pdf.text(companyName || "N/A", pageWidth / 2, currentY, { align: "center" });
        currentY += 6;
        pdf.text(companyMobile || "N/A", pageWidth / 2, currentY, { align: "center" });
        currentY += 6;
        pdf.text(email || "N/A", pageWidth / 2, currentY, { align: "center" });
        currentY += 6;
        pdf.text(address || "N/A", pageWidth / 2, currentY, { align: "center" });
        currentY += 14;

        // Title Section
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(26, 91, 99);
        pdf.setFontSize(19);
        pdf.text(title, pageWidth / 2, currentY, { align: "center" });
        currentY += 10;

        const getTextWidth = (text, fontSize = 10) => {
            pdf.setFontSize(fontSize);
            return pdf.getTextWidth(text);
        };

        // Calculate Column Widths Dynamically
        const columnWidths = tableColumns.map((col, index) => {
            const maxTextWidth = Math.max(
                ...data.map(row => getTextWidth(row[dataKeys[index]] ? row[dataKeys[index]].toString() : "")),
                getTextWidth(col)
            );
            return Math.min(Math.max(maxTextWidth + 6, 30), 80); // Min 30, Max 80
        });

        let startX = 10;
        let startY = currentY + 10;
        let rowHeight = 8;

        // Table Header (Bold)
        pdf.setFillColor(200, 200, 200);
        pdf.rect(startX, startY, columnWidths.reduce((a, b) => a + b, 0), rowHeight, "F");
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 0, 0);

        let columnX = startX;
        tableColumns.forEach((col, index) => {
            pdf.text(col, columnX + 3, startY + 5);
            pdf.rect(columnX, startY, columnWidths[index], rowHeight);
            columnX += columnWidths[index];
        });

        currentY = startY + rowHeight;
        let totalAmount = 0;

        // Table Data
        data.forEach((row, rowIndex) => {
            const rowData = dataKeys.map(key => row[key] ?? "N/A");

            if (rowIndex % 2 === 0) {
                pdf.setFillColor(240, 240, 240);
                pdf.rect(startX, currentY, columnWidths.reduce((a, b) => a + b, 0), rowHeight, "F");
            }

            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(0, 0, 0);
            let columnX = startX;
            rowData.forEach((cell, cellIndex) => {
                const cellText = cell != null ? cell.toString() : ''; 
                pdf.text(cellText, columnX + 3, currentY + 5);
                pdf.rect(columnX, currentY, columnWidths[cellIndex], rowHeight);
                columnX += columnWidths[cellIndex];
            });

            if (row.saleAmount) {
                totalAmount += parseFloat(row.saleAmount);
            }

            currentY += rowHeight;

            if (currentY + rowHeight > pageHeight - 40) {
                pdf.addPage();
                currentY = 20;
            }
        });

        // Summary Section
        currentY += 10;
        pdf.setFillColor(228, 248, 243);
        pdf.setDrawColor(26, 91, 99);
        pdf.rect(10, currentY, pageWidth - 20, 40, "FD");

        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(26, 91, 99);
        pdf.text(summaryTitle, pageWidth / 2, currentY + 8, { align: "center" });

        pdf.setFontSize(14);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0, 0, 0);

        currentY += 14;

        // Additional Data Section
        if (additionalData) {
            Object.keys(additionalData).forEach((key, idx) => {
                currentY += 6;
                pdf.text(`${key}: ${additionalData[key]}`, 15, currentY);
            });
        }

        pdf.save("report.pdf");
    } catch (error) {
        console.error("Failed to export PDF:", error);
    }
};

// Function to Load Image and Convert to Base64
const loadImage = async (url) => {
    try {
        const response = await axios.get(url, { responseType: "blob" });
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(response.data);
        });
    } catch (error) {
        console.error("Error loading image:", error);
        return null;
    }
};
