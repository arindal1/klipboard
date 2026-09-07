"use client";

import { useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Procedural, generative graphite-and-mint noise field - the material
// the neumorphic panels appear to be extruded from.
const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uActivity;

  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
            + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    float n1 = snoise(uv * 2.0 + uTime * 0.035 + uMouse * 0.4);
    float n2 = snoise(uv * 1.1 - uTime * 0.02 + uMouse * 0.2);
    float n3 = snoise(uv * 4.5 - uTime * 0.05 + uMouse * 0.6);
    float n = n1 * 0.55 + n2 * 0.3 + n3 * 0.15;

    vec3 graphite = vec3(0.090, 0.094, 0.110);
    vec3 graphiteLit = vec3(0.130, 0.135, 0.155);
    vec3 mint = vec3(0.494, 0.949, 0.788);

    vec3 col = mix(graphite, graphiteLit, smoothstep(-0.2, 0.5, n));

    // Rectangular, edge-based falloff (never a radial circle around the
    // center) so there's no plateau of uniform brightness forming a
    // visible disc - just a soft darkening toward the four screen edges.
    float edgeX = smoothstep(0.0, 0.45, uv.x) * smoothstep(0.0, 0.45, 1.0 - uv.x);
    float edgeY = smoothstep(0.0, 0.45, uv.y) * smoothstep(0.0, 0.45, 1.0 - uv.y);
    float vig = edgeX * edgeY;
    col *= mix(0.7, 1.0, vig);

    float highlight = smoothstep(0.35, 0.95, n) * (0.5 + uActivity * 0.6);
    col = mix(col, mint * 0.22, highlight);

    gl_FragColor = vec4(col, 1.0);
  }
`;

function ShaderPlane({ activityRef }: { activityRef?: RefObject<number> }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uActivity: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    mouse.current.x += (state.pointer.x - mouse.current.x) * 0.02;
    mouse.current.y += (state.pointer.y - mouse.current.y) * 0.02;
    materialRef.current.uniforms.uMouse.value.set(mouse.current.x, mouse.current.y);

    if (activityRef) {
      materialRef.current.uniforms.uActivity.value = activityRef.current;
      // Decay owned here (not in the hook) so it stays frame-rate driven
      // and never causes a React re-render.
      activityRef.current *= 0.94;
    }
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function NeumorphicBackground({
  intensity = 1,
  activityRef,
}: {
  intensity?: number;
  activityRef?: RefObject<number>;
}) {
  return (
    <Canvas
      orthographic
      camera={{ zoom: 1, position: [0, 0, 1] }}
      gl={{ antialias: true }}
      dpr={[1, 1.5]}
      style={{ position: "fixed", inset: 0, zIndex: 0 }}
    >
      <ShaderPlane activityRef={activityRef} />
      <SparkleField intensity={intensity} />
    </Canvas>
  );
}

// Scale is derived from the live viewport (in this orthographic setup the
// camera's world units match screen size, same as the shader plane above)
// instead of a hardcoded box - otherwise all sparkles collapse into a tiny
// cluster near the origin and read as a single pulsing blurred circle.
function SparkleField({ intensity }: { intensity: number }) {
  const { viewport } = useThree();
  return (
    <Sparkles
      count={Math.round(60 * intensity)}
      scale={[viewport.width, viewport.height * 0.7, 2]}
      size={2}
      speed={0.15}
      opacity={0.35}
      color="#7ef2c9"
      position={[0, 0, 0.2]}
    />
  );
}