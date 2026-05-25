describe("Tabs", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("System View is the default active tab", () => {
    cy.get(".tab-btn.active").should("contain.text", "System View");
    cy.get(".canvas-zoom-controls").should("be.visible");
  });

  it("switches to Body View", () => {
    cy.contains(".tab-btn", "Body View").click();
    cy.get(".tab-btn.active").should("contain.text", "Body View");
    cy.get(".canvas-zoom-controls").should("be.visible");
  });

  it("switches to Galaxy tab", () => {
    cy.contains(".tab-btn", "Galaxy").click();
    cy.get(".tab-btn.active").should("contain.text", "Galaxy");
    cy.get(".galaxy-regions-toggle").should("be.visible");
  });

  it("hides Body View button in Galaxy tab", () => {
    cy.contains(".tab-btn", "Galaxy").click();
    cy.contains(".tab-btn", "Body View").should("not.exist");
  });

  it("hides speed and pause controls in Galaxy tab", () => {
    cy.contains(".tab-btn", "Galaxy").click();
    cy.get(".speed-slider").should("not.exist");
    cy.get(".ctrl-btn[title='Pause']").should("not.exist");
  });
});
