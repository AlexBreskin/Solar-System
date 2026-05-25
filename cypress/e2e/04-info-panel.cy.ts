describe("Info Panel", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("shows Sun data by default", () => {
    cy.get(".info-name").should("contain.text", "Sun");
    cy.get(".info-section-title").should("contain.text", "Physical");
    cy.get(".stat-label").should("contain.text", "Diameter");
  });

  it("shows NASA link for the Sun", () => {
    cy.get(".ext-link-active .nasa-badge").should("be.visible");
  });

  it("shows Wikipedia link for the Sun", () => {
    cy.get(".ext-link-active .wiki-badge")
      .scrollIntoView()
      .should("be.visible");
  });

  it("updates info panel when selecting a different body", () => {
    cy.get("[data-body-id='mars']").click();
    cy.get(".info-name").should("contain.text", "Mars");
    cy.get(".info-type").should("contain.text", "Planet");
  });
});
