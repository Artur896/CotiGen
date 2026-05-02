'use client';

import { WebDevQuotation, ProjectPhase } from '@/lib/types/webdev';
import { calculateWebDevTotal } from '@/lib/calculators/webdevCalc';
import { Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';

interface WebDevFormProps {
  data: Partial<WebDevQuotation>;
  onChange: (data: Partial<WebDevQuotation>) => void;
}

export function WebDevForm({ data, onChange }: WebDevFormProps) {
  const [newTech, setNewTech] = useState('');

  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({
      ...data,
      client: { ...data.client, [name]: value } as any,
    });
  };

  const handlePhaseChange = (index: number, field: keyof ProjectPhase, value: any) => {
    const newPhases = [...(data.phases || [])];
    newPhases[index] = { ...newPhases[index], [field]: value };
    const total = calculateWebDevTotal({ ...data, phases: newPhases });
    onChange({ ...data, phases: newPhases, total });
  };

  const addPhase = () => {
    const newPhases = [...(data.phases || []), { name: '', description: '', cost: 0 }];
    onChange({ ...data, phases: newPhases });
  };

  const removePhase = (index: number) => {
    const newPhases = (data.phases || []).filter((_, i) => i !== index);
    const total = calculateWebDevTotal({ ...data, phases: newPhases });
    onChange({ ...data, phases: newPhases, total });
  };

  const handleNumericChange = (field: 'estimatedHours' | 'hourlyRate', value: number) => {
    const newData = { ...data, [field]: value };
    const total = calculateWebDevTotal(newData);
    onChange({ ...newData, total });
  };

  const addTech = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTech.trim()) {
      const technologies = [...(data.technologies || []), newTech.trim()];
      onChange({ ...data, technologies });
      setNewTech('');
    }
  };

  const removeTech = (tech: string) => {
    const technologies = (data.technologies || []).filter(t => t !== tech);
    onChange({ ...data, technologies });
  };

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold mb-4 text-slate-700">Información del Cliente</h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            name="name"
            placeholder="Nombre / Empresa del Cliente"
            value={data.client?.name || ''}
            onChange={handleClientChange}
          />
          <input
            className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            name="email"
            placeholder="Correo de Contacto"
            value={data.client?.email || ''}
            onChange={handleClientChange}
          />
          <textarea
            className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all col-span-2"
            name="projectDescription"
            placeholder="Descripción del Proyecto"
            value={data.projectDescription || ''}
            onChange={(e) => onChange({...data, projectDescription: e.target.value})}
          />
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-700">Fases del Proyecto</h3>
          <button
            onClick={addPhase}
            className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors flex items-center gap-1 font-medium"
          >
            <Plus size={16} /> Agregar Fase
          </button>
        </div>
        <div className="space-y-4">
          {(data.phases || []).map((phase, index) => (
            <div key={index} className="p-4 bg-slate-50 rounded-xl relative animate-in fade-in slide-in-from-right-4">
              <button
                onClick={() => removePhase(index)}
                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 transition-colors"
                title="Eliminar Fase"
              >
                <Trash2 size={16} />
              </button>
              <div className="grid grid-cols-3 gap-3">
                <input
                  className="col-span-2 p-2 border rounded-lg text-sm bg-white"
                  placeholder="Nombre de la Fase (ej. Desarrollo Backend)"
                  value={phase.name}
                  onChange={(e) => handlePhaseChange(index, 'name', e.target.value)}
                />
                <input
                  className="p-2 border rounded-lg text-sm bg-white text-right"
                  type="number"
                  placeholder="Costo"
                  value={phase.cost}
                  onChange={(e) => handlePhaseChange(index, 'cost', Number(e.target.value))}
                />
                <textarea
                  className="col-span-3 p-2 border rounded-lg text-sm bg-white"
                  placeholder="Detalles de la Fase"
                  value={phase.description}
                  onChange={(e) => handlePhaseChange(index, 'description', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 border-t pt-6">
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1">Horas Estimadas</label>
          <input
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            type="number"
            value={data.estimatedHours || 0}
            onChange={(e) => handleNumericChange('estimatedHours', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1">Costo por Hora ($)</label>
          <input
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            type="number"
            value={data.hourlyRate || 0}
            onChange={(e) => handleNumericChange('hourlyRate', Number(e.target.value))}
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3 text-slate-500 uppercase tracking-wider">Tecnologías</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {(data.technologies || []).map((tech, i) => (
            <span key={i} className="flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
              {tech}
              <button onClick={() => removeTech(tech)} className="hover:text-red-500">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <input
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          placeholder="Escribe una tecnología y presiona Enter..."
          value={newTech}
          onChange={(e) => setNewTech(e.target.value)}
          onKeyDown={addTech}
        />
      </section>
      
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-8 text-white flex justify-between items-center shadow-xl transform hover:-translate-y-1 transition-all">
        <div className="flex flex-col">
          <span className="text-sm uppercase font-bold opacity-70 tracking-widest">Estimación de Cotización</span>
          <span className="text-xs italic opacity-60">Basado en fases y desglose por horas</span>
        </div>
        <span className="text-4xl font-extrabold tracking-tighter">
          {formatCurrency(data.total || 0)}
        </span>
      </div>
    </div>
  );
}
