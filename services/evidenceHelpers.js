const sharp = require('sharp');
const { PDFDocument, rgb } = require('pdf-lib');
const { supabase } = require('../config');

const generateWatermarkText = (userWallet, caseNumber, timestamp) => {
    return `${userWallet.slice(0, 8)}... | Case: ${caseNumber || 'N/A'} | ${new Date(timestamp).toLocaleString()}`;
};

const watermarkImage = async (imageBuffer, watermarkText) => {
    try {
        const image = sharp(imageBuffer);
        const { width, height } = await image.metadata();
        
        const watermarkSvg = `
            <svg width="${width}" height="${height}">
                <rect width="100%" height="100%" fill="none"/>
                <text x="10" y="${height - 20}" font-family="Arial" font-size="14" fill="rgba(255,255,255,0.8)" stroke="rgba(0,0,0,0.8)" stroke-width="1">${watermarkText}</text>
            </svg>
        `;
        
        return await image
            .composite([{ input: Buffer.from(watermarkSvg), top: 0, left: 0 }])
            .toBuffer();
    } catch (error) {
        console.error('Image watermarking error:', error);
        return imageBuffer; // Return original if watermarking fails
    }
};

const watermarkPDF = async (pdfBuffer, watermarkText) => {
    try {
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pages = pdfDoc.getPages();
        
        pages.forEach(page => {
            const { width, height } = page.getSize();
            page.drawText(watermarkText, {
                x: 10,
                y: 10,
                size: 8,
                color: rgb(0.5, 0.5, 0.5),
            });
        });
        
        return await pdfDoc.save();
    } catch (error) {
        console.error('PDF watermarking error:', error);
        return pdfBuffer; // Return original if watermarking fails
    }
};

const logDownloadAction = async (userWallet, evidenceId, actionType, details) => {
    try {
        await supabase
            .from('activity_logs')
            .insert({
                user_id: userWallet,
                action: actionType,
                details: JSON.stringify(details),
                timestamp: new Date().toISOString()
            });
    } catch (error) {
        console.error('Error logging download action:', error);
    }
};

// Helper functions for mock data
function generateMockIPFSHash() {
    return 'Qm' + Array.from({length: 44}, () => 
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        .charAt(Math.floor(Math.random() * 62))
    ).join('');
}

function generateMockTxHash() {
    return '0x' + Array.from({length: 64}, () => 
        '0123456789abcdef'.charAt(Math.floor(Math.random() * 16))
    ).join('');
}

module.exports = {
    generateWatermarkText,
    watermarkImage,
    watermarkPDF,
    logDownloadAction,
    generateMockIPFSHash,
    generateMockTxHash
};
