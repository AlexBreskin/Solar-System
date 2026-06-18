import type { Result } from "axe-core";

// Automated accessibility audit via axe-core (cypress-axe). Catches a11y
// regressions (missing labels, contrast issues, ARIA misuse) as the UI grows.
//
// Violations are logged to the terminal (rule id, impact, description, and the
// CSS selector of each affected element) since cy.checkA11y()'s own assertion
// only reports a count.
function logViolations(violations: Result[]) {
  cy.task(
    "log",
    `${violations.length} accessibility violation${violations.length === 1 ? "" : "s"} detected:`,
  );
  violations.forEach((v) => {
    const targets = v.nodes.map((n) => n.target.join(" ")).join(", ");
    cy.task(
      "log",
      `  [${v.impact}] ${v.id} — ${v.description}\n    targets: ${targets}`,
    );
  });
}

function checkA11y() {
  cy.checkA11y(undefined, undefined, logViolations);
}

describe("Accessibility", () => {
  beforeEach(() => {
    cy.viewport(1440, 900);
    cy.visit("/");
    cy.injectAxe();
  });

  it("System View has no detectable violations", () => {
    checkA11y();
  });

  it("Body View has no detectable violations", () => {
    cy.contains(".tab-btn", "Body View").click();
    checkA11y();
  });

  it("Galaxy View has no detectable violations", () => {
    cy.contains(".tab-btn", "Galaxy").click();
    checkA11y();
  });

  it("Info panel with a selected body has no detectable violations", () => {
    cy.get("[data-body-id='mars']").click();
    checkA11y();
  });

  it("Galaxy system panel with a selected system has no detectable violations", () => {
    cy.contains(".tab-btn", "Galaxy").click();
    cy.contains(".gnav-row", "Alpha Centauri").click();
    checkA11y();
  });
});

describe("Accessibility — mobile", () => {
  beforeEach(() => {
    cy.viewport(390, 844);
    cy.visit("/");
    cy.injectAxe();
  });

  it("mobile layout with the left drawer open has no detectable violations", () => {
    cy.get(".mobile-panel-toggle--left").click();
    checkA11y();
  });

  it("mobile layout with the right drawer open has no detectable violations", () => {
    cy.get(".mobile-panel-toggle--right").click();
    checkA11y();
  });
});
