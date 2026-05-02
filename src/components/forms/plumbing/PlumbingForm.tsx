'use client';

import { PlumbingQuotation, PlumbingItem } from '@/lib/types/plumbing';
import { calculatePlumbingTotal } from '@/lib/calculators/plumbingCalc';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PlumbingFormProps {
  data: Partial<PlumbingQuotation>;
  onChange: (data: Partial<PlumbingQuotation>) => void;
}

export function PlumbingForm({ data, onChange }: PlumbingFormProps) {
  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({
      ...data,
      client: { ...data.client, [name]: value } as any,
    });
  };

  const handleMaterialChange = (index: number, field: keyof PlumbingItem, value: any) => {
    const newMaterials = [...(data.materials || [])];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    const total = calculatePlumbingTotal({ ...data, materials: newMaterials });
    onChange({ ...data, materials: newMaterials, total });
  };

  const addMaterial = () => {
    const newMaterials = [...(data.materials || []), { description: '', quantity: 1, unitPrice: 0 }];
    onChange({ ...data, materials: newMaterials });
  };

  const removeMaterial = (index: number) => {
    const newMaterials = (data.materials || []).filter((_, i) => i !== index);
    const total = calculatePlumbingTotal({ ...data, materials: newMaterials });
    onChange({ ...data, materials: newMaterials, total });
  };

  const handleNumericChange = (field: 'laborCost' | 'urgencyFee' | 'materialCostApprox', value: number) => {
    const newData = { ...data, [field]: value };
    const total = calculatePlumbingTotal(newData);
    onChange({ ...newData, total });
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-700">Información del Cliente</h3>
          <label className="flex items-center gap-2 cursor-pointer group">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter group-hover:text-indigo-500 transition-colors">Ver en PDF</span>
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={data.showClientInfo || false}
              onChange={(e) => onChange({...data, showClientInfo: e.target.checked})}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            name="name"
            placeholder="Nombre del Cliente"
            value={data.client?.name || ''}
            onChange={handleClientChange}
          />
          <input
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            name="email"
            placeholder="Correo Electrónico"
            value={data.client?.email || ''}
            onChange={handleClientChange}
          />
          <input
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            name="phone"
            placeholder="Teléfono"
            value={data.client?.phone || ''}
            onChange={handleClientChange}
          />
          <textarea
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all col-span-2"
            name="address"
            placeholder="Dirección del Servicio"
            value={data.client?.address || ''}
            onChange={handleClientChange}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-slate-700">Descripción del Trabajo</h3>
          <textarea
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[120px]"
            placeholder="Describe el trabajo (ej. Reparación de fuga en baño principal y cambio de mezcladora)..."
            value={data.descripcion || ''}
            onChange={(e) => onChange({ ...data, descripcion: e.target.value })}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-slate-700">Alcances / Tareas</h3>
            <button
              onClick={() => {
                const newAlcances = [...(data.alcances || []), ''];
                onChange({ ...data, alcances: newAlcances });
              }}
              className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200 transition-colors flex items-center gap-1 font-bold"
            >
              <Plus size={14} /> Agregar Alcance
            </button>
          </div>
          <div className="space-y-2">
            {(data.alcances || []).map((alcance, index) => (
              <div key={index} className="flex gap-2">
                <input
                  className="flex-1 p-2 border rounded-lg text-sm"
                  placeholder="Ej. Cambio de empaques"
                  value={alcance}
                  onChange={(e) => {
                    const newAlcances = [...(data.alcances || [])];
                    newAlcances[index] = e.target.value;
                    onChange({ ...data, alcances: newAlcances });
                  }}
                />
                <button
                  onClick={() => {
                    const newAlcances = (data.alcances || []).filter((_, i) => i !== index);
                    onChange({ ...data, alcances: newAlcances });
                  }}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-700">Materiales</h3>
          <button
            onClick={addMaterial}
            className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors flex items-center gap-1 font-medium"
          >
            <Plus size={16} /> Agregar Material
          </button>
        </div>
        <div className="space-y-3">
          {(data.materials || []).map((item, index) => (
            <div key={index} className="flex gap-2 items-center animate-in fade-in slide-in-from-top-2">
              <input
                className="flex-1 p-2 border rounded-lg text-sm"
                placeholder="Descripción del Material"
                value={item.description}
                onChange={(e) => handleMaterialChange(index, 'description', e.target.value)}
              />
              <input
                className="w-20 p-2 border rounded-lg text-sm text-center"
                type="number"
                placeholder="Cant."
                value={item.quantity}
                onChange={(e) => handleMaterialChange(index, 'quantity', Number(e.target.value))}
              />
              <input
                className="w-28 p-2 border rounded-lg text-sm text-right"
                type="number"
                placeholder="Precio"
                value={item.unitPrice}
                onChange={(e) => handleMaterialChange(index, 'unitPrice', Number(e.target.value))}
              />
              <button
                onClick={() => removeMaterial(index)}
                className="p-2 text-red-400 hover:text-red-600 transition-colors"
                title="Eliminar"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 border-t pt-6">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-slate-500">Costo de Mano de Obra</label>
            <label className="flex items-center gap-1 cursor-pointer group">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter group-hover:text-indigo-500 transition-colors">Ver en PDF</span>
              <input
                type="checkbox"
                className="w-3 h-3 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={data.showLaborCost !== false}
                onChange={(e) => onChange({...data, showLaborCost: e.target.checked})}
              />
            </label>
          </div>
          <input
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            type="number"
            value={data.laborCost || 0}
            onChange={(e) => handleNumericChange('laborCost', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1">Tarifa de Urgencia</label>
          <input
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            type="number"
            value={data.urgencyFee || 0}
            onChange={(e) => handleNumericChange('urgencyFee', Number(e.target.value))}
          />
        </div>
        <div className="col-span-2">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-slate-500">Costo de Material Aproximado</label>
            <label className="flex items-center gap-1 cursor-pointer group">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter group-hover:text-indigo-500 transition-colors">Ver en PDF</span>
              <input
                type="checkbox"
                className="w-3 h-3 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={data.showMaterialCostApprox !== false}
                onChange={(e) => onChange({...data, showMaterialCostApprox: e.target.checked})}
              />
            </label>
          </div>
          <input
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            type="number"
            placeholder="0"
            value={data.materialCostApprox || 0}
            onChange={(e) => handleNumericChange('materialCostApprox', Number(e.target.value))}
          />
        </div>
      </section>

      <section className="border-t pt-4">
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
          <div>
            <span className="text-sm font-semibold text-slate-600">Mostrar precios en PDF</span>
            <p className="text-xs text-slate-400 mt-0.5">Muestra precio unitario y subtotal por material</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={data.showPrices !== false}
              onChange={(e) => onChange({...data, showPrices: e.target.checked})}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </section>
      
      <section className="border-t pt-6 space-y-4">
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">
          <span className="text-sm font-semibold text-slate-600">¿Ingresar total manualmente?</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={data.isManualTotal || false}
              onChange={(e) => {
                const isManual = e.target.checked;
                const total = calculatePlumbingTotal({...data, isManualTotal: isManual, manualTotalValue: data.manualTotalValue || data.total});
                onChange({...data, isManualTotal: isManual, total});
              }}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {data.isManualTotal && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="block text-sm font-medium text-slate-500 mb-1">Monto Total Manual</label>
            <input
              className="w-full p-4 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xl font-bold text-indigo-700"
              type="number"
              value={data.manualTotalValue || 0}
              onChange={(e) => {
                const val = Number(e.target.value);
                const total = calculatePlumbingTotal({...data, isManualTotal: true, manualTotalValue: val});
                onChange({...data, manualTotalValue: val, total});
              }}
            />
          </div>
        )}
      </section>
      
      <div className="bg-slate-900 rounded-xl p-6 text-white flex justify-between items-center shadow-lg transform hover:scale-[1.02] transition-transform">
        <span className="text-lg opacity-80">Monto Total</span>
        <span className="text-3xl font-bold tracking-tight">
          {formatCurrency(data.total || 0)}
        </span>
      </div>
    </div>
  );
}
