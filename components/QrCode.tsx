import React, { useMemo } from 'react';

// Membuat pola QR sederhana yang selalu sama untuk data yang sama.
const generateQRMatrix = (data: string, size: number = 25): boolean[][] => {
  let hash = 2166136261;
  for (let i = 0; i < data.length; i++) {
    hash ^= data.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  let seed = Math.abs(hash) || 12345;
  const rand = () => {
    seed = (Math.imul(seed, 1103515245) + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Tiga kotak di sudut membantu pola ini terlihat seperti QR code.
  const drawFinder = (sx: number, sy: number) => {
    for (let y = -1; y < 8; y++) {
      for (let x = -1; x < 8; x++) {
        const gx = sx + x;
        const gy = sy + y;
        if (gx < 0 || gy < 0 || gx >= size || gy >= size) continue;

        const inOuter = x >= 0 && x <= 6 && y >= 0 && y <= 6;
        if (!inOuter) {
          matrix[gy][gx] = false;
          continue;
        }

        matrix[gy][gx] = (x === 0 || x === 6 || y === 0 || y === 6) || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
      }
    }
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      matrix[y][x] = rand() > 0.52;
    }
  }

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  return matrix;
};

function QRCodeBase({
  value,
  size = 220,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  // Pola hanya dihitung ulang saat nilai QR berubah.
  const matrix = useMemo(() => generateQRMatrix(value), [value]);
  const n = matrix.length;
  const cell = size / n;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label={`QR code for ${value}`}
    >
      <rect width={size} height={size} fill="#ffffff" rx={12} />
      {matrix.map((row, y) =>
        row.map((filled, x) =>
          filled ? (
            <rect
              key={`${x}-${y}`}
              x={x * cell + cell * 0.08}
              y={y * cell + cell * 0.08}
              width={cell * 0.84}
              height={cell * 0.84}
              rx={cell * 0.18}
              fill="#0f172a"
            />
          ) : null,
        ),
      )}

      <g transform={`translate(${size / 2 - size * 0.09}, ${size / 2 - size * 0.09})`}>
        <rect width={size * 0.18} height={size * 0.18} rx={size * 0.03} fill="#10b981" />
        <g
          transform={`scale(${(size * 0.18) / 24})`}
          stroke="#ffffff"
          strokeWidth={2.4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </g>
      </g>
    </svg>
  );
}

export function QRCodePremium({ value, size = 220 }: { value: string; size?: number }) {
  // Ukuran ini dipakai untuk QR yang tampil sebagai komponen utama.
  return <QRCodeBase value={value} size={size} />;
}

export function QRCodeMini({ value, size = 120 }: { value: string; size?: number }) {
  return <QRCodeBase value={value} size={size} />;
}

export function QRCodeEnergy({ value, size = 150 }: { value: string; size?: number }) {
  return <QRCodeBase value={value} size={size} />;
}

export default QRCodePremium;