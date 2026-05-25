import React, { useEffect, useMemo, useState } from 'react';
import { PieChart as PieChartIcon, Users, BadgeCheck } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Toaster, toast } from 'react-hot-toast';

type Agente = {
  id?: string;
  usuarioId: string;
  nombre: string;
  email: string;
  rol: string;
  membresiaActiva: boolean;
  cantidadPropiedades: number;
};

type Stats = {
  totalAgentes: number;
  membresiasActivas: number;
};

const COLORS = ['#4F8AF4', '#CBD5E1'];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [membresiaFilter, setMembresiaFilter] = useState<'todas' | 'activas' | 'inactivas'>('todas');
  const [sortBy, setSortBy] = useState<'nombre' | 'email' | 'cantidadPropiedades' | 'membresiaActiva'>('nombre');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/agentes`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!res.ok) throw new Error('Error al cargar agentes');
        const data = await res.json();
        setAgentes(data.agentes || []);
        // --- Cálculo de métricas desde data.agentes ---
        const totalAgentes = data.total || (data.agentes ? data.agentes.length : 0);
        const membresiasActivas = (data.agentes || []).filter(
          (a: Agente) => a.membresiaActiva
        ).length;
        setStats({
          totalAgentes,
          membresiasActivas,
        });
      } catch (err: any) {
        setError(err.message || 'Error de red');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, membresiaFilter, sortBy, sortDirection, pageSize]);

  const handleToggleMembresia = async (agente: Agente) => {
    setUpdatingId(agente.usuarioId);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/usuarios/${agente.usuarioId}/membresia`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ membresiaActiva: !agente.membresiaActiva }),
      });
      if (!res.ok) throw new Error();
      setAgentes(prev =>
        prev.map(a =>
          a.usuarioId === agente.usuarioId
            ? { ...a, membresiaActiva: !a.membresiaActiva }
            : a
        )
      );
      setStats(s =>
        s
          ? {
              ...s,
              membresiasActivas: s.membresiasActivas + (agente.membresiaActiva ? -1 : 1),
            }
          : s
      );
      toast.success(
        !agente.membresiaActiva
          ? 'Membresía activada correctamente'
          : 'Membresía desactivada correctamente'
      );
    } catch {
      setError('Error actualizando membresía');
      toast.error('Error actualizando membresía');
    } finally {
      setUpdatingId(null);
    }
  };

  // Métricas para gráfico
  const total = Number(stats?.totalAgentes || 0);
  const activas = Number(stats?.membresiasActivas || 0);
  const inactivas = total - activas;
  const pieData = [
    { name: 'Activas', value: activas },
    { name: 'Inactivas', value: inactivas },
  ];
  const percentActivas = total > 0 ? Math.round((activas / total) * 100) : 0;

  const filteredAndSortedAgentes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = agentes.filter(agente => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        agente.nombre.toLowerCase().includes(normalizedSearch) ||
        agente.email.toLowerCase().includes(normalizedSearch);

      const matchesMembresia =
        membresiaFilter === 'todas' ||
        (membresiaFilter === 'activas' && agente.membresiaActiva) ||
        (membresiaFilter === 'inactivas' && !agente.membresiaActiva);

      return matchesSearch && matchesMembresia;
    });

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'cantidadPropiedades') {
        comparison = a.cantidadPropiedades - b.cantidadPropiedades;
      } else if (sortBy === 'membresiaActiva') {
        comparison = Number(a.membresiaActiva) - Number(b.membresiaActiva);
      } else {
        comparison = a[sortBy].localeCompare(b[sortBy], 'es', { sensitivity: 'base' });
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [agentes, membresiaFilter, searchTerm, sortBy, sortDirection]);

  const totalFiltered = filteredAndSortedAgentes.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedAgentes = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredAndSortedAgentes.slice(start, start + pageSize);
  }, [filteredAndSortedAgentes, pageSize, safeCurrentPage]);

  const hasActiveFilters = searchTerm.trim().length > 0 || membresiaFilter !== 'todas';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50/40">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Panel de Administración
          </h1>
          <p className="mt-1 text-sm md:text-base text-slate-500">
            Gestioná agentes, membresías y actividad general desde un solo lugar.
          </p>
        </div>

        {/* Cards superiores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* Total agentes */}
          <div
            className="rounded-2xl border border-white/70 bg-white/90 shadow-sm p-6 flex items-center gap-4"
          >
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                {total}
              </div>
              <div className="text-sm font-medium text-slate-500 mt-1">Total agentes</div>
            </div>
          </div>
          {/* Membresías activas */}
          <div
            className="rounded-2xl border border-white/70 bg-white/90 shadow-sm p-6 flex items-center gap-4"
          >
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                <BadgeCheck className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                {activas}
              </div>
              <div className="text-sm font-medium text-slate-500 mt-1">Membresías activas</div>
            </div>
          </div>
        </div>

        {/* Card gráfico membresías */}
        <div className="mb-8">
          <div className="rounded-2xl border border-white/70 bg-white/90 shadow-sm flex flex-col lg:flex-row items-stretch overflow-hidden">
            {/* Header visual */}
            <div className="flex flex-col lg:w-[280px] p-6 border-b lg:border-b-0 lg:border-r border-slate-100 justify-center bg-slate-50/70">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                  <PieChartIcon className="w-5 h-5" />
                </div>
                <span className="text-base font-semibold text-slate-800">Membresías</span>
              </div>
              <div className="text-sm text-slate-500">Estado general de membresías</div>
              <div className="mt-4 space-y-2">
                <div>
                  <p className="text-3xl font-bold text-slate-900">{percentActivas}%</p>
                  <p className="text-sm text-slate-500">de agentes con membresía activa</p>
                </div>
                <div className="text-sm text-slate-500">
                  {activas} activas y {inactivas} inactivas
                </div>
              </div>
            </div>
            {/* Gráfico y métricas */}
            <div className="flex flex-col md:flex-row flex-1 items-center justify-between p-6">
              <div className="w-full md:w-72 h-52 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      align="center"
                      wrapperStyle={{ fontSize: 13, marginTop: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Métricas rápidas */}
              <div className="grid grid-cols-2 gap-3 w-full md:w-auto mt-6 md:mt-0 md:ml-8">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-center md:text-left">
                  <div className="text-xl font-semibold text-slate-900">{activas}</div>
                  <div className="text-sm text-slate-500">Activas</div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-center md:text-left">
                  <div className="text-xl font-semibold text-slate-900">{inactivas}</div>
                  <div className="text-sm text-slate-500">Inactivas</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de agentes */}
        <div className="rounded-2xl border border-white/70 bg-white/90 shadow-sm p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900 tracking-tight">Agentes</h2>
            {!loading && agentes.length > 0 && (
              <div className="text-sm text-slate-500">
                Mostrando {totalFiltered} de {agentes.length} agentes
              </div>
            )}
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-slate-100 rounded w-full animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">{error}</div>
          ) : agentes.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-slate-400">
              <Users className="w-12 h-12 mb-2 opacity-30" />
              <div className="font-semibold text-lg">No hay agentes registrados</div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 md:p-5">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Buscar agente</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nombre o email"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-600">Estado</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'todas', label: 'Todas' },
                        { value: 'activas', label: 'Activas' },
                        { value: 'inactivas', label: 'Inactivas' },
                      ].map((option) => {
                        const isActive = membresiaFilter === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setMembresiaFilter(option.value as 'todas' | 'activas' | 'inactivas')}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                              isActive
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1.5">Ordenar por</label>
                      <select
                        value={`${sortBy}-${sortDirection}`}
                        onChange={(e) => {
                          const [nextSortBy, nextDirection] = e.target.value.split('-');
                          setSortBy(nextSortBy as 'nombre' | 'email' | 'cantidadPropiedades' | 'membresiaActiva');
                          setSortDirection(nextDirection as 'asc' | 'desc');
                        }}
                        className="w-full sm:w-56 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                      >
                        <option value="nombre-asc">Nombre A-Z</option>
                        <option value="nombre-desc">Nombre Z-A</option>
                        <option value="email-asc">Email A-Z</option>
                        <option value="email-desc">Email Z-A</option>
                        <option value="cantidadPropiedades-desc">Más propiedades</option>
                        <option value="cantidadPropiedades-asc">Menos propiedades</option>
                        <option value="membresiaActiva-desc">Activas primero</option>
                        <option value="membresiaActiva-asc">Inactivas primero</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1.5">Por página</label>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="w-full sm:w-24 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                      >
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>

                    {hasActiveFilters && (
                      <div className="sm:self-end">
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            setMembresiaFilter('todas');
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                        >
                          Limpiar filtros
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {totalFiltered === 0 ? (
                <div className="flex flex-col items-center py-12 text-slate-400">
                  <Users className="w-12 h-12 mb-2 opacity-30" />
                  <div className="font-semibold text-lg">No hay resultados para esos filtros</div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Nombre</th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Email</th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Rol</th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Membresía</th>
                          <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Propiedades</th>
                          <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {paginatedAgentes.map(agente => (
                          <tr key={agente.usuarioId} className="border-b border-slate-100 last:border-none hover:bg-slate-50/80 transition-colors duration-150">
                            <td className="px-4 py-4">
                              <div className="font-medium text-slate-900">{agente.nombre}</div>
                            </td>
                            <td className="px-4 py-4 text-slate-500">{agente.email}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-1 text-xs font-medium">
                                {agente.rol}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                agente.membresiaActiva
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {agente.membresiaActiva ? 'Activa' : 'Inactiva'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-slate-700">{agente.cantidadPropiedades}</td>
                            <td className="px-4 py-3">
                              <div className="flex min-w-[88px] items-center justify-end gap-3">
                                {updatingId === agente.usuarioId && (
                                  <svg className="animate-spin h-4 w-4 text-indigo-500" viewBox="0 0 24 24" aria-hidden="true">
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      fill="none"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    />
                                  </svg>
                                )}

                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={agente.membresiaActiva}
                                  aria-label={`${agente.membresiaActiva ? 'Desactivar' : 'Activar'} membresía de ${agente.nombre}`}
                                  onClick={() => handleToggleMembresia(agente)}
                                  disabled={updatingId === agente.usuarioId}
                                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 ${
                                    agente.membresiaActiva
                                      ? 'bg-green-500 hover:bg-green-600'
                                      : 'bg-slate-300 hover:bg-slate-400'
                                  } ${updatingId === agente.usuarioId ? 'cursor-not-allowed opacity-60' : ''}`}
                                >
                                  <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                                      agente.membresiaActiva ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 pt-4">
                    <div className="text-sm text-slate-500">
                      Mostrando {(safeCurrentPage - 1) * pageSize + 1} a {Math.min(safeCurrentPage * pageSize, totalFiltered)} de {totalFiltered} agentes
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="text-sm text-slate-500">
                        Página {safeCurrentPage} de {totalPages}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={safeCurrentPage === 1}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={safeCurrentPage === totalPages}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}