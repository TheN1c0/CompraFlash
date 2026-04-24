/**
 * BarcodeScanner — Componente de lectura de códigos de barras.
 * 
 * Utiliza @zxing/browser para acceder a la cámara del dispositivo
 * y decodificar códigos EAN, UPC, QR, etc. en tiempo real.
 *  
 * PRINCIPIO SOLID — SRP:
 * Solo se encarga de encender la cámara, escanear y devolver el resultado.
 * No sabe qué hacer con el código; eso lo decide el componente padre.
 */
import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Camera, X } from 'lucide-react';
import './BarcodeScanner.css';

interface Props {
  onDetected: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    const startScanning = async () => {
      try {
        // Solicitar acceso a la cámara trasera preferentemente
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        
        // Elegir la cámara trasera si existe, sino la primera disponible
        const backCamera = videoInputDevices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('trasera')
        );
        const deviceId = backCamera?.deviceId || videoInputDevices[0]?.deviceId;

        if (!deviceId) {
          setError('No se encontró una cámara disponible.');
          return;
        }

        await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result) => {
            if (result) {
              onDetected(result.getText());
            }
          }
        );
      } catch (err) {
        console.error('Error al acceder a la cámara:', err);
        setError(
          'No se pudo acceder a la cámara. Asegúrate de estar en HTTPS o localhost ' +
          'y de haber dado permiso.'
        );
      }
    };

    startScanning();

    return () => {
      // Cleanup: detener todos los streams de video al desmontar
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onDetected]);

  return (
    <div className="scanner-overlay">
      <div className="scanner-container glass-panel">
        <div className="scanner-header">
          <div className="scanner-title">
            <Camera size={20} />
            <span>Escáner de código de barras</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {error ? (
          <div className="scanner-error">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="scanner-video-wrapper">
              <video ref={videoRef} className="scanner-video" />
              <div className="scanner-guide">
                <div className="scanner-corner tl" />
                <div className="scanner-corner tr" />
                <div className="scanner-corner bl" />
                <div className="scanner-corner br" />
                <div className="scanner-line" />
              </div>
            </div>
            <p className="scanner-hint">
              Apunta al código de barras del producto
            </p>
          </>
        )}
      </div>
    </div>
  );
}
