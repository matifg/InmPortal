type AuthBrandingProps = {
  detached?: boolean;
};

export default function AuthBranding({ detached = false }: AuthBrandingProps) {
  return (
    <a
      href="https://www.baraderodevlabs.ar/"
      target="_blank"
      rel="noopener noreferrer"
      className={`group block text-center transition-all duration-200 ${
        detached
          ? 'mt-4 px-2'
          : 'mt-4 pt-3 border-t border-slate-200/60'
      }`}
    >
      <p
        className={`text-[11px] leading-tight transition-colors duration-200 ${
          detached ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-500 group-hover:text-slate-600'
        }`}
      >
        Powered by
      </p>
      <p className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors duration-200 leading-tight">
        Baradero Devs
      </p>
    </a>
  );
}
