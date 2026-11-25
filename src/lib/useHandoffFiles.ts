import { useEffect, useRef } from 'react';
import { consumeHandoffFiles } from './fileHandoff';

/**
 * Automatically consumes any files dropped on the homepage Universal Drop Bar
 * targeting the current pathname and passes them into the workspace handler.
 */
export function useHandoffFiles(onFiles: (files: File[]) => void): void {
  const callbackRef = useRef(onFiles);
  callbackRef.current = onFiles;

  useEffect(() => {
    let active = true;
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    consumeHandoffFiles(path).then((files) => {
      if (active && files.length > 0) {
        callbackRef.current(files);
      }
    });
    return () => {
      active = false;
    };
  }, []);
}
