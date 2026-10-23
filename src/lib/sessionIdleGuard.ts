/**
 * Mientras un guardado/upload largo está en curso, el idle de 15 min
 * no debe cerrar la sesión (el JWT real sí puede expirar y devolver 401).
 */
let pauseCount = 0;

export function pauseSessionIdle() {
  pauseCount += 1;
}

export function resumeSessionIdle() {
  pauseCount = Math.max(0, pauseCount - 1);
}

export function isSessionIdlePaused() {
  return pauseCount > 0;
}
