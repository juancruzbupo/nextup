'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from './Toast';

interface AccessCodeCardProps {
  /** For venues: slug. For events: accessCode */
  code: string;
  name: string;
  /** 'venue' builds /venue/{slug}, 'event' builds /event/{code} */
  entityType: 'venue' | 'event';
  styles: Record<string, string>;
}

function downloadQR(svgId: string, filename: string) {
  const svg = document.getElementById(svgId);
  if (!svg) return;
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const data = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 400, 400);
    ctx.drawImage(img, 0, 0, 400, 400);
    const a = document.createElement('a');
    a.download = filename;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };
  img.src = 'data:image/svg+xml;base64,' + btoa(data);
}

export function AccessCodeCard({ code, name, entityType, styles }: AccessCodeCardProps) {
  const [showQR, setShowQR] = useState(false);
  const toast = useToast();

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const path = entityType === 'event' ? `/event/${code}` : `/venue/${code}`;
  const fullUrl = `${origin}${path}`;
  const qrId = `${entityType}-qr-card`;
  const isEvent = entityType === 'event';

  return (
    <div className={styles.accessCodeSection}>
      <p className={styles.accessCodeLabel}>{isEvent ? 'Código de acceso' : 'Enlace para clientes'}</p>
      {isEvent ? (
        <p className={styles.accessCode}>{code}</p>
      ) : (
        <p style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text)' }}>nextup.app{path}</p>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        <button
          onClick={() => { navigator.clipboard.writeText(isEvent ? code : fullUrl); toast(isEvent ? 'Código copiado' : 'Enlace copiado', 'success'); }}
          className={styles.copyCodeBtn}
        >
          {isEvent ? 'Copiar código' : 'Copiar enlace'}
        </button>
        {isEvent && (
          <button
            onClick={() => {
              const text = `Unite a ${name} y elegí la música! Código: ${code}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${fullUrl}`)}`, '_blank');
            }}
            className={styles.copyCodeBtn}
            style={{ background: '#25D366', color: '#fff', borderColor: '#25D366' }}
          >
            Compartir por WhatsApp
          </button>
        )}
        <button onClick={() => setShowQR(!showQR)} className={styles.copyCodeBtn}>
          {showQR ? 'Ocultar QR' : 'Mostrar QR'}
        </button>
      </div>
      {isEvent && <p className={styles.accessCodeHint}>Compartilo con tus invitados</p>}

      {showQR && (
        <div className={styles.qrContainer} style={{ marginTop: 12 }}>
          <QRCodeSVG id={qrId} value={fullUrl} size={180} bgColor="#ffffff" fgColor="#000000" level="M" />
          <span className={styles.qrUrl}>{path}</span>
          <button onClick={() => downloadQR(qrId, `qr-${code}.png`)} className={styles.qrToggle} style={{ marginTop: 8 }}>
            Descargar QR
          </button>
        </div>
      )}
    </div>
  );
}
