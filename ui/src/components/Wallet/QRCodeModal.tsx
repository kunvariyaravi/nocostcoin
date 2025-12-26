'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    address: string;
}

export default function QRCodeModal({ isOpen, onClose, address }: QRCodeModalProps) {
    if (!isOpen) return null;

    const downloadQR = () => {
        const svg = document.getElementById('wallet-qr');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL('image/png');

            const downloadLink = document.createElement('a');
            downloadLink.download = `wallet-${address.substring(0, 8)}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Wallet QR Code</h2>
                    <button
                        className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className="flex justify-center mb-6 p-4 bg-gray-50 rounded-lg">
                    <QRCodeSVG
                        id="wallet-qr"
                        value={address}
                        size={256}
                        level="H"
                        includeMargin={true}
                    />
                </div>

                <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                    <p className="font-mono text-xs text-gray-900 break-all text-center">
                        {address}
                    </p>
                </div>

                <button className="btn-primary w-full" onClick={downloadQR}>
                    📥 Download QR Code
                </button>
            </div>
        </div>
    );
}
