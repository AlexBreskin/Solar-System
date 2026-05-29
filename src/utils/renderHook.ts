import React, { act } from "react";
import ReactDOM from "react-dom/client";

export function renderHook<T>(hook: () => T): { result: { current: T } } {
  const result = { current: null as unknown as T };
  const container = document.createElement("div");
  function TestComponent() {
    result.current = hook();
    return null;
  }
  act(() => {
    ReactDOM.createRoot(container).render(React.createElement(TestComponent));
  });
  return { result };
}
