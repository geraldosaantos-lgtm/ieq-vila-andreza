import React, { useState, useRef } from 'react';
import {
  X,
  Check,
  Upload,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Settings,
} from 'lucide-react';
import type { ChurchSettings } from '../types';
import { IEQLogo, IEQFourColorBar } from './IEQLogo';

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  churchSettings: ChurchSettings;
  onSaveSettings: (settings: ChurchSettings) => void;
  onResetAllData: () => Promise<void>;
  onLoadDemoData: () => Promise<void>;
}

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({
  isOpen,
  onClose,
  churchSettings,
  onSaveSettings,
  onResetAllData,
  onLoadDemoData,
}) => {
  const [formData, setFormData] = useState<ChurchSettings>(churchSettings);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, logoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setStatusMessage('Dados da IEQ Vila Andreza salvos com sucesso!');
    setTimeout(() => {
      setStatusMessage(null);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        <IEQFourColorBar className="h-1.5 w-full" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-red-700" />
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Configurações da Igreja & Identidade Visual
              </h2>
              <p className="text-xs text-slate-500">
                Personalize nome, logotipo, pastor titular e gerenciamento de dados da igreja.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          <form id="church-settings-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Logo & Identidade Quadrangular */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <IEQLogo logoUrl={formData.logoUrl} size="lg" />
              <div className="flex-1 space-y-2">
                <label className="block font-bold text-slate-800">
                  Logotipo da Igreja (Padrão: Emblema Oficial Quadrangular 4 Cores)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Enviar Imagem do Computador/Celular</span>
                  </button>
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                      className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                    >
                      Usar Emblema Quadrangular Padrão
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome da Igreja *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Subtítulo / Denominação
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome do Pastor Titular *
                </label>
                <input
                  type="text"
                  required
                  value={formData.pastorName}
                  onChange={(e) => setFormData({ ...formData, pastorName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  WhatsApp Oficial da Igreja / Pastor
                </label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Endereço do Templo
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Lema / Versículo Base da Igreja
                </label>
                <input
                  type="text"
                  value={formData.motto}
                  onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </form>

          {/* Zona de Limpeza de Dados de Teste / Restauração */}
          <div className="p-4 bg-red-50/60 border border-red-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-800 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Gerenciamento de Dados de Exemplo / Teste</span>
              </div>
            </div>
            <p className="text-slate-600 text-[11px]">
              Você pode limpar todos os cadastros de exemplo (membros, visitantes, agenda e escalas de teste) para iniciar do zero absoluto, ou recarregar os exemplos quando quiser.
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar Dados de Teste / Zerar Cadastros</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await onResetAllData();
                      setConfirmReset(false);
                      setStatusMessage('Todos os dados de teste foram limpos!');
                    }}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg cursor-pointer"
                  >
                    Confirmar Limpeza Total Agora
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={async () => {
                  await onLoadDemoData();
                  setStatusMessage('Dados de exemplo restaurados com sucesso!');
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Exemplos</span>
              </button>
            </div>
          </div>

          {statusMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold rounded-xl text-center">
              {statusMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg cursor-pointer"
          >
            Fechar
          </button>
          <button
            type="submit"
            form="church-settings-form"
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Dados da Igreja</span>
          </button>
        </div>
      </div>
    </div>
  );
};
