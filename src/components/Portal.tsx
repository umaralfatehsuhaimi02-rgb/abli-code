import React from 'react';
import { createPortal } from 'react-dom';

// Renders popups at the top of the page. Inside the sliding sidebar they get trapped behind the chat.
export function Portal({ children }: { children: React.ReactNode }) {
  return createPortal(children, document.body);
}
