describe("System Selector", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("loads Solar System by default", () => {
    cy.get(".system-select").should("have.value", "sol");
    cy.get(".pv-system-hierarchy .body-name").should(
      "contain.text",
      "Solar System",
    );
    cy.contains("[data-body-id]", "Sun").should("be.visible");
  });

  it("switches to TRAPPIST-1", () => {
    cy.get(".system-select").select("TRAPPIST-1");
    cy.get(".pv-system-hierarchy .body-name").should(
      "contain.text",
      "TRAPPIST-1",
    );
  });

  it("switches back to Solar System", () => {
    cy.get(".system-select").select("TRAPPIST-1");
    cy.get(".pv-system-hierarchy .body-name").should(
      "contain.text",
      "TRAPPIST-1",
    );
    cy.get(".system-select").select("Solar System");
    cy.get(".system-select").should("have.value", "sol");
    cy.get(".pv-system-hierarchy .body-name").should(
      "contain.text",
      "Solar System",
    );
  });
});
