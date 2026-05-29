// Responsive layout tests across three representative viewport sizes.
// These verify that panels, navigation, and controls adapt correctly
// without breaking core functionality at each breakpoint.

const DESKTOP = { width: 1440, height: 900 } as const;
const TABLET = { width: 768, height: 1024 } as const;
const MOBILE = { width: 390, height: 844 } as const;

// ─── Desktop ─────────────────────────────────────────────────────────────────

describe("Desktop (1440×900)", () => {
  beforeEach(() => {
    cy.viewport(DESKTOP.width, DESKTOP.height);
    cy.visit("/");
  });

  it("renders both panels visible without any drawers", () => {
    cy.get(".left-panel").should("be.visible");
    cy.get(".right-panel").should("be.visible");
  });

  it("shows the desktop tab bar inside the header", () => {
    cy.get(".tab-bar").should("be.visible");
    cy.get(".tab-btn").should("have.length.at.least", 2);
  });

  it("shows the header controls (speed slider, orbits, labels)", () => {
    cy.get(".header-controls").should("be.visible");
    cy.get(".speed-slider").should("be.visible");
  });

  it("shows the full logo text", () => {
    cy.get(".logo-text")
      .should("be.visible")
      .and("contain.text", "Star Systems");
  });

  it("does not show the mobile bottom tab bar", () => {
    cy.get(".mobile-tab-bar").should("not.be.visible");
  });

  it("does not show the mobile panel toggle buttons", () => {
    cy.get(".mobile-panel-toggle").should("not.be.visible");
  });

  it("core navigation still works — switching to Galaxy tab shows galaxy canvas", () => {
    cy.get(".tab-btn").contains("Galaxy").click();
    cy.get(".gnav").should("be.visible");
  });
});

// ─── Tablet ───────────────────────────────────────────────────────────────────

describe("Tablet (768×1024)", () => {
  beforeEach(() => {
    cy.viewport(TABLET.width, TABLET.height);
    cy.visit("/");
  });

  it("renders both panels visible", () => {
    cy.get(".left-panel").should("be.visible");
    cy.get(".right-panel").should("be.visible");
  });

  it("hides the logo text to save header space", () => {
    cy.get(".logo-text").should("not.be.visible");
  });

  it("hides the speed control to save header space", () => {
    cy.get(".speed-control").should("not.be.visible");
  });

  it("still shows the desktop tab bar", () => {
    cy.get(".tab-bar").should("be.visible");
  });

  it("does not show the mobile bottom tab bar", () => {
    cy.get(".mobile-tab-bar").should("not.be.visible");
  });

  it("core navigation still works — switching to Galaxy shows galaxy navigator", () => {
    cy.get(".tab-btn").contains("Galaxy").click();
    cy.get(".gnav").should("be.visible");
  });
});

// ─── Mobile ───────────────────────────────────────────────────────────────────

describe("Mobile (390×844)", () => {
  beforeEach(() => {
    cy.viewport(MOBILE.width, MOBILE.height);
    cy.visit("/");
  });

  it("shows the mobile bottom tab bar", () => {
    cy.get(".mobile-tab-bar").should("be.visible");
    cy.get(".mobile-tab-btn").should("have.length", 3);
  });

  it("shows the mobile panel toggle buttons in the header", () => {
    cy.get(".mobile-panel-toggle--left").should("be.visible");
    cy.get(".mobile-panel-toggle--right").should("be.visible");
  });

  it("hides the desktop tab bar", () => {
    cy.get(".tab-bar").should("not.be.visible");
  });

  it("hides the header controls", () => {
    cy.get(".header-controls").should("not.be.visible");
  });

  it("left panel is closed by default", () => {
    cy.get(".left-panel").should("not.have.class", "left-panel--open");
  });

  it("right panel is closed by default", () => {
    cy.get(".right-panel").should("not.have.class", "right-panel--open");
  });

  it("tapping the nav toggle opens the left panel", () => {
    cy.get(".mobile-panel-toggle--left").click();
    cy.get(".left-panel").should("have.class", "left-panel--open");
  });

  it("tapping the info toggle opens the right panel", () => {
    cy.get(".mobile-panel-toggle--right").click();
    cy.get(".right-panel").should("have.class", "right-panel--open");
  });

  it("tapping the backdrop closes the open left panel", () => {
    cy.get(".mobile-panel-toggle--left").click();
    cy.get(".left-panel").should("have.class", "left-panel--open");
    cy.get(".panel-backdrop").click();
    cy.get(".left-panel").should("not.have.class", "left-panel--open");
  });

  it("tapping the backdrop closes the open right panel", () => {
    cy.get(".mobile-panel-toggle--right").click();
    cy.get(".right-panel").should("have.class", "right-panel--open");
    cy.get(".panel-backdrop").click();
    cy.get(".right-panel").should("not.have.class", "right-panel--open");
  });

  it("opening a second panel closes the first", () => {
    cy.get(".mobile-panel-toggle--left").click();
    cy.get(".left-panel").should("have.class", "left-panel--open");
    cy.get(".mobile-panel-toggle--right").click();
    cy.get(".left-panel").should("not.have.class", "left-panel--open");
    cy.get(".right-panel").should("have.class", "right-panel--open");
  });

  it("switching tabs via the bottom bar closes any open panel", () => {
    cy.get(".mobile-panel-toggle--left").click();
    // Use cy.contains(selector, text) so the button element is matched, not a child span
    cy.contains(".mobile-tab-btn", "Galaxy").click();
    cy.get(".left-panel").should("not.have.class", "left-panel--open");
  });

  it("bottom bar Galaxy tab switches view and marks button active", () => {
    cy.contains(".mobile-tab-btn", "Galaxy").click();
    cy.contains(".mobile-tab-btn", "Galaxy").should("have.class", "active");
    // On mobile the galaxy navigator is inside the closed drawer, not directly
    // visible. Verify the galaxy canvas rendered in the canvas area instead.
    cy.get(".canvas-area .galaxy-hint").should("exist");
  });

  it("bottom bar System tab switches back to system view", () => {
    cy.contains(".mobile-tab-btn", "Galaxy").click();
    cy.contains(".mobile-tab-btn", "System").click();
    cy.contains(".mobile-tab-btn", "System").should("have.class", "active");
    cy.get(".body-navigator").should("exist");
  });

  it("selecting a body in the navigator closes the left drawer", () => {
    cy.get(".mobile-panel-toggle--left").click();
    cy.get(".left-panel").should("have.class", "left-panel--open");
    cy.get("[data-body-id='mars']").click();
    cy.get(".left-panel").should("not.have.class", "left-panel--open");
  });

  it("canvas is visible and fills the available space when panels are closed", () => {
    cy.get(".canvas-area").should("be.visible");
    cy.get(".canvas-area").invoke("width").should("be.gt", 300);
  });
});
