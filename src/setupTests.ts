// Tell React 18's act() that this is a test environment.
// Without this flag every act() call emits:
// "Warning: The current testing environment is not configured to support act(...)"
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT =
  true;
