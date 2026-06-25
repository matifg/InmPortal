import { Check } from 'lucide-react';

export type ProgressStep = {
  id: string;
  label: string;
  complete: boolean;
};

interface PropertyFormProgressProps {
  steps: ProgressStep[];
}

export default function PropertyFormProgress({ steps }: PropertyFormProgressProps) {
  const completedCount = steps.filter((s) => s.complete).length;
  const pct = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-900">Progreso del anuncio</p>
        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
          {pct}% completado
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {steps.map((step) => (
          <a
            key={step.id}
            href={`#section-${step.id}`}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              step.complete
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {step.complete && <Check className="h-3 w-3 shrink-0" />}
            {step.label}
          </a>
        ))}
      </div>
    </div>
  );
}
