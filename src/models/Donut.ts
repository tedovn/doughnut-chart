export interface StickProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SVGElementProps {
  x: number;
  y: number;
  radius: number;
  startAngle: number;
  endAngle: number;
}

interface PathProps {
  path: string;
  point: {
    x: number;
    y: number;
  };
}

export interface ArcProps extends PathProps { }

export interface HandlerProps extends PathProps { }