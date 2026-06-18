describe("Body View", () => {
  beforeEach(() => {
    cy.viewport(1440, 900);
    cy.visit("/");
    cy.contains(".tab-btn", "Body View").click();
  });

  describe("tab state", () => {
    it("Body View tab becomes active", () => {
      cy.get(".tab-btn.active").should("contain.text", "Body View");
    });

    it("shows zoom controls", () => {
      cy.get(".canvas-zoom-controls").should("be.visible");
    });

    it("Labels button visible, Orbits button absent", () => {
      cy.contains(".ctrl-btn", "Labels").should("be.visible");
      cy.contains(".ctrl-btn", "Orbits").should("not.exist");
    });
  });

  describe("switching focus via the navigator", () => {
    it("clicking Earth updates the info panel", () => {
      cy.get("[data-body-id='earth']").click();
      cy.get(".info-name").should("contain.text", "Earth");
      cy.get(".info-type").should("contain.text", "Planet");
    });

    it("clicking Mars updates the info panel", () => {
      cy.get("[data-body-id='mars']").click();
      cy.get(".info-name").should("contain.text", "Mars");
    });

    it("clicking Jupiter updates the info panel", () => {
      cy.get("[data-body-id='jupiter']").click();
      cy.get(".info-name").should("contain.text", "Jupiter");
    });

    it("switching between multiple planets updates the panel each time", () => {
      cy.get("[data-body-id='venus']").click();
      cy.get(".info-name").should("contain.text", "Venus");

      cy.get("[data-body-id='neptune']").click();
      cy.get(".info-name").should("contain.text", "Neptune");

      cy.get("[data-body-id='uranus']").click();
      cy.get(".info-name").should("contain.text", "Uranus");
    });
  });

  describe("moon selection in Body View", () => {
    it("selecting the Moon from Earth's expanded tree updates the info panel", () => {
      cy.get("[data-body-id='earth']").click();
      cy.get("[data-body-id='earth']").find(".expand-btn").click();
      cy.contains("[data-body-id]", "Moon").click();
      cy.get(".info-name").should("contain.text", "Moon");
      cy.get(".info-type").should("contain.text", "Moon");
    });

    it("selecting Phobos from Mars's tree updates the info panel", () => {
      cy.get("[data-body-id='mars']").click();
      cy.get("[data-body-id='mars']").find(".expand-btn").click();
      cy.contains("[data-body-id]", "Phobos").click();
      cy.get(".info-name").should("contain.text", "Phobos");
    });

    it("selecting Europa from Jupiter's tree updates the info panel", () => {
      cy.get("[data-body-id='jupiter']").click();
      cy.get("[data-body-id='jupiter']").find(".expand-btn").click();
      cy.contains("[data-body-id]", "Europa").click();
      cy.get(".info-name").should("contain.text", "Europa");
    });
  });

  describe("planets without moons", () => {
    it("clicking Mercury still shows its info panel", () => {
      cy.get("[data-body-id='mercury']").click();
      cy.get(".info-name").should("contain.text", "Mercury");
      cy.get(".info-type").should("contain.text", "Planet");
    });

    it("clicking Venus still shows its info panel", () => {
      cy.get("[data-body-id='venus']").click();
      cy.get(".info-name").should("contain.text", "Venus");
    });

    it("Mercury has no expand button", () => {
      cy.get("[data-body-id='mercury']")
        .find(".expand-btn")
        .should("not.exist");
    });
  });

  describe("Labels toggle", () => {
    it("Labels button starts inactive and toggles on and off", () => {
      cy.contains(".ctrl-btn", "Labels")
        .should("not.have.class", "active")
        .click();
      cy.contains(".ctrl-btn", "Labels").should("have.class", "active").click();
      cy.contains(".ctrl-btn", "Labels").should("not.have.class", "active");
    });
  });

  describe("system switching in Body View", () => {
    it("switching to Tau Ceti shows its planets in the navigator", () => {
      cy.get(".system-select").select("tauceti");
      cy.contains("[data-body-id]", "Tau Ceti g").should("be.visible");
      cy.contains("[data-body-id]", "Tau Ceti e").should("be.visible");
    });

    it("selecting a Tau Ceti planet updates the info panel", () => {
      cy.get(".system-select").select("tauceti");
      cy.contains("[data-body-id]", "Tau Ceti e").click();
      cy.get(".info-name").should("contain.text", "Tau Ceti e");
    });

    it("switching back to Solar System restores its bodies", () => {
      cy.get(".system-select").select("tauceti");
      cy.get(".system-select").select("sol");
      cy.contains("[data-body-id]", "Earth").should("be.visible");
    });
  });
});
