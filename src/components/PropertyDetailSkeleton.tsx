export default function PropertyDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 pb-16 animate-pulse">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="h-4 w-36 bg-slate-200 rounded mb-6" />
        <div className="aspect-[4/3] md:aspect-[16/10] max-h-[520px] rounded-2xl bg-slate-200" />
        <div className="mt-6 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-slate-200 rounded-full" />
              <div className="h-6 w-24 bg-slate-200 rounded-full" />
            </div>
            <div className="h-9 w-3/4 max-w-lg bg-slate-200 rounded-lg" />
            <div className="h-5 w-1/2 bg-slate-200 rounded" />
          </div>
          <div className="h-10 w-40 bg-slate-200 rounded-lg" />
        </div>
        <div className="mt-8 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-32 bg-white rounded-2xl border border-slate-200/80" />
            <div className="h-48 bg-white rounded-2xl border border-slate-200/80" />
          </div>
          <div className="hidden lg:block h-96 bg-white rounded-2xl border border-slate-200/80" />
        </div>
      </div>
    </div>
  );
}
