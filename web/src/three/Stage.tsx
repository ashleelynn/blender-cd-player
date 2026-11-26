import { Suspense, useEffect, useLayoutEffect, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

type Vec3 = [number, number, number];

/** Studio-style reflections without downloading an HDRI. */
function StudioEnvironment() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.6;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

function LookAt({ target }: { target: Vec3 }) {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  }, [camera, target]);
  return null;
}

type FitProps = {
  /** footprint of the object on the table, [width along X, depth along Z] in meters */
  extent: [number, number];
  /** px kept clear above (the top bar) and below the object */
  top: number;
  bottom: number;
  /** share of the free height the object fills */
  fill?: number;
};

/**
 * Looks down at an object lying on the table and frames it in the free area between `top` and
 * `bottom`: centered on the page's vertical axis, a touch above the area's middle (optical center),
 * and as large as `fill` allows without touching the sides. Recomputes on resize.
 */
export function TopDownFit({ extent: [width, depth], top, bottom, fill = 0.86 }: FitProps) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const { width: w, height: h } = useThree((s) => s.size);
  useLayoutEffect(() => {
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const area = Math.max(160, h - top - bottom);
    const byHeight = depth / ((area / h) * fill) / (2 * tan);
    const byWidth = width / (0.8 * 2 * tan * (w / h));
    const dist = Math.max(byHeight, byWidth);
    const visible = 2 * dist * tan;
    const centerPx = top + area / 2 - area * 0.03; // optical center sits slightly high
    const z = -((centerPx - h / 2) / h) * visible;
    camera.position.set(0, dist, z + dist * 0.08); // a slight tilt keeps the depth readable
    camera.lookAt(0, 0, z);
    camera.updateProjectionMatrix();
  }, [camera, w, h, width, depth, top, bottom, fill]);
  return null;
}

type Props = { children: ReactNode; position?: Vec3; target?: Vec3; fov?: number };

/** Transparent canvas filling its parent, so the page's dot grid shows through the glass. */
export function Stage({ children, position = [0, 0.5, 0.04], target, fov = 30 }: Props) {
  return (
    <div className="stage">
      <Canvas
        dpr={[1, 2]}
        shadows
        camera={{ position, fov, near: 0.01, far: 10 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NeutralToneMapping;
          gl.toneMappingExposure = 1.0;
        }}
      >
        {target && <LookAt target={target} />}
        <StudioEnvironment />
        <directionalLight position={[0.3, 0.9, 0.5]} intensity={0.7} />
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  );
}
