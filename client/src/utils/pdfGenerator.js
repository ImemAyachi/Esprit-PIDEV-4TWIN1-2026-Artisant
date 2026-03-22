import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const brandTeal = [45, 90, 90];
const brandOrange = [255, 120, 80];

export const generateDocumentPDF = (docType, data) => {
    try {
        const doc = new jsPDF();
        const isInvoice = docType === 'INVOICE';
        
        // Header
        doc.setFillColor(...brandTeal);
        doc.rect(0, 0, 210, 50, 'F');
        doc.setFillColor(...brandOrange);
        doc.rect(0, 48, 210, 2, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont("helvetica", "bold");
        doc.text("ARTISANT", 20, 25);
        doc.setFontSize(10);
        doc.text("PÔLE INDUSTRIEL COLLABORATIF", 20, 35);

        doc.setFontSize(18);
        doc.text(isInvoice ? "FACTURE" : "DEVIS", 150, 25);
        doc.setFontSize(10);
        doc.text(isInvoice ? (data.invoiceNumber || 'N/A') : (data.quoteNumber || 'N/A'), 150, 35);

        // Body Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text("DESTINATAIRE:", 20, 70);
        doc.setFont("helvetica", "normal");
        doc.text(data.client?.name || 'Client Inconnu', 20, 80);
        doc.text(data.client?.address || "", 20, 86);
        doc.text(data.client?.email || "", 20, 92);

        doc.setFont("helvetica", "bold");
        doc.text("DÉTAILS OPÉRATIONNELS:", 130, 70);
        doc.setFont("helvetica", "normal");
        const date = isInvoice ? (data.payment?.dueDate ? new Date(data.payment.dueDate).toLocaleDateString() : 'N/A') 
                             : (data.validUntil ? new Date(data.validUntil).toLocaleDateString() : 'N/A');
        doc.text(`Date ${isInvoice ? 'Echéance' : 'Validité'}: ${date}`, 130, 80);
        doc.text(`Réf: ${isInvoice ? data.invoiceNumber : data.quoteNumber}`, 130, 86);
        if (isInvoice && data.quote) doc.text(`Devis Source: ${data.quote.quoteNumber}`, 130, 92);

        // Table
        const tableData = (data.items || []).map(item => [
            item.description,
            item.quantity.toString(),
            `${item.unitPrice.toLocaleString()} DT`,
            `${(item.discount?.value || 0)}${item.discount?.type === 'percentage' ? '%' : ' DT'}`,
            `${item.total?.toLocaleString()} DT`
        ]);

        autoTable(doc, {
            startY: 110,
            head: [['Désignation', 'Qté', 'P.U', 'Remise', 'Total HT']],
            body: tableData,
            headStyles: { fillColor: brandTeal, textColor: 255, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [245, 248, 248] },
            margin: { left: 20, right: 20 }
        });

        // Totals
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.setTextColor(0,0,0);
        doc.text("Sous-Total HT:", 130, finalY);
        doc.text(`${data.financials?.subtotal.toLocaleString()} DT`, 185, finalY, { align: 'right' });
        
        doc.text("TVA (19%):", 130, finalY + 6);
        doc.text(`${(data.financials?.subtotal * 0.19).toLocaleString()} DT`, 185, finalY + 6, { align: 'right' });

        if (data.financials?.shipping > 0) {
            doc.text("Logistique:", 130, finalY + 12);
            doc.text(`${data.financials.shipping.toLocaleString()} DT`, 185, finalY + 12, { align: 'right' });
        }

        doc.setFillColor(...brandTeal);
        doc.rect(125, finalY + 18, 65, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("NET À PAYER:", 130, finalY + 26);
        doc.text(`${data.financials?.grandTotal.toLocaleString()} DT`, 185, finalY + 26, { align: 'right' });

        // Notes & Signature
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text("NOTES & TERMES:", 20, finalY + 50);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const terms = data.termsAndConditions || "Paiement à réception.";
        const splitTerms = doc.splitTextToSize(terms, 100);
        doc.text(splitTerms, 20, finalY + 58);

        if (data.signature?.data) {
            doc.text("SIGNATURE CLIENT (SCELLÉE):", 130, finalY + 50);
            doc.addImage(data.signature.data, 'PNG', 130, finalY + 55, 40, 20);
            doc.setFontSize(6);
            doc.text(`Identifiant IP: ${data.signature.ipAddress || 'Interne'}`, 130, finalY + 78);
            doc.text(`Horodatage: ${new Date(data.signature.signedAt).toLocaleString()}`, 130, finalY + 82);
        }

        // Footer
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(7);
        doc.text("Document certifié par le protocole Artisant. Généré de manière industrielle.", 105, 285, { align: 'center' });

        const fileName = `${isInvoice ? 'FACT' : 'DEV'}-${data.invoiceNumber || data.quoteNumber}.pdf`;
        doc.save(fileName);
    } catch (error) {
        console.error("PDF Fail:", error);
    }
};

export const generateInvoicePDF = (data) => generateDocumentPDF('INVOICE', data);
export const generateQuotePDF = (data) => generateDocumentPDF('QUOTE', data);
