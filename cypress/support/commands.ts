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

// Maps desktop tab labels to their shorter mobile equivalents.
const MOBILE_TAB_LABELS: Record<string, string> = {
  Galaxy: "Galaxy",
  "System View": "System",
  "Body View": "Body",
};

// Switches view on any viewport: uses .tab-btn on desktop/tablet (where .tab-bar
// is visible) and .mobile-tab-btn on mobile.
Cypress.Commands.add("switchTab", (desktopLabel: string) => {
  const mobileLabel = MOBILE_TAB_LABELS[desktopLabel] ?? desktopLabel;
  // Wait for React to render navigation before checking which variant is present.
  // cy.get("body").then() snapshots the DOM immediately and is racy on SPA load.
  cy.get(".tab-btn:visible, .mobile-tab-btn:visible").should(
    "have.length.gte",
    1,
  );
  cy.get("body").then(($body) => {
    if (
      $body.find(".mobile-panel-toggle--left").filter(":visible").length > 0
    ) {
      cy.contains(".mobile-tab-btn", mobileLabel).click();
    } else {
      cy.contains(".tab-btn", desktopLabel).click();
    }
  });
});

// Opens the left panel drawer on mobile if it is not already open.
// No-op on desktop/tablet where the panel is always visible.
Cypress.Commands.add("openLeftPanel", () => {
  cy.get("body").then(($body) => {
    const toggle = $body.find(".mobile-panel-toggle--left").filter(":visible");
    if (
      toggle.length > 0 &&
      !$body.find(".left-panel").hasClass("left-panel--open")
    ) {
      cy.get(".mobile-panel-toggle--left").click();
    }
  });
});

// Opens the right panel drawer on mobile if it is not already open.
// No-op on desktop/tablet where the panel is always visible.
Cypress.Commands.add("openRightPanel", () => {
  cy.get("body").then(($body) => {
    const toggle = $body.find(".mobile-panel-toggle--right").filter(":visible");
    if (
      toggle.length > 0 &&
      !$body.find(".right-panel").hasClass("right-panel--open")
    ) {
      cy.get(".mobile-panel-toggle--right").click();
    }
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
      switchTab(desktopLabel: string): Chainable<void>;
      openLeftPanel(): Chainable<void>;
      openRightPanel(): Chainable<void>;
    }
  }
}
