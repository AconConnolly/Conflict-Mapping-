import React, { useEffect, useRef, useState } from "react";
import { geoPath, geoOrthographic } from "d3-geo";
import { select } from "d3-selection"; // Import select for attaching the drag behavior
import { drag } from "d3-drag";
import { feature } from "topojson-client";
import * as d3 from "d3"; // Import all d3 functions into d3 object
import versor from "versor";

export default function Globe() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const width = 800;
    const height = 600;
    const scaleFactor = 1.2; // Adjust the scale factor to make the globe larger

    // Adjust the projection to scale the globe
    const projection = geoOrthographic()
      .scale((width / 2) * scaleFactor)
      .translate([width / 2 + 120, height / 2 + 300]);

    const sphere = { type: "Sphere" };

    // Fetch land data asynchronously
    Promise.all([
      fetch("land-50m.json").then((response) => response.json()),
      fetch("land-110m.json").then((response) => response.json()),
    ]).then(([land50, land110]) => {
      // Process the fetched data
      const land50Feature = feature(land50, land50.objects.land);
      const land110Feature = feature(land110, land110.objects.land);

      // Rendering function
      function render(land) {
        const context = canvasRef.current.getContext("2d");
        const path = geoPath().projection(projection).context(context);

        context.clearRect(0, 0, width, height);
        context.beginPath();
        path(sphere);
        context.fillStyle = "#fff";
        context.fill();

        context.beginPath();
        path(land);
        context.fillStyle = "#000";
        context.fill();

        context.beginPath();
        path(sphere);
        context.stroke();
      }

      // Drag behavior
      function handleDrag(projection) {
        select(canvasRef.current)
          .call(
            drag()
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended)
          );

        let v0, q0, r0, a0, l;

        function pointer(event, that) {
          const t = [d3.pointer(event)]; // Use d3.pointer instead of d3.pointers

          if (t.length !== l) {
            l = t.length;
            if (l > 1) a0 = Math.atan2(t[1][1] - t[0][1], t[1][0] - t[0][0]);
            dragstarted.apply(that, [event, that]);
          }

          // For multitouch, average positions and compute rotation.
          if (l > 1) {
            const x = d3.mean(t, (p) => p[0]);
            const y = d3.mean(t, (p) => p[1]);
            const a = Math.atan2(t[1][1] - t[0][1], t[1][0] - t[0][0]);
            return [x, y, a];
          }

          return t[0];
        }

        function dragstarted(event) {
          const [x, y] = d3.pointer(event);
          v0 = versor.cartesian(projection.invert([x, y]));
          q0 = versor((r0 = projection.rotate()));
        }

        function dragged(event) {
          const [x, y] = d3.pointer(event);
          const v1 = versor.cartesian(
            projection.rotate(r0).invert([x, y])
          );
          const delta = versor.delta(v0, v1);
          let q1 = versor.multiply(q0, delta);

          // For multitouch, compose with a rotation around the axis.
          const p = pointer(event, this);
          if (p[2]) {
            const d = (p[2] - a0) / 2;
            const s = -Math.sin(d);
            const c = Math.sign(Math.cos(d));
            q1 = versor.multiply([Math.sqrt(1 - s * s), 0, 0, c * s], q1);
          }

          projection.rotate(versor.rotation(q1));

          // In vicinity of the antipode (unstable) of q0, restart.
          if (delta[0] < 0.7) dragstarted(event);
          render(land110Feature); // Re-render after drag
        }

        function dragended(event) {
          render(land50Feature); // Re-render after drag ends
        }
      }

      // Initial rendering with land50
      render(land50Feature);
      handleDrag(projection);
    });
  }, []); // Empty dependency array ensures useEffect runs only once

  return <canvas ref={canvasRef} width={1800} height={1600} />;
}
