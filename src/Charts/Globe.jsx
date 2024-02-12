import React, { useEffect, useRef } from "react";
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

      const countries = [
        { name: "Syria", coords: [38.9968, 34.8021], color: "red" },
        { name: "Vietnam", coords: [108.2772, 14.0583], color: "blue" },
        { name: "Afghanistan", coords: [66.2385, 33.9391], color: "green" },
        { name: "Iraq", coords: [43.6793, 33.2232], color: "white" },
        { name: "Yemen", coords: [48.5164, 15.5527], color: "yellow" },
        { name: "Sudan", coords: [30.2176, 12.8628], color: "orange" },
        { name: "Colombia", coords: [-74.2973, 4.5709], color: "purple" },
        { name: "Somalia", coords: [45.7071, 5.1521], color: "pink" },
        { name: "Israel-Palestine", coords: [35.124, 31.7719], color: "cyan" },
        { name: "Congo", coords: [23.6471, -2.8775], color: "magenta" },
      ];

      function drawMarkers(context, projection, land) {
        

        countries.forEach((country) => {
          const projected = projection(country.coords);
          if (isWithinCanvasBounds(projected)) {
            context.beginPath();
            context.arc(projected[0], projected[1], 3, 0, 2 * Math.PI);
            context.fillStyle = country.color;
            context.fill();
            context.closePath();
          }
        });
      }

      // Check if the projected coordinates are within the visible area of the canvas
      const isWithinCanvasBounds = (coords, buffer = 400) => {
        return (
          coords &&
          coords[0] >= -buffer &&
          coords[0] <= width + buffer &&
          coords[1] >= -buffer &&
          coords[1] <= height + buffer
        );
      };

      // Add event listeners for mouse enter and mouse leave events
      function addEventListeners() {
        console.log("Adding event listeners...");
        const canvas = canvasRef.current;
        canvas.addEventListener("mouseenter", handleMouseEnter);
        canvas.addEventListener("mouseleave", handleMouseLeave);
      }

      // Handle mouse enter event
      function handleMouseEnter(event) {
        console.log("Mouse entered canvas.");
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Check if the mouse is over any of the dots
        console.log(mouseX,mouseY)
        const hoveredDot = findHoveredDot(mouseX, mouseY);
        if (hoveredDot) {
          // Increase the size of the dot
          const context = canvas.getContext("2d");
          context.beginPath();
          context.arc(hoveredDot.x, hoveredDot.y, 8, 0, 2 * Math.PI);
          context.fillStyle = hoveredDot.color;
          context.fill();
        }
      }

      // Handle mouse leave event
      function handleMouseLeave() {
        console.log("Mouse left canvas.");
        // Revert the size of the dot back to normal
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        
      }

      // Find the dot that the mouse is currently hovering over
      function findHoveredDot(mouseX, mouseY) {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        const imageData = context.getImageData(mouseX, mouseY, 1, 1);
        const pixel = imageData.data;

        // Convert pixel color to hex
        const color = "#" + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1);

        // Find the dot with the matching color
        return countries.find((country) => country.color === color);
      }

      // Update the render function to draw the markers after rendering the land
      function render(land) {
        const context = canvasRef.current.getContext("2d");
        const path = geoPath().projection(projection).context(context);

        context.clearRect(0, 0, width, height);
        context.beginPath();
        path(sphere);
        context.lineWidth = 5;
        context.fillStyle = "#3987c9";
        context.fill();

        context.beginPath();
        path(land);
        context.fillStyle = "#000";
        context.fill();

        context.beginPath();
        path(sphere);
        context.stroke();

        drawMarkers(context, projection, land);
      }

      // Drag behavior
      function handleDrag(projection) {
        select(canvasRef.current).call(
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
          const v1 = versor.cartesian(projection.rotate(r0).invert([x, y]));
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
      addEventListeners(); // Add event listeners after rendering
    });
  }, []); // Empty dependency array ensures useEffect runs only once

  return <canvas ref={canvasRef} width={1050} height={1200} />;
}
