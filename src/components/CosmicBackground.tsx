import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SimplexNoise } from "three-stdlib";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { refreshScrollTriggers, whenPreloaderReady } from "@/lib/scrollAnimations";

gsap.registerPlugin(ScrollTrigger);

const BG_IMAGE =
  "https://user-images.githubusercontent.com/26748614/96337246-f14d4580-1085-11eb-8793-a86d929e034d.jpg";

const TEXTURES = {
  sphereBg: "https://i.ibb.co/HC0vxMw/sky2.jpg",
  nucleus: "https://i.ibb.co/hcN2qXk/star-nc8wkw.jpg",
} as const;

function sampleNoise3D(noise: SimplexNoise, x: number, y: number, z: number) {
  return noise.noise4d(x, y, z, 0);
}

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function getScrollProgress() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const maxScroll = Math.max(
    document.documentElement.scrollHeight - window.innerHeight,
    1,
  );
  return Math.min(1, Math.max(0, scrollTop / maxScroll));
}

const CosmicBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let disposed = false;
    let frameId = 0;
    let resizeTimer: ReturnType<typeof setTimeout>;
    let controls: OrbitControls | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let scrollCtx: gsap.Context | undefined;

    let targetScroll = getScrollProgress();
    let smoothScroll = targetScroll;

    const onScroll = () => {
      targetScroll = getScrollProgress();
    };

    const init = async () => {
      const isMobile = window.innerWidth < 768;
      const noise = new SimplexNoise();
      const blobScale = 3;
      const nucleusRadius = 30;
      const vertexScratch = new THREE.Vector3();

      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(
        55,
        container.clientWidth / container.clientHeight,
        0.01,
        1000,
      );
      camera.position.set(0, 0, 230);

      const directionalLight = new THREE.DirectionalLight("#ffffff", 0.42);
      directionalLight.position.set(0, 50, -20);
      scene.add(directionalLight);

      const ambientLight = new THREE.AmbientLight("#ffffff", 0.32);
      ambientLight.position.set(0, 20, 20);
      scene.add(ambientLight);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
      container.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.2;
      controls.maxDistance = 350;
      controls.minDistance = 150;
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.enableRotate = false;

      const loader = new THREE.TextureLoader();
      let textures: THREE.Texture[];
      try {
        textures = await awaitTextures(loader, [TEXTURES.sphereBg, TEXTURES.nucleus]);
      } catch {
        return;
      }

      if (disposed) {
        textures.forEach((t) => t.dispose());
        renderer.dispose();
        return;
      }

      const [textureSphereBg, textureNucleus] = textures;

      textureNucleus.anisotropy = 16;
      const nucleusGeometry = new THREE.IcosahedronGeometry(
        nucleusRadius,
        isMobile ? 3 : 6,
      );
      const nucleusMaterial = new THREE.MeshPhongMaterial({ map: textureNucleus });
      const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
      scene.add(nucleus);

      const nucleusBase = nucleusGeometry.attributes.position.array.slice() as Float32Array;

      textureSphereBg.anisotropy = 16;
      const sphereBg = new THREE.Mesh(
        new THREE.SphereGeometry(150, 40, 40),
        new THREE.MeshBasicMaterial({
          side: THREE.BackSide,
          map: textureSphereBg,
          // Darken the star sphere texture
          color: new THREE.Color("#2e2e38"),
        }),
      );
      scene.add(sphereBg);

      const setupDomScroll = () => {
        scrollCtx?.revert();

        scrollCtx = gsap.context(() => {
          const scrollConfig = {
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            scrub: isMobile ? 0.25 : 0.4,
            invalidateOnRefresh: true,
          };

          if (bgImageRef.current) {
            gsap.fromTo(
              bgImageRef.current,
              { yPercent: 0, scale: 1, opacity: 0.22 },
              {
                yPercent: isMobile ? 22 : 32,
                scale: 1.14,
                opacity: 0.14,
                ease: "none",
                scrollTrigger: scrollConfig,
              },
            );
          }

          if (canvasWrapRef.current) {
            gsap.fromTo(
              canvasWrapRef.current,
              { yPercent: 0, scale: 1 },
              {
                yPercent: isMobile ? 8 : 14,
                scale: 1.05,
                ease: "none",
                scrollTrigger: scrollConfig,
              },
            );
          }

          if (gradientRef.current) {
            gsap.fromTo(
              gradientRef.current,
              { opacity: 1 },
              {
                opacity: 0.35,
                ease: "none",
                scrollTrigger: {
                  ...scrollConfig,
                  end: "60% top",
                },
              },
            );
          }
        });

        refreshScrollTriggers();
      };

      setupDomScroll();
      whenPreloaderReady(() => {
        setupDomScroll();
        targetScroll = getScrollProgress();
        smoothScroll = targetScroll;
      });

      window.addEventListener("scroll", onScroll, { passive: true });

      const clock = new THREE.Clock();
      let visible = !document.hidden;

      const onVisibility = () => {
        visible = !document.hidden;
        if (visible) {
          targetScroll = getScrollProgress();
        }
      };

      const onResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          camera.aspect = container.clientWidth / container.clientHeight;
          camera.updateProjectionMatrix();
          renderer?.setSize(container.clientWidth, container.clientHeight);
          targetScroll = getScrollProgress();
          refreshScrollTriggers();
        }, 80);
      };

      const targetFps = isMobile ? 30 : 60;
      const frameInterval = 1 / targetFps;
      let accumulator = 0;
      const scrollLerp = isMobile ? 0.16 : 0.11;

      const animate = () => {
        frameId = requestAnimationFrame(animate);
        if (!visible || disposed) return;

        accumulator += clock.getDelta();
        if (accumulator < frameInterval) return;
        accumulator %= frameInterval;

        smoothScroll += (targetScroll - smoothScroll) * scrollLerp;
        const p = smoothstep(smoothScroll);

        const nucleusPositions = nucleusGeometry.attributes.position;
        const time = Date.now();
        for (let i = 0; i < nucleusPositions.count; i++) {
          const bx = nucleusBase[i * 3];
          const by = nucleusBase[i * 3 + 1];
          const bz = nucleusBase[i * 3 + 2];
          vertexScratch.set(bx, by, bz).normalize();
          const distance =
            nucleusRadius +
            sampleNoise3D(
              noise,
              vertexScratch.x + time * 0.00018,
              vertexScratch.y + time * 0.0001,
              vertexScratch.z + time * 0.00028,
            ) * blobScale;
          vertexScratch.multiplyScalar(distance);
          nucleusPositions.setXYZ(i, vertexScratch.x, vertexScratch.y, vertexScratch.z);
        }
        nucleusPositions.needsUpdate = true;
        nucleusGeometry.computeVertexNormals();

        camera.position.z = THREE.MathUtils.lerp(230, 135, p);
        camera.position.y = THREE.MathUtils.lerp(0, -58, p);
        camera.position.x = THREE.MathUtils.lerp(0, isMobile ? 6 : 14, p);
        camera.fov = THREE.MathUtils.lerp(55, 62, p);
        camera.updateProjectionMatrix();
        camera.lookAt(0, p * -8, 0);

        const nucleusScale = 1 - p * 0.14;
        nucleus.scale.setScalar(nucleusScale);
        nucleus.position.y = p * -18;

        nucleus.rotation.y += 0.0007 + p * 0.004;
        nucleus.rotation.x = p * 1.1;
        nucleus.rotation.z = p * 0.45;

        const sphereRate = 0.0007 + p * 0.0045;
        sphereBg.rotation.x += sphereRate;
        sphereBg.rotation.y += sphereRate * 1.6;
        sphereBg.rotation.z += sphereRate * 0.6;

        if (controls) {
          controls.autoRotateSpeed = 1.2 + p * 4;
          controls.update();
        }

        renderer?.render(scene, camera);
      };

      animate();

      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("scroll", onScroll);
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("resize", onResize);
        scrollCtx?.revert();
      };
    };

    let removeListeners: (() => void) | undefined;

    init().then((cleanup) => {
      if (disposed) {
        cleanup?.();
        return;
      }
      removeListeners = cleanup;
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(resizeTimer);
      removeListeners?.();
      controls?.dispose();
      renderer?.dispose();
      if (renderer?.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      id="canvas_container"
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden
    >
      <div
        ref={bgImageRef}
        className="absolute inset-0 bg-cover bg-center will-change-transform"
        style={{
          backgroundImage: `url("${BG_IMAGE}")`,
          filter: "brightness(26%)",
          opacity: 0.22,
        }}
      />
      <div ref={canvasWrapRef} className="absolute inset-0 h-full w-full will-change-transform">
        <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      </div>
      <div
        ref={gradientRef}
        className="absolute inset-0 bg-gradient-to-b from-[hsl(18_28%_3%/0.58)] via-[hsl(16_25%_2%/0.42)] to-[hsl(16_32%_4%/0.68)]"
      />
    </div>
  );
};

function awaitTextures(loader: THREE.TextureLoader, urls: string[]) {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<THREE.Texture>((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        }),
    ),
  );
}

export default CosmicBackground;
