import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface PropertyFormSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
}

export default function PropertyFormSection({
  id,
  title,
  subtitle,
  icon: Icon,
  children,
}: PropertyFormSectionProps) {
  return (
    <section
      id={`section-${id}`}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 scroll-mt-24"
    >
      <div className="mb-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-indigo-600 shrink-0" />}
          {title}
        </h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
