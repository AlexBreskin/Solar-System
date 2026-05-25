describe("Galaxy View", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.contains(".tab-btn", "Galaxy").click();
  });

  it("shows galaxy canvas and regions toggle", () => {
    cy.get(".galaxy-regions-toggle").should("be.visible");
    cy.get(".gnav").should("be.visible");
  });

  it("toggles region labels on and off", () => {
    cy.get(".galaxy-regions-toggle").should("not.have.class", "active").click();
    cy.get(".galaxy-regions-toggle").should("have.class", "active").click();
    cy.get(".galaxy-regions-toggle").should("not.have.class", "active");
  });

  it("shows system list in left panel with Solar System entry", () => {
    cy.contains(".gnav-name", "Solar System").should("be.visible");
  });

  it("selecting Alpha Centauri shows its details", () => {
    cy.contains(".gnav-row", "Alpha Centauri").click();
    cy.get(".gsp-name").should("contain.text", "Alpha Centauri");
  });

  it("Explore System button switches to system view", () => {
    cy.contains(".gnav-row", "Solar System").click();
    cy.get(".gsp-explore-btn").should("be.visible").click();
    cy.get(".tab-btn.active").should("contain.text", "System View");
  });
});
