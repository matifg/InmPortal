import LegalLayout, { LegalSection } from '../components/LegalLayout';
import { usePageMeta } from '../hooks/usePageMeta';

const CONTACT_EMAIL = 'contacto@inmobiliaria360.com.ar';

export default function PoliticaPrivacidad() {
  usePageMeta(
    'Política de Privacidad',
    'Cómo Inmo360 recopila, usa y protege los datos personales de usuarios, agentes e inmobiliarias.',
    { url: '/politica-de-privacidad' }
  );

  return (
    <LegalLayout title="Política de Privacidad" updatedAt="octubre de 2026">
      <LegalSection title="1. Responsable">
        <p>
          Inmo360 es una plataforma que conecta a personas interesadas en comprar o alquilar
          propiedades con agentes e inmobiliarias que las publican. Esta política explica qué datos
          personales tratamos y con qué fines, en el marco de la Ley 25.326 de Protección de los Datos
          Personales de la República Argentina.
        </p>
      </LegalSection>

      <LegalSection title="2. Datos que recopilamos">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-slate-800">Agentes e inmobiliarias registrados:</strong> nombre,
            email, teléfono, nombre comercial, logo, imagen de portada y la información de las
            propiedades que publican.
          </li>
          <li>
            <strong className="text-slate-800">Visitantes:</strong> no pedimos registro para navegar el
            catálogo. Si contactás a un agente por WhatsApp, email o teléfono, esa comunicación se
            realiza directamente con el agente, fuera de la plataforma.
          </li>
          <li>
            <strong className="text-slate-800">Datos técnicos:</strong> información necesaria para
            mantener la sesión iniciada y el funcionamiento del sitio, guardada en el almacenamiento
            local de tu navegador.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Para qué usamos los datos">
        <ul className="list-disc pl-5 space-y-2">
          <li>Publicar y mostrar las propiedades y los datos de contacto de agentes e inmobiliarias.</li>
          <li>Gestionar cuentas, autenticación y recuperación de contraseña.</li>
          <li>Enviar comunicaciones operativas relacionadas con la cuenta.</li>
          <li>Mejorar la seguridad y el funcionamiento de la plataforma.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Datos públicos">
        <p>
          Los datos de contacto y de marca que un agente o inmobiliaria carga en su perfil, así como
          las propiedades que publica, son visibles para cualquier visitante y pueden ser indexados
          por buscadores.
        </p>
      </LegalSection>

      <LegalSection title="5. Cesión de datos">
        <p>
          No vendemos datos personales. Solo los compartimos con proveedores que nos prestan servicios
          de infraestructura (por ejemplo, alojamiento y envío de emails) y cuando lo exija una
          autoridad competente.
        </p>
      </LegalSection>

      <LegalSection title="6. Tus derechos">
        <p>
          Podés solicitar el acceso, la rectificación, la actualización o la supresión de tus datos
          escribiendo a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 hover:text-indigo-700 font-medium">
            {CONTACT_EMAIL}
          </a>
          . La Agencia de Acceso a la Información Pública, en su carácter de órgano de control de la
          Ley 25.326, tiene la atribución de atender denuncias y reclamos de quienes resulten
          afectados en sus derechos.
        </p>
      </LegalSection>

      <LegalSection title="7. Cambios en esta política">
        <p>
          Podemos actualizar esta política. La fecha de la última modificación figura al comienzo de
          esta página.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
