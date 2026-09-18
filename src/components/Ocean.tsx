"use client";
import { useEffect, useRef } from "react";
import { mic } from "@/lib/micLevel";

/**
 * Full-bleed ocean. Always moving, independent of app state: it is mounted at the
 * root so nothing the page does can blank it. Swell rises with the live mic level,
 * read from a module store so the waves never cost a React render.
 * Without WebGL (or under reduced motion) a slow CSS drift takes over.
 */
export function Ocean() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let cleanup = () => {};

    void import("three").then((THREE) => {
      if (cancelled || !el) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
      } catch { return; }

      const dpr = Math.min(window.devicePixelRatio, 1.6);
      renderer.setPixelRatio(dpr);
      renderer.setSize(window.innerWidth, window.innerHeight);
      el.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = "width:100%;height:100%;display:block";

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const u = {
        uTime: { value: 0 },
        uSwell: { value: 0 },
        uRes: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      };

      const material = new THREE.ShaderMaterial({
        uniforms: u,
        transparent: true,
        vertexShader: `void main(){ gl_Position = vec4(position, 1.0); }`,
        fragmentShader: `
          precision highp float;
          uniform float uTime, uSwell;
          uniform vec2 uRes;

          vec2 hash(vec2 p){
            p = vec2(dot(p, vec2(127.1,311.7)), dot(p, vec2(269.5,183.3)));
            return -1.0 + 2.0*fract(sin(p)*43758.5453123);
          }
          float noise(vec2 p){
            vec2 i = floor(p), f = fract(p);
            vec2 u = f*f*(3.0-2.0*f);
            return mix(mix(dot(hash(i+vec2(0,0)), f-vec2(0,0)),
                           dot(hash(i+vec2(1,0)), f-vec2(1,0)), u.x),
                       mix(dot(hash(i+vec2(0,1)), f-vec2(0,1)),
                           dot(hash(i+vec2(1,1)), f-vec2(1,1)), u.x), u.y);
          }
          float fbm(vec2 p){
            float v=0.0, a=0.55;
            for(int i=0;i<6;i++){ v+=a*noise(p); p=p*2.03+vec2(1.7,9.2); a*=0.5; }
            return v;
          }

          void main(){
            vec2 uv = gl_FragCoord.xy / uRes.xy;
            vec2 p  = uv;
            p.x *= uRes.x / uRes.y;

            float t = uTime * 0.085;
            float swell = 0.55 + uSwell * 1.25;

            // travelling swell: stacked wave trains moving at different speeds
            float w1 = sin((p.x * 2.1 + p.y * 0.7) * 1.9 + t * 2.3);
            float w2 = sin((p.x * 1.2 - p.y * 1.4) * 2.7 - t * 1.6);
            float w3 = sin((p.x * 3.4 + p.y * 2.1) * 1.1 + t * 3.1);
            float waves = (w1 * 0.5 + w2 * 0.33 + w3 * 0.2) * 0.5 * swell;

            // turbulence riding on the swell
            vec2 q = vec2(fbm(p * 1.6 + vec2(0.0, t * 1.1)),
                          fbm(p * 1.6 + vec2(3.4, -t * 0.9)));
            float body = fbm(p * 2.2 + q * 1.6 + vec2(0.0, t * 0.7) + waves * 0.35);

            // depth: darker toward the bottom, light spilling from the top
            float depth = smoothstep(1.05, -0.25, uv.y);

            vec3 abyss   = vec3(0.016, 0.027, 0.062);
            vec3 deepSea = vec3(0.043, 0.129, 0.243);
            vec3 teal    = vec3(0.075, 0.376, 0.451);
            vec3 crest   = vec3(0.435, 0.812, 0.847);

            vec3 col = mix(abyss, deepSea, smoothstep(-0.35, 0.55, body + waves * 0.4));
            col = mix(col, teal, smoothstep(0.05, 0.85, body + 0.25 * waves) * (0.55 + uSwell * 0.5));

            // caustics: thin bright filaments where wave trains cross
            float caustic = pow(max(0.0, 1.0 - abs(waves * 1.9 - body * 0.8)), 7.0);
            col += crest * caustic * (0.32 + uSwell * 0.9);

            // surface light from above
            col += vec3(0.30, 0.55, 0.62) * pow(smoothstep(0.35, 1.15, uv.y), 2.4) * 0.30;

            col *= 0.45 + 0.55 * depth;

            float vig = smoothstep(1.45, 0.30, length((uv - 0.5) * vec2(uRes.x/uRes.y, 1.0)));
            col *= 0.42 + 0.58 * vig;

            gl_FragColor = vec4(col, 1.0);
          }
        `,
      });

      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      scene.add(mesh);

      let raf = 0, smooth = 0;
      const start = performance.now();
      const frame = () => {
        smooth += ((mic.active ? Math.max(mic.level, 0.12) : mic.level) - smooth) * 0.10;
        u.uTime.value = (performance.now() - start) / 1000;
        u.uSwell.value = smooth;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      };
      frame();

      const onResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        u.uRes.value.set(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        mesh.geometry.dispose(); material.dispose(); renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => { cancelled = true; cleanup(); };
  }, []);

  return <div ref={host} aria-hidden className="ocean-bg pointer-events-none fixed inset-0 -z-10" />;
}
