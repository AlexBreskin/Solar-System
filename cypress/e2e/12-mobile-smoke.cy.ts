// Smoke tests for the mobile drawer interaction pattern.
// Feature correctness is covered by 09–11 at desktop; these tests verify that
// the drawer open/close mechanics wire up correctly to the same feature code.
describe("Mobile smoke", () => {
  beforeEach(() => {
    cy.viewport(390, 844);
    cy.visit("/");
  });

  describe("System View", () => {
    it("selecting a body via the drawer updates the info panel", () => {
      cy.get(".mobile-panel-toggle--left").click();
      cy.get("[data-body-id='mars']").click();
      // selecting a body auto-closes the left drawer on mobile
      cy.get(".left-panel").should("not.have.class", "left-panel--open");
      cy.get(".mobile-panel-toggle--right").click();
      cy.get(".info-name").should("contain.text", "Mars");
    });

    it("expanding a tree node and selecting a moon updates the info panel", () => {
      cy.get(".mobile-panel-toggle--left").click();
      cy.get("[data-body-id='earth']").find(".expand-btn").click();
      cy.contains("[data-body-id]", "Moon").click();
      cy.get(".mobile-panel-toggle--right").click();
      cy.get(".info-name").should("contain.text", "Moon");
      cy.get(".info-parent").should("contain.text", "Earth");
    });
  });

  describe("Body View", () => {
    it("switching to Body View and selecting a planet via the drawer updates the info panel", () => {
      cy.contains(".mobile-tab-btn", "Body").click();
      cy.get(".mobile-panel-toggle--left").click();
      cy.get("[data-body-id='jupiter']").click();
      cy.get(".mobile-panel-toggle--right").click();
      cy.get(".info-name").should("contain.text", "Jupiter");
    });
  });

  describe("Galaxy View", () => {
    it("selecting a system via the drawer updates the right panel", () => {
      cy.contains(".mobile-tab-btn", "Galaxy").click();
      cy.get(".mobile-panel-toggle--left").click();
      cy.contains(".gnav-row", "Alpha Centauri").click();
      cy.get(".mobile-panel-toggle--right").click();
      cy.get(".gsp-name").should("contain.text", "Alpha Centauri");
    });

    it("searching for a system via the drawer shows matching results", () => {
      cy.contains(".mobile-tab-btn", "Galaxy").click();
      cy.get(".mobile-panel-toggle--left").click();
      cy.get(".gnav-search").type("Tau");
      cy.contains(".gnav-name", "Tau Ceti").should("be.visible");
      cy.contains(".gnav-name", "Solar System").should("not.exist");
    });

    it("Explore System navigates back to System View", () => {
      cy.contains(".mobile-tab-btn", "Galaxy").click();
      cy.get(".mobile-panel-toggle--left").click();
      cy.contains(".gnav-row", "Solar System").click();
      cy.get(".mobile-panel-toggle--right").click();
      cy.get(".gsp-explore-btn").click();
      cy.contains(".mobile-tab-btn", "System").should("have.class", "active");
    });
  });
});
