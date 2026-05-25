describe("Speed Controls", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("pauses and resumes simulation", () => {
    cy.get(".ctrl-btn[title='Pause']").should("be.visible").click();
    cy.get(".ctrl-btn[title='Resume']").should("be.visible").click();
    cy.get(".ctrl-btn[title='Pause']").should("be.visible");
  });

  it("speed slider changes the speed readout", () => {
    cy.setSliderValue(".speed-slider", 7);
    cy.get(".speed-value").should("contain.text", "7.0×");
  });

  it("controls are hidden in Galaxy tab", () => {
    cy.contains(".tab-btn", "Galaxy").click();
    cy.get(".speed-slider").should("not.exist");
    cy.get(".ctrl-btn[title='Pause']").should("not.exist");
  });
});
