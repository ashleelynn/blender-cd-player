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

type Props = { children: ReactNode; position: Vec3; target: Vec3; fov?: number };

/** Full-page transparent canvas, so the page's dot grid shows through the glass. */
export function Stage({ children, position, target, fov = 30 }: Props) {
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
        <LookAt target={target} />
        <StudioEnvironment />
        <directionalLight position={[0.3, 0.9, 0.5]} intensity={0.7} />
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  );
}
