import { useEffect, useRef, useState } from "react";

// Mensajes que solo se muestran si la espera se alarga (backend "dormido"
// en Render tras 15 minutos sin uso, ~30s en despertar). En un backend
// "despierto" la respuesta llega antes de los 2.5s y esto nunca se ve.
const MENSAJES = [
  "Conectando con el servidor...",
  "Nadie ha usado esto en un rato, estamos despertando el servidor...",
  "Literalmente esperando a que el servidor abra los ojos.",
  "Ya casi. El café del servidor se está terminando de preparar.",
  "Unos segundos más, gracias por tu paciencia.",
];

const RETRASO_INICIAL_MS = 2500;
const INTERVALO_MS = 3200;

/**
 * @param {boolean} activo - true mientras la petición está en curso.
 * @returns {string|null} el mensaje a mostrar, o null si aún no aplica.
 */
export function useWaitingMessages(activo) {
  const [indice, setIndice] = useState(-1);
  const timeouts = useRef([]);

  useEffect(() => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];

    if (!activo) {
      setIndice(-1);
      return;
    }

    const primero = setTimeout(() => {
      setIndice(0);

      const id = setInterval(() => {
        setIndice((actual) => (actual + 1) % MENSAJES.length);
      }, INTERVALO_MS);

      timeouts.current.push(id);
    }, RETRASO_INICIAL_MS);

    timeouts.current.push(primero);

    return () => {
      timeouts.current.forEach((t) => {
        clearTimeout(t);
        clearInterval(t);
      });
    };
  }, [activo]);

  return indice === -1 ? null : MENSAJES[indice];
}
