describe("Body Navigator", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("shows body hierarchy with Earth visible", () => {
    cy.get(".body-navigator").should("be.visible");
    cy.contains("[data-body-id]", "Earth").should("be.visible");
  });

  it("clicking Mars updates the info panel", () => {
    cy.get("[data-body-id='mars']").click();
    cy.get(".info-name").should("contain.text", "Mars");
  });

  it("expands Earth to reveal the Moon", () => {
    cy.get("[data-body-id='earth']").find(".expand-btn").click();
    cy.contains("[data-body-id]", "Moon").should("be.visible");
  });

  it("clicking the Moon in planet view shows its parent planet", () => {
    cy.contains(".tab-btn", "Body View").click();
    cy.get("[data-body-id='earth']").find(".expand-btn").click();
    cy.contains("[data-body-id]", "Moon").click();
    cy.get(".info-name").should("contain.text", "Moon");
  });
});
