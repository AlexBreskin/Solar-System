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

const POINTER_EVENT = "PointerEvent" as const;

// Drags a canvas via pointer events, relative to its center. Simulates a single-pointer
// pan gesture: pointerdown at (cx+dx1, cy+dy1), pointermove to (cx+dx2, cy+dy2), pointerup.
Cypress.Commands.add(
  "canvasDrag",
  (selector: string, dx1: number, dy1: number, dx2: number, dy2: number) => {
    cy.get(selector).then(($el) => {
      const rect = $el[0].getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const common = {
        eventConstructor: POINTER_EVENT,
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true,
        button: 0,
        bubbles: true,
      };
      cy.wrap($el)
        .trigger("pointerdown", {
          ...common,
          clientX: centerX + dx1,
          clientY: centerY + dy1,
        })
        .trigger("pointermove", {
          ...common,
          clientX: centerX + dx2,
          clientY: centerY + dy2,
        })
        .trigger("pointerup", {
          ...common,
          clientX: centerX + dx2,
          clientY: centerY + dy2,
        });
    });
  },
);

// Pinches a canvas via two synthetic pointers, centered on the canvas. startDist/endDist
// are the full distance between the two pointers (zoom in if endDist > startDist).
Cypress.Commands.add(
  "canvasPinch",
  (selector: string, startDist: number, endDist: number) => {
    cy.get(selector).then(($el) => {
      const rect = $el[0].getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const startHalf = startDist / 2;
      const endHalf = endDist / 2;
      const base = {
        eventConstructor: POINTER_EVENT,
        pointerType: "touch",
        button: 0,
        bubbles: true,
      };
      cy.wrap($el)
        .trigger("pointerdown", {
          ...base,
          pointerId: 1,
          isPrimary: true,
          clientX: centerX - startHalf,
          clientY: centerY,
        })
        .trigger("pointerdown", {
          ...base,
          pointerId: 2,
          isPrimary: false,
          clientX: centerX + startHalf,
          clientY: centerY,
        })
        .trigger("pointermove", {
          ...base,
          pointerId: 1,
          isPrimary: true,
          clientX: centerX - endHalf,
          clientY: centerY,
        })
        .trigger("pointermove", {
          ...base,
          pointerId: 2,
          isPrimary: false,
          clientX: centerX + endHalf,
          clientY: centerY,
        })
        .trigger("pointerup", {
          ...base,
          pointerId: 1,
          isPrimary: true,
          clientX: centerX - endHalf,
          clientY: centerY,
        })
        .trigger("pointerup", {
          ...base,
          pointerId: 2,
          isPrimary: false,
          clientX: centerX + endHalf,
          clientY: centerY,
        });
    });
  },
);

// Double-clicks the exact center of a canvas (used for the track-body gesture).
Cypress.Commands.add("canvasDoubleClickCenter", (selector: string) => {
  cy.get(selector).then(($el) => {
    const rect = $el[0].getBoundingClientRect();
    const clientX = rect.left + rect.width / 2;
    const clientY = rect.top + rect.height / 2;
    cy.wrap($el).trigger("dblclick", { clientX, clientY, bubbles: true });
  });
});

// Returns the canvas's current pixel content as a data URL, for before/after visual diffing.
Cypress.Commands.add("canvasSnapshot", (selector: string) => {
  return cy
    .get(selector)
    .then(($el) => ($el[0] as HTMLCanvasElement).toDataURL());
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
      canvasDrag(
        selector: string,
        dx1: number,
        dy1: number,
        dx2: number,
        dy2: number,
      ): Chainable<void>;
      canvasPinch(
        selector: string,
        startDist: number,
        endDist: number,
      ): Chainable<void>;
      canvasDoubleClickCenter(selector: string): Chainable<void>;
      canvasSnapshot(selector: string): Chainable<string>;
    }
  }
}
