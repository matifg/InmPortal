import LegalLayout, { LegalSection } from '../components/LegalLayout';
import { usePageMeta } from '../hooks/usePageMeta';

const CONTACT_EMAIL = 'contacto@inmobiliaria360.com.ar';

export default function TerminosCondiciones() {
  usePageMeta(
    'Términos y Condiciones',
    'Condiciones de uso de Inmo360 para visitantes, agentes e inmobiliarias que publican propiedades.',
    { url: '/terminos-y-condiciones' }
  );

  return (
    <LegalLayout title="Términos y Condiciones" updatedAt="octubre de 2026">
      <LegalSection title="1. Objeto">
        <p>
          Inmo360 es una plataforma de publicación de avisos inmobiliarios. Permite a agentes e
          inmobiliarias publicar propiedades en venta o alquiler y a los visitantes consultarlas y
          contactar a quien las publica. Al usar el sitio aceptás estos términos.
        </p>
      </LegalSection>

      <LegalSection title="2. Rol de la plataforma">
        <p>
          Inmo360 no es parte de las operaciones inmobiliarias ni actúa como intermediario en ellas.
          Las negociaciones, visitas, reservas, contratos y pagos se acuerdan directamente entre el
          interesado y el agente o la inmobiliaria.
        </p>
      </LegalSection>

      <LegalSection title="3. Publicaciones">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Cada agente o inmobiliaria es responsable de la veracidad y actualización de los datos,
            precios, fotos y descripciones que publica.
          </li>
          <li>
            Las publicaciones deben corresponder a propiedades reales y disponibles, y no pueden
            infringir derechos de terceros ni la normativa vigente.
          </li>
          <li>
            Inmo360 puede pausar o eliminar publicaciones o cuentas que incumplan estos términos.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Cuentas">
        <p>
          Quien se registra es responsable de mantener la confidencialidad de sus credenciales y de
          toda la actividad realizada desde su cuenta.
        </p>
      </LegalSection>

      <LegalSection title="5. Propiedad intelectual">
        <p>
          La marca, el diseño y el software de Inmo360 pertenecen a sus titulares. Al publicar
          contenido, el agente o la inmobiliaria autoriza a Inmo360 a mostrarlo en la plataforma y en
          los canales de difusión asociados.
        </p>
      </LegalSection>

      <LegalSection title="6. Limitación de responsabilidad">
        <p>
          Inmo360 no garantiza la exactitud de la información publicada por terceros ni el resultado
          de las operaciones. Recomendamos verificar la documentación de cada propiedad antes de
          concretar cualquier operación.
        </p>
      </LegalSection>

      <LegalSection title="7. Contacto">
        <p>
          Para consultas sobre estos términos escribí a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 hover:text-indigo-700 font-medium">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
