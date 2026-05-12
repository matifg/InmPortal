import React, { useEffect, useState } from 'react';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-50 to-white">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        {/* Título más compacto */}
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-6 mb-4 tracking-tight">
          Panel de Administración
        </h1>

        {/* Cards superiores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Total agentes */}
          <div
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-7 flex items-center gap-6 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
          >
            <div className="flex-shrink-0">
              <Users className="w-14 h-14 text-indigo-500 drop-shadow" />
            </div>
            <div>
              <div className="text-5xl font-extrabold text-indigo-700 leading-tight">
                {total}
              </div>
              <div className="text-base font-medium text-gray-500 mt-1">Total agentes</div>
            </div>
          </div>
          {/* Membresías activas */}
          <div
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-7 flex items-center gap-6 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
          >
            <div className="flex-shrink-0">
              <BadgeCheck className="w-14 h-14 text-green-500 drop-shadow" />
            </div>
            <div>
              <div className="text-5xl font-extrabold text-green-700 leading-tight">
                {activas}
              </div>
              <div className="text-base font-medium text-gray-500 mt-1">Membresías activas</div>
            </div>
          </div>
        </div>

        {/* Card gráfico membresías */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-0 md:p-0 flex flex-col md:flex-row items-stretch gap-0 md:gap-0">
            {/* Header visual */}
            <div className="flex flex-col md:w-1/3 p-7 border-b md:border-b-0 md:border-r border-slate-100 justify-center items-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
              <div className="flex items-center gap-3 mb-2">
                <PieChartIcon className="w-8 h-8 text-indigo-400" />
                <span className="text-lg font-bold text-gray-800">Membresías</span>
              </div>
              <div className="text-sm text-gray-500">Estado general de membresías</div>
            </div>
            {/* Gráfico y métricas */}
            <div className="flex flex-col md:flex-row flex-1 items-center justify-between p-7">
              <div className="w-full md:w-64 h-48 flex items-center justify-center">
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
                      wrapperStyle={{ fontSize: 14, marginTop: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Métricas rápidas */}
              <div className="flex flex-col gap-2 items-center md:items-start mt-6 md:mt-0 md:ml-10">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-indigo-700">{percentActivas}%</span>
                  <span className="text-sm text-gray-500">activas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-slate-500">{inactivas}</span>
                  <span className="text-sm text-gray-400">inactivas</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de agentes */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 tracking-tight">Agentes</h2>
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
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-indigo-50/60">
                    <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold">Rol</th>
                    <th className="px-4 py-3 text-left font-semibold">Membresía</th>
                    <th className="px-4 py-3 text-left font-semibold">Propiedades</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {agentes.map(agente => (
                    <tr key={agente.usuarioId} className="border-b last:border-none hover:bg-indigo-50/40 transition-all duration-200 h-16">
                      <td className="px-4 py-3">{agente.nombre}</td>
                      <td className="px-4 py-3">{agente.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
                          {agente.rol}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                          agente.membresiaActiva
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {agente.membresiaActiva ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">{agente.cantidadPropiedades}</td>
                      <td className="px-4 py-3">
                        <button
                          className={`px-4 py-2 rounded-lg font-semibold text-white transition flex items-center gap-2 shadow-sm ${
                            agente.membresiaActiva
                              ? 'bg-red-500 hover:bg-red-600'
                              : 'bg-green-600 hover:bg-green-700'
                          } ${updatingId === agente.usuarioId ? 'opacity-70 cursor-not-allowed' : ''}`}
                          onClick={() => handleToggleMembresia(agente)}
                          disabled={updatingId === agente.usuarioId}
                        >
                          {updatingId === agente.usuarioId && (
                            <svg className="animate-spin h-4 w-4 mr-1 text-white" viewBox="0 0 24 24">
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
                          {agente.membresiaActiva ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}