describe("System View", () => {
  beforeEach(() => {
    cy.viewport(1440, 900);
    cy.visit("/");
  });

  describe("multi-body selection updates focus", () => {
    it("cycles through inner planets and updates info panel each time", () => {
      cy.get("[data-body-id='mercury']").click();
      cy.get(".info-name").should("contain.text", "Mercury");

      cy.get("[data-body-id='venus']").click();
      cy.get(".info-name").should("contain.text", "Venus");

      cy.get("[data-body-id='earth']").click();
      cy.get(".info-name").should("contain.text", "Earth");

      cy.get("[data-body-id='mars']").click();
      cy.get(".info-name").should("contain.text", "Mars");
    });

    it("cycles through outer planets and updates info panel each time", () => {
      cy.get("[data-body-id='jupiter']").click();
      cy.get(".info-name").should("contain.text", "Jupiter");

      cy.get("[data-body-id='saturn']").click();
      cy.get(".info-name").should("contain.text", "Saturn");

      cy.get("[data-body-id='uranus']").click();
      cy.get(".info-name").should("contain.text", "Uranus");

      cy.get("[data-body-id='neptune']").click();
      cy.get(".info-name").should("contain.text", "Neptune");
    });

    it("shows Star type and sun-pulse for the Sun", () => {
      cy.get(".info-name").should("contain.text", "Sun");
      cy.get(".info-type").should("contain.text", "Star");
      cy.get(".sun-pulse").should("exist");
    });

    it("shows Planet type for planets", () => {
      cy.get("[data-body-id='saturn']").click();
      cy.get(".info-type").should("contain.text", "Planet");
    });

    it("shows Dwarf Planet type for Pluto", () => {
      cy.get("[data-body-id='pluto']").click();
      cy.get(".info-name").should("contain.text", "Pluto");
      cy.get(".info-type").should("contain.text", "Dwarf Planet");
    });

    it("selecting the Asteroid Belt updates the info panel", () => {
      cy.get("[data-body-id='asteroid-belt']").click();
      cy.get(".info-name").should("contain.text", "Asteroid Belt");
    });

    it("selecting the Kuiper Belt updates the info panel", () => {
      cy.get("[data-body-id='kuiper-belt']").click();
      cy.get(".info-name").should("contain.text", "Kuiper Belt");
    });
  });

  describe("retrograde tag", () => {
    it("shows retrograde tag for Venus", () => {
      cy.get("[data-body-id='venus']").click();
      cy.get(".retrograde-tag").scrollIntoView().should("be.visible");
    });

    it("shows retrograde tag for Uranus", () => {
      cy.get("[data-body-id='uranus']").click();
      cy.get(".retrograde-tag").scrollIntoView().should("be.visible");
    });

    it("does not show retrograde tag for Earth", () => {
      cy.get("[data-body-id='earth']").click();
      cy.get(".retrograde-tag").should("not.exist");
    });
  });

  describe("moon navigation", () => {
    it("expanding Earth shows the Moon and selecting it updates the panel", () => {
      cy.get("[data-body-id='earth']").find(".expand-btn").click();
      cy.contains("[data-body-id]", "Moon").should("be.visible").click();
      cy.get(".info-name").should("contain.text", "Moon");
      cy.get(".info-type").should("contain.text", "Moon");
      cy.get(".info-parent").should("contain.text", "Earth");
    });

    it("expanding Mars reveals Phobos and Deimos", () => {
      cy.get("[data-body-id='mars']").find(".expand-btn").click();
      cy.contains("[data-body-id]", "Phobos").should("be.visible");
      cy.contains("[data-body-id]", "Deimos").should("be.visible");
    });

    it("selecting Phobos shows Mars as the parent body", () => {
      cy.get("[data-body-id='mars']").find(".expand-btn").click();
      cy.contains("[data-body-id]", "Phobos").click();
      cy.get(".info-name").should("contain.text", "Phobos");
      cy.get(".info-parent").should("contain.text", "Mars");
    });

    it("selecting Deimos shows Mars as the parent body", () => {
      cy.get("[data-body-id='mars']").find(".expand-btn").click();
      cy.contains("[data-body-id]", "Deimos").click();
      cy.get(".info-name").should("contain.text", "Deimos");
      cy.get(".info-parent").should("contain.text", "Mars");
    });

    it("expanding Jupiter reveals Galilean moons", () => {
      cy.get("[data-body-id='jupiter']").find(".expand-btn").click();
      cy.contains("[data-body-id]", "Io").should("be.visible");
      cy.contains("[data-body-id]", "Europa").should("be.visible");
      cy.contains("[data-body-id]", "Ganymede").should("be.visible");
      cy.contains("[data-body-id]", "Callisto").should("be.visible");
    });

    it("collapsing Earth hides the Moon again", () => {
      cy.get("[data-body-id='earth']").find(".expand-btn").click();
      cy.contains("[data-body-id]", "Moon").should("be.visible");
      cy.get("[data-body-id='earth']").find(".expand-btn").click();
      cy.contains("[data-body-id]", "Moon").should("not.exist");
    });
  });

  describe("Orbits and Labels controls", () => {
    it("Orbits button starts active and toggles off and on", () => {
      cy.contains(".ctrl-btn", "Orbits").should("have.class", "active").click();
      cy.contains(".ctrl-btn", "Orbits")
        .should("not.have.class", "active")
        .click();
      cy.contains(".ctrl-btn", "Orbits").should("have.class", "active");
    });

    it("Labels button starts inactive and toggles on and off", () => {
      cy.contains(".ctrl-btn", "Labels")
        .should("not.have.class", "active")
        .click();
      cy.contains(".ctrl-btn", "Labels").should("have.class", "active").click();
      cy.contains(".ctrl-btn", "Labels").should("not.have.class", "active");
    });

    it("Orbits and Labels buttons disappear when switching to Galaxy", () => {
      cy.contains(".ctrl-btn", "Orbits").should("be.visible");
      cy.contains(".tab-btn", "Galaxy").click();
      cy.contains(".ctrl-btn", "Orbits").should("not.exist");
    });
  });
});
