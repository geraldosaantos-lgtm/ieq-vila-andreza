import React from 'react';

interface IEQLogoProps {
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  showStripe?: boolean;
}

export const IEQLogo: React.FC<IEQLogoProps> = ({ logoUrl, size = 'md' }) => {
  const dimensions =
    size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-14 h-14' : 'w-10 h-10';

  if (logoUrl && logoUrl.trim() !== '') {
    return (
      <img
        src={logoUrl}
        alt="Logo IEQ Vila Andreza"
        referrerPolicy="no-referrer"
        className={`${dimensions} rounded-lg object-cover border border-slate-200 shrink-0`}
      />
    );
  }

  // Official Foursquare Gospel (Evangelho Quadrangular) 4-Color Emblem SVG:
  // Top-Left: Red (Cross / Salvation)
  // Top-Right: Amber/Gold (Dove / Baptism of Holy Spirit)
  // Bottom-Left: Sky/Royal Blue (Chalice / Divine Healing)
  // Bottom-Right: Royal Purple (Crown / Second Coming)
  return (
    <div
      className={`${dimensions} rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2 border border-slate-900/15 shadow-xs shrink-0`}
      title="Igreja do Evangelho Quadrangular - 4 Doutrinas"
    >
      {/* 1. Vermelho: A Cruz (Salvação) */}
      <div className="bg-red-600 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white fill-current">
          <path d="M10 2h4v6h6v4h-6v10h-4V12H4V8h6V2z" />
        </svg>
      </div>

      {/* 2. Amarelo Ouro: A Pomba (Espírito Santo) */}
      <div className="bg-amber-400 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-slate-950 fill-current">
          <path d="M12 3c-1.5 2.5-4 4-7 4 1.5 2 3.5 3 6 3.5C9.5 13 7 15 4 16c3.5.5 6.5-.5 8-2.5 1.5 2 4.5 3 8 2.5-3-1-5.5-3-7-5.5 2.5-.5 4.5-1.5 6-3.5-3 0-5.5-1.5-7-4z" />
        </svg>
      </div>

      {/* 3. Azul Celeste: O Cálice (Cura Divina) */}
      <div className="bg-sky-600 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white fill-current">
          <path d="M6 3h12v3c0 3.31-2.69 6-6 6s-6-2.69-6-6V3zm5 10h2v5h4v2H7v-2h4v-5z" />
        </svg>
      </div>

      {/* 4. Roxo Real: A Coroa (Jesus o Rei que Há de Vir) */}
      <div className="bg-purple-700 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white fill-current">
          <path d="M3 18h18v2H3v-2zm0-2l2-9 4.5 4L12 5l2.5 6L19 7l2 9H3z" />
        </svg>
      </div>
    </div>
  );
};

export const IEQFourColorBar: React.FC<{ className?: string }> = ({ className = 'h-1.5 w-full' }) => (
  <div className={`grid grid-cols-4 ${className} overflow-hidden`}>
    <div className="bg-red-600" title="Jesus o Salvador (Lucas · A Cruz)" />
    <div className="bg-amber-400" title="Jesus o Batizador com o Espírito Santo (João · A Pomba)" />
    <div className="bg-sky-600" title="Jesus o Grande Médico (Marcos · O Cálice)" />
    <div className="bg-purple-700" title="Jesus o Rei que Há de Vir (Mateus · A Coroa)" />
  </div>
);
