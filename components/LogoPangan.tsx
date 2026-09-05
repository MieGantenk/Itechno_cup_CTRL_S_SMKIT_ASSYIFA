interface LogoPanganProps {
  className?: string;
}

export default function LogoPangan({ className = 'w-6 h-6' }: LogoPanganProps) {
  return <img className={className} src="/logo%20transparan.png" alt="Logo PanganCerdas" />;
}
