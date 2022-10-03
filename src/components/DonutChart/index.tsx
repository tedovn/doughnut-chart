import { useEffect, useRef } from "react";
import { detectCollision, polarToCartesian } from "../../helpers";
import { ArcProps, StickProps, SVGElementProps } from "../../models/Donut";

import "./style.scss";

const CIRCLE_UNITS = 360;
const ARCS_COLOR = "f6692e";
const HANDLERS_COLOR = "fff";

interface DonutChartProps {
  segments: number;
  viewBox: number;
  borderSize: number;
}

const Donut = (props: DonutChartProps) => {
  const { viewBox, borderSize, segments } = props;

  const shouldStartListenForMove = useRef(false);
  const currentHandlerAngle = useRef<number>(0);
  const handlersRefs = useRef<SVGGElement[]>([]);
  const arcsRefs = useRef<SVGGElement[]>([]);

  const RADIUS = viewBox / 2;
  const CX = viewBox / 2;
  const CY = viewBox / 2;

  const describeArc = ([x, y, radius, startAngle, endAngle]: number[]) => {
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    const innerRadius = radius - borderSize;

    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const startLine = polarToCartesian(x, y, innerRadius, startAngle);
    const endLine = polarToCartesian(x, y, innerRadius, endAngle);

    const d = [
      "M",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      "L",
      startLine.x,
      startLine.y,
      "A",
      innerRadius,
      innerRadius,
      0,
      0,
      1,
      endLine.x,
      endLine.y,
      "L",
      start.x,
      start.y,
    ].join(" ");

    return { path: d, point: start };
  };

  const arcCoordinates = (arc: SVGElementProps) => {
    const { x: x1, y: y1 } = polarToCartesian(
      arc.x,
      arc.y,
      arc.radius - borderSize / 2,
      (arc.startAngle > arc.endAngle
        ? arc.startAngle + arc.endAngle + CIRCLE_UNITS
        : arc.startAngle + arc.endAngle) / 2
    );
    const { x: x2, y: y2 } = polarToCartesian(
      arc.x,
      arc.y,
      arc.radius + borderSize / 2,
      (arc.startAngle > arc.endAngle
        ? arc.startAngle + arc.endAngle + CIRCLE_UNITS
        : arc.startAngle + arc.endAngle) / 2
    );

    return { x1, y1, x2, y2 };
  };

  const handlerCoordinates = (arc: SVGElementProps) => {
    const { x: x1, y: y1 } = polarToCartesian(
      arc.x,
      arc.y,
      arc.radius,
      arc.startAngle
    );
    const { x: x2, y: y2 } = polarToCartesian(
      arc.x,
      arc.y,
      arc.radius - borderSize,
      arc.startAngle
    );

    return { x1, y1, x2, y2 };
  };

  const ArcsData: SVGElementProps[] = Array.from(Array(segments), (x, i) => {
    const avgAngle = CIRCLE_UNITS / segments;

    return {
      x: CX,
      y: CY,
      radius: RADIUS,
      startAngle: avgAngle * i,
      endAngle: avgAngle * (i + 1),
    };
  });

  const arcs: ArcProps[] = ArcsData.map((arc) => {
    return describeArc(Object.values(arc));
  });

  const handlers = ArcsData.map((arc) => {
    return handlerCoordinates(arc);
  });

  const sticks: StickProps[] = ArcsData.map((arc) => {
    return arcCoordinates(arc);
  });

  const setGroupElementsPositions = (index: number, arc: SVGElementProps) => {
    const group = arcsRefs.current[index];
    const path = group.getElementsByTagName("path")[0];
    const line = group.getElementsByTagName("line")[0];
    const circle = group.getElementsByTagName("circle")[0];
    const text = group.getElementsByTagName("text")[0];

    const { x1, x2, y1, y2 } = arcCoordinates(arc);

    // path
    path.setAttribute("d", describeArc(Object.values(arc)).path);

    // line
    line.setAttribute("x1", `${x1}`);
    line.setAttribute("x2", `${x2}`);
    line.setAttribute("y1", `${y1}`);
    line.setAttribute("y2", `${y2}`);

    // circle
    circle.setAttribute("cx", `${x2}`);
    circle.setAttribute("cy", `${y2}`);

    // text
    text.setAttribute("x", `${x2}`);
    text.setAttribute("y", `${y2}`);
  };

  const setHandlersPositions = (index: number, arc: SVGElementProps) => {
    const handler = handlersRefs.current[index];

    const lines = handler.getElementsByTagName("line");

    const { x1, x2, y1, y2 } = handlerCoordinates(arc);

    // line
    lines[0].setAttribute("x1", `${x1}`);
    lines[0].setAttribute("x2", `${x2}`);
    lines[0].setAttribute("y1", `${y1}`);
    lines[0].setAttribute("y2", `${y2}`);

    // line
    lines[1].setAttribute("x1", `${x1}`);
    lines[1].setAttribute("x2", `${x2}`);
    lines[1].setAttribute("y1", `${y1}`);
    lines[1].setAttribute("y2", `${y2}`);
  };

  const mouseMoveListener = (e: MouseEvent) => {
    if (shouldStartListenForMove.current) {
      const w = window.innerWidth / 2;
      const h = window.innerHeight / 2;
      const handlerIdx = currentHandlerAngle.current;

      const deltaX = w - e.clientX;
      const deltaY = h - e.clientY;

      const rad = Math.atan2(deltaX, deltaY);
      let degWithPi = rad * (180 / Math.PI);

      if (degWithPi < 0) {
        degWithPi = Math.abs(-CIRCLE_UNITS - degWithPi);
      }

      const prevArcIdx =
        handlerIdx === 0 ? ArcsData.length - 1 : handlerIdx - 1;
      const nextArcIdx = handlerIdx;

      const prevArc = ArcsData[prevArcIdx];
      const nextArc = ArcsData[nextArcIdx];

      nextArc.startAngle = CIRCLE_UNITS - degWithPi;
      prevArc.endAngle = nextArc.startAngle;

      const ph =
        handlersRefs.current[
          handlerIdx === 0 ? handlers.length - 1 : handlerIdx - 1
        ].getBoundingClientRect();
      const ch = handlersRefs.current[handlerIdx].getBoundingClientRect();
      const nh =
        handlersRefs.current[
          handlerIdx === handlers.length - 1 ? 0 : handlerIdx + 1
        ].getBoundingClientRect();

      console.clear();
      console.info(ph, ch, nh);
      console.info("COLLISION PREV:: ", detectCollision(ch, ph));
      console.info("COLLISION NEXT:: ", detectCollision(ch, nh));

      // TODO: handle elements overflow

      // handler element position
      setHandlersPositions(handlerIdx, nextArc);

      // prev element position
      setGroupElementsPositions(prevArcIdx, prevArc);
      // next element position
      setGroupElementsPositions(nextArcIdx, nextArc);
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", mouseMoveListener);
    return () => {
      return window.removeEventListener("mousemove", mouseMoveListener);
    };
  }, []);

  const mouseUpListener = () => {
    shouldStartListenForMove.current = false;
  };

  useEffect(() => {
    window.addEventListener("mouseup", mouseUpListener);
    return () => {
      return window.removeEventListener("mouseup", mouseUpListener);
    };
  }, []);

  const renderArc = (
    arc: ArcProps,
    index: number,
    defaultColor: string,
    className: string
  ) => {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16);

    return (
      <g
        key={`arc-${index}`}
        id={`arc-${index}`}
        ref={(ref) => {
          arcsRefs.current.push(ref!);
        }}
      >
        <path
          className={className || ""}
          d={arc.path}
          fill={`#${defaultColor ? defaultColor : randomColor}`}
          strokeWidth={0}
          stroke={"black"}
        />
        <line
          x1={sticks[index].x1}
          y1={sticks[index].y1}
          x2={sticks[index].x2}
          y2={sticks[index].y2}
          stroke={"#8a000c"}
          strokeWidth={2}
        />
        <g>
          <circle
            cx={sticks[index].x2}
            cy={sticks[index].y2}
            r={8}
            fill={"#8a000c"}
          />
          <text
            x={sticks[index].x2}
            y={sticks[index].y2}
            textAnchor="middle"
            fontSize={8}
            stroke="#fff"
            dy=".3em"
          >
            {String.fromCharCode(index + 65)}
          </text>
        </g>
      </g>
    );
  };

  const renderHandler = (
    handler: StickProps,
    index: number,
    defaultColor: string,
    className: string
  ) => {
    const { x1, x2, y1, y2 } = handler;
    return (
      <g
        ref={(ref) => {
          handlersRefs.current.push(ref!);
        }}
        key={`handler-${index}`}
        className={className || ""}
      >
        <line
          key={`handler-${index}`}
          className={className || ""}
          x1={x1}
          x2={x2}
          y1={y1}
          y2={y2}
          stroke={`#${defaultColor}`}
          strokeWidth={4}
          strokeLinecap="round"
        />
        <line
          onMouseDown={() => {
            currentHandlerAngle.current = index;
            shouldStartListenForMove.current = true;
          }}
          x1={x1}
          x2={x2}
          y1={y1}
          y2={y2}
          stroke={`#${defaultColor}`}
          strokeWidth={4}
          strokeLinecap="round"
        />
      </g>
    );
  };

  return (
    <div className={"donut-chart-wrap"}>
      <svg
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {arcs.map((arc, index) => {
          return renderArc(arc, index, ARCS_COLOR, "");
        })}
        <g className="handlers">
          {handlers.map((handler, index) => {
            return renderHandler(
              handler,
              index,
              HANDLERS_COLOR,
              "handler-item"
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default Donut;
