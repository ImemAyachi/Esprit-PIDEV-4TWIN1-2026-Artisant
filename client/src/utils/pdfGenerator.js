import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoicePDF = (invoice) => {
    try {
        console.log("Starting PDF generation for invoice:", invoice);
        const doc = new jsPDF();

        // Branding Colors
        const brandTeal = [45, 90, 90];
        const brandOrange = [255, 120, 80];

        // Header
        doc.setFillColor(...brandTeal);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("ARTISANT", 20, 20);

        doc.setFontSize(10);
        doc.text("Plateforme Industrielle Collaborative", 20, 28);

        doc.setFontSize(16);
        doc.text("FACTURE", 150, 25);
        doc.setFontSize(10);
        doc.text(invoice.invoiceNumber || 'N/A', 150, 32);

        // Client & Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text("DESTINATAIRE:", 20, 60);
        doc.setFont("helvetica", "normal");
        doc.text(invoice.clientName || 'Client Inconnu', 20, 68);
        doc.text(invoice.clientEmail || "", 20, 74);

        doc.setFont("helvetica", "bold");
        doc.text("DÉTAILS:", 130, 60);
        doc.setFont("helvetica", "normal");
        const dueDateStr = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A';
        doc.text(`Date d'échéance: ${dueDateStr}`, 130, 68);
        doc.text(`Devis: ${invoice.quote?.quoteNumber || "Direct"}`, 130, 74);
        doc.text(`Statut: ${invoice.status || 'N/A'}`, 130, 80);

        // Table
        const items = invoice.items || [];
        const tableData = items.map(item => [
            item.description || 'Sans description',
            (item.quantity || 0).toString(),
            `${(item.unitPrice || 0).toLocaleString()} DT`,
            `${((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString()} DT`
        ]);

        if (typeof autoTable !== 'function') {
            console.error("autoTable is not a function", autoTable);
            throw new Error("Bibliothèque de tableaux PDF non chargée.");
        }

        autoTable(doc, {
            startY: 95,
            head: [['Designation', 'Qté', 'Prix Unitaire', 'Total']],
            body: tableData,
            headStyles: { fillColor: brandTeal, textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 248, 248] },
            margin: { left: 20, right: 20 }
        });

        // Totals
        const finalY = doc.lastAutoTable?.finalY || 150;
        const totalY = finalY + 10;

        doc.setFontSize(10);
        doc.text("Taxes incluses:", 130, totalY);
        doc.text(`${(invoice.tax || 0).toLocaleString()} DT`, 180, totalY, { align: 'right' });

        doc.setFillColor(...brandTeal);
        doc.rect(125, totalY + 5, 65, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL:", 130, totalY + 13);
        doc.text(`${(invoice.totalAmount || 0).toLocaleString()} DT`, 185, totalY + 13, { align: 'right' });

        // Footer / Accessibility Note
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text("Ce document est généré de manière industrielle et accessible aux lecteurs d'écran.", 105, 285, { align: 'center' });

        const fileName = `${invoice.invoiceNumber || 'facture'}.pdf`;
        doc.save(fileName);
        console.log("PDF generated successfully!");
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Erreur lors de la génération du PDF: " + error.message);
    }
};
