describe("Galaxy View — extended", () => {
  beforeEach(() => {
    cy.viewport(1440, 900);
    cy.visit("/");
    cy.contains(".tab-btn", "Galaxy").click();
  });

  describe("system navigator list", () => {
    it("shows multiple known systems in the list", () => {
      cy.contains(".gnav-name", "Solar System").should("be.visible");
      cy.contains(".gnav-name", "Alpha Centauri").should("be.visible");
      cy.contains(".gnav-name", "Tau Ceti").should("be.visible");
      cy.contains(".gnav-name", "Sirius").should("be.visible");
    });

    it("selecting multiple systems in sequence updates the right panel each time", () => {
      cy.contains(".gnav-row", "Tau Ceti").click();
      cy.get(".gsp-name").should("contain.text", "Tau Ceti");

      cy.contains(".gnav-row", "Alpha Centauri").click();
      cy.get(".gsp-name").should("contain.text", "Alpha Centauri");

      cy.contains(".gnav-row", "Solar System").click();
      cy.get(".gsp-name").should("contain.text", "Solar System");
    });

    it("selected row gains the selected class", () => {
      cy.contains(".gnav-row", "Alpha Centauri").click();
      cy.contains(".gnav-row", "Alpha Centauri").should(
        "have.class",
        "selected",
      );
    });

    it("previously selected row loses the selected class when a new row is chosen", () => {
      cy.contains(".gnav-row", "Alpha Centauri").click();
      cy.contains(".gnav-row", "Solar System").click();
      cy.contains(".gnav-row", "Alpha Centauri").should(
        "not.have.class",
        "selected",
      );
      cy.contains(".gnav-row", "Solar System").should("have.class", "selected");
    });

    it("right panel shows Solar System on initial load", () => {
      cy.get(".gsp-name").should("contain.text", "Solar System");
    });

    it("selecting a system removes the empty state", () => {
      cy.contains(".gnav-row", "Alpha Centauri").click();
      cy.get(".galaxy-system-panel--empty").should("not.exist");
    });
  });

  describe("system panel detail", () => {
    it("shows distance from Earth for Alpha Centauri", () => {
      cy.contains(".gnav-row", "Alpha Centauri").click();
      cy.get(".gsp-distance-value").should("be.visible");
    });

    it("shows a type badge for each selected system", () => {
      cy.contains(".gnav-row", "Solar System").click();
      cy.get(".gsp-type-badge").should("be.visible");

      cy.contains(".gnav-row", "Alpha Centauri").click();
      cy.get(".gsp-type-badge").should("be.visible");
    });

    it("shows the Explore System button for a selected system", () => {
      cy.contains(".gnav-row", "Tau Ceti").click();
      cy.get(".gsp-explore-btn").should("be.visible");
    });

    it("shows a clickable arm hint for Solar System", () => {
      cy.contains(".gnav-row", "Solar System").click();
      cy.get(".gsp-arm-hint--clickable").should("be.visible");
    });
  });

  describe("arm hint navigates to a region", () => {
    it("clicking the arm hint replaces the system panel with a region panel", () => {
      cy.contains(".gnav-row", "Solar System").click();
      cy.get(".gsp-arm-hint--clickable").first().click();
      cy.get(".gsp-type-badge--region").should("be.visible");
    });

    it("after viewing a region, selecting a system shows that system — not a region", () => {
      cy.contains(".gnav-row", "Solar System").click();
      cy.get(".gsp-arm-hint--clickable").first().click();
      cy.get(".gsp-type-badge--region").should("be.visible");

      cy.contains(".gnav-row", "Tau Ceti").click();
      cy.get(".gsp-name").should("contain.text", "Tau Ceti");
      cy.get(".gsp-type-badge--region").should("not.exist");
    });
  });

  describe("Explore System button", () => {
    it("navigates to System View for the selected system", () => {
      cy.contains(".gnav-row", "Solar System").click();
      cy.get(".gsp-explore-btn").click();
      cy.get(".tab-btn.active").should("contain.text", "System View");
    });

    it("system selector reflects the explored system", () => {
      cy.contains(".gnav-row", "Tau Ceti").click();
      cy.get(".gsp-explore-btn").click();
      cy.get(".system-select").should("have.value", "tauceti");
    });
  });

  describe("search", () => {
    it("filtering by name shows matching systems", () => {
      cy.get(".gnav-search").type("Alpha");
      cy.contains(".gnav-name", "Alpha Centauri")
        .scrollIntoView()
        .should("be.visible");
    });

    it("filtering hides non-matching systems", () => {
      cy.get(".gnav-search").type("Alpha");
      cy.contains(".gnav-name", "Solar System").should("not.exist");
    });

    it("clearing the search restores all systems", () => {
      cy.get(".gnav-search").type("Alpha");
      cy.contains(".gnav-name", "Solar System").should("not.exist");
      cy.get(".gnav-search").clear();
      cy.contains(".gnav-name", "Solar System").should("be.visible");
    });

    it("search is case-insensitive", () => {
      cy.get(".gnav-search").type("sirius");
      cy.contains(".gnav-name", "Sirius").scrollIntoView().should("be.visible");
    });
  });

  describe("Constellations tab", () => {
    it("switching to Constellations tab shows constellation rows", () => {
      cy.contains(".gnav-tab", "Constellations").click();
      cy.get(".gnav-row--constellation").should("have.length.greaterThan", 0);
    });

    it("selecting a constellation shows a Constellation badge in the right panel", () => {
      cy.contains(".gnav-tab", "Constellations").click();
      cy.get(".gnav-row--constellation").first().click();
      cy.get(".gsp-type-badge--constellation").should("be.visible");
    });

    it("Orion constellation panel shows its name and member systems", () => {
      cy.contains(".gnav-tab", "Constellations").click();
      cy.contains(".gnav-row--constellation", "Orion").click();
      cy.get(".gsp-name").should("contain.text", "Orion");
      cy.get(".gsp-member-system-btn").should("have.length.greaterThan", 0);
    });

    it("clicking a member system button switches the panel to that system", () => {
      cy.contains(".gnav-tab", "Constellations").click();
      cy.contains(".gnav-row--constellation", "Orion").click();
      cy.get(".gsp-member-system-btn").first().click();
      cy.get(".gsp-type-badge--constellation").should("not.exist");
      cy.get(".gsp-name").should("be.visible");
    });

    it("switching back to Systems tab shows system rows", () => {
      cy.contains(".gnav-tab", "Constellations").click();
      cy.contains(".gnav-tab", "Systems").click();
      cy.contains(".gnav-name", "Solar System").should("be.visible");
      cy.get(".gnav-row--constellation").should("not.exist");
    });
  });

  describe("regions toggle", () => {
    it("regions toggle is off by default", () => {
      cy.get(".galaxy-regions-toggle").should("not.have.class", "active");
    });

    it("toggling regions on and off works", () => {
      cy.get(".galaxy-regions-toggle").click();
      cy.get(".galaxy-regions-toggle").should("have.class", "active");
      cy.get(".galaxy-regions-toggle").click();
      cy.get(".galaxy-regions-toggle").should("not.have.class", "active");
    });

    it("arm hint still navigates to a region when regions toggle is on", () => {
      cy.get(".galaxy-regions-toggle").click();
      cy.contains(".gnav-row", "Solar System").click();
      cy.get(".gsp-arm-hint--clickable").first().click();
      cy.get(".gsp-type-badge--region").should("be.visible");
    });
  });
});
