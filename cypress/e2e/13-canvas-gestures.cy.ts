// Canvas gesture tests (drag-to-pan, pinch-to-zoom, double-tap-to-track) across
// System View, Body View, and Galaxy View. These exercise the pointer-event
// handlers directly rather than the navigator/button controls covered elsewhere.
//
// Each canvas calls canvas.setPointerCapture(pointerId) on pointerdown with no
// try/catch. Real browsers reject setPointerCapture for a pointerId that isn't
// tied to a genuine active input device, which synthetic pointer IDs from
// cy.trigger() are not. That throws an uncaught InvalidPointerId exception that
// is harmless to app logic but would otherwise fail these tests, so it's
// suppressed here.
const CANVAS = ".canvas-area canvas:last-of-type";

describe("Canvas gestures", () => {
  beforeEach(() => {
    cy.viewport(1440, 900);
    cy.on("uncaught:exception", (err) => {
      if (/setPointerCapture|InvalidPointerId/.test(err.message)) return false;
    });
    cy.visit("/");
  });

  describe("System View", () => {
    it("dragging the canvas pans the view", () => {
      cy.canvasSnapshot(CANVAS).then((before) => {
        cy.canvasDrag(CANVAS, -150, 0, 150, 0);
        cy.wait(300);
        cy.canvasSnapshot(CANVAS).should((after) => {
          expect(after).not.to.eq(before);
        });
      });
    });

    it("pinching the canvas zooms the view", () => {
      cy.canvasSnapshot(CANVAS).then((before) => {
        cy.canvasPinch(CANVAS, 60, 260);
        cy.wait(300);
        cy.canvasSnapshot(CANVAS).should((after) => {
          expect(after).not.to.eq(before);
        });
      });
    });

    it("double-clicking a tracked, centered body toggles tracking via the canvas", () => {
      cy.get(".ctrl-btn[title='Pause']").click(); // freeze orbits so Earth stays centered
      cy.get("[data-body-id='earth']").click(); // auto-tracks and centers Earth
      cy.get(".tracking-indicator").should("contain.text", "Tracking Earth");
      cy.wait(1500); // let the pan-to-center easing settle

      cy.canvasDoubleClickCenter(CANVAS);
      cy.get(".tracking-indicator").should("not.exist");

      cy.canvasDoubleClickCenter(CANVAS);
      cy.get(".tracking-indicator").should("contain.text", "Tracking Earth");
    });

    it("the untrack button clears tracking", () => {
      cy.get(".ctrl-btn[title='Pause']").click();
      cy.get("[data-body-id='earth']").click();
      cy.get(".tracking-indicator").should("be.visible");
      cy.get(".untrack-btn").click();
      cy.get(".tracking-indicator").should("not.exist");
    });
  });

  describe("Body View", () => {
    beforeEach(() => {
      cy.contains(".tab-btn", "Body View").click();
    });

    it("dragging the canvas pans the view", () => {
      cy.canvasSnapshot(CANVAS).then((before) => {
        cy.canvasDrag(CANVAS, -120, 0, 120, 0);
        cy.wait(300);
        cy.canvasSnapshot(CANVAS).should((after) => {
          expect(after).not.to.eq(before);
        });
      });
    });

    it("pinching the canvas zooms the view", () => {
      cy.canvasSnapshot(CANVAS).then((before) => {
        cy.canvasPinch(CANVAS, 60, 260);
        cy.wait(300);
        cy.canvasSnapshot(CANVAS).should((after) => {
          expect(after).not.to.eq(before);
        });
      });
    });
  });

  describe("Galaxy View", () => {
    beforeEach(() => {
      cy.contains(".tab-btn", "Galaxy").click();
    });

    it("dragging the canvas pans the view", () => {
      cy.canvasSnapshot(CANVAS).then((before) => {
        cy.canvasDrag(CANVAS, -150, 0, 150, 0);
        cy.wait(300);
        cy.canvasSnapshot(CANVAS).should((after) => {
          expect(after).not.to.eq(before);
        });
      });
    });

    it("pinching the canvas zooms the view", () => {
      cy.canvasSnapshot(CANVAS).then((before) => {
        cy.canvasPinch(CANVAS, 60, 400);
        cy.wait(300);
        cy.canvasSnapshot(CANVAS).should((after) => {
          expect(after).not.to.eq(before);
        });
      });
    });
  });
});
