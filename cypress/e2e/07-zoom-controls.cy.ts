describe("Zoom Controls", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("zoom in button does not crash in System View", () => {
    cy.get('.canvas-zoom-btn[aria-label="Zoom in"]').click().click().click();
    cy.get(".canvas-zoom-controls").should("be.visible");
  });

  it("zoom out button does not crash in System View", () => {
    cy.get('.canvas-zoom-btn[aria-label="Zoom out"]').click().click().click();
    cy.get(".canvas-zoom-controls").should("be.visible");
  });

  it("zoom controls work in Galaxy view without crashing", () => {
    cy.contains(".tab-btn", "Galaxy").click();
    cy.get('.canvas-zoom-btn[aria-label="Zoom in"]')
      .click()
      .click()
      .click()
      .click()
      .click();
    cy.get('.canvas-zoom-btn[aria-label="Zoom out"]')
      .click()
      .click()
      .click()
      .click()
      .click();
    cy.get(".galaxy-regions-toggle").should("be.visible");
  });

  it("zoom controls are visible in Body View", () => {
    cy.contains(".tab-btn", "Body View").click();
    cy.get('.canvas-zoom-btn[aria-label="Zoom in"]').should("be.visible");
    cy.get('.canvas-zoom-btn[aria-label="Zoom out"]').should("be.visible");
  });
});
