Cypress.Commands.add(
  "clickCanvas",
  (canvasSelector: string, x: number, y: number) => {
    cy.get(canvasSelector).trigger("mousedown", {
      clientX: x,
      clientY: y,
      bubbles: true,
    });
    cy.get(canvasSelector).trigger("mouseup", {
      clientX: x,
      clientY: y,
      bubbles: true,
    });
  },
);

Cypress.Commands.add("setSliderValue", (selector: string, value: number) => {
  cy.get(selector).then(($el) => {
    const input = $el[0] as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )!.set!;
    nativeSetter.call(input, String(value));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      clickCanvas(
        canvasSelector: string,
        x: number,
        y: number,
      ): Chainable<void>;
      setSliderValue(selector: string, value: number): Chainable<void>;
    }
  }
}
