import { Hourglass } from "lucide-react";

/**
 * Pantalla de "Proximamente" reutilizable.
 *
 * Se usa en los modulos que ya tienen diseno (mockup de Readdy.ai) pero que
 * todavia no tienen backend real conectado: Panel de Control, Facturas,
 * Proyectos, Informes, y las sub-pestanas de Configuracion distintas a Perfil.
 * Autenticacion es, por ahora, el unico modulo con datos reales de punta a punta.
 */
export default function ComingSoon({ icon, title, description }) {
  const Icon = icon || Hourglass;

  return (
    <div className="coming-soon">
      <div className="icon-wrap">
        <Icon size={28} />
      </div>
      <span className="tag">En construcción</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
