import { cloneElement, useId } from 'react';
import type { ReactElement } from 'react';

interface Props {
  label: string;
  hint?: string;
  children: ReactElement<{ id?: string; 'aria-describedby'?: string }>;
}

/** Etiqueta visible + ayuda enlazada al control (accesible para lectores de pantalla). */
export function Field({ label, hint, children }: Props) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      {cloneElement(children, { id, 'aria-describedby': hint ? hintId : undefined })}
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
    </div>
  );
}
