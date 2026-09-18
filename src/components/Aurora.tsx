"use client";
import { useEffect, useRef } from "react";

/**
 * Full-bleed WebGL backdrop. Flowing domain-warped noise, and its intensity is
 * driven by the live microphone level, so the room reacts when you speak.
 * Falls back to a static CSS gradient if WebGL is unavailable or motion is reduced.
 */
export function Aurora({ level, active }: { level: number; active: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const target = useRef({ level: 0, active: 0 });

  useEffect(() => {
    target.current.level = level;
    target.current.active = active ? 1 : 0;
  }, [level, active]);

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

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(el.clientWidth, el.clientHeight);
      el.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = "width:100%;height:100%;display:block";

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const uniforms = {
        uTime: { value: 0 },
        uLevel: { value: 0 },
        uActive: { value: 0 },
        uRes: { value: new THREE.Vector2(el.clientWidth, el.clientHeight) },
      };

      const material = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        vertexShader: `
          void main() { gl_Position = vec4(position, 1.0); }
        `,
        fragmentShader: `
          precision highp float;
          uniform float uTime, uLevel, uActive;
          uniform vec2 uRes;

          vec2 hash(vec2 p){
            p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
            return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
          }
          float noise(vec2 p){
            vec2 i = floor(p), f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(dot(hash(i + vec2(0,0)), f - vec2(0,0)),
                           dot(hash(i + vec2(1,0)), f - vec2(1,0)), u.x),
                       mix(dot(hash(i + vec2(0,1)), f - vec2(0,1)),
                           dot(hash(i + vec2(1,1)), f - vec2(1,1)), u.x), u.y);
          }
          float fbm(vec2 p){
            float v = 0.0, a = 0.5;
            for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.02; a *= 0.5; }
            return v;
          }

          void main(){
            vec2 uv = gl_FragCoord.xy / uRes.xy;
            vec2 p = uv * 2.0 - 1.0;
            p.x *= uRes.x / uRes.y;

            float t = uTime * 0.06;
            float boost = uLevel * 1.4 + uActive * 0.25;

            // domain warp
            vec2 q = vec2(fbm(p * 1.1 + t), fbm(p * 1.1 + vec2(5.2, 1.3) - t));
            vec2 r = vec2(fbm(p * 1.4 + 3.0 * q + vec2(1.7, 9.2) + t * 1.4),
                          fbm(p * 1.4 + 3.0 * q + vec2(8.3, 2.8) - t * 1.2));
            float f = fbm(p * 1.3 + 2.4 * r + boost * 0.5);

            vec3 violet = vec3(0.38, 0.20, 0.92);
            vec3 cyan   = vec3(0.10, 0.75, 0.95);
            vec3 ember  = vec3(0.98, 0.35, 0.22);
            vec3 deep   = vec3(0.03, 0.03, 0.07);

            vec3 col = mix(deep, violet, smoothstep(-0.2, 0.7, f));
            col = mix(col, cyan,  smoothstep(0.15, 0.95, length(r)) * (0.45 + boost * 0.4));
            col = mix(col, ember, smoothstep(0.55, 1.15, length(q)) * (0.22 + boost * 0.65));

            // vignette so the type always sits on something calm
            float vig = smoothstep(1.55, 0.25, length(p));
            col *= 0.30 + 0.70 * vig;

            float alpha = (0.55 + boost * 0.35) * vig;
            gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.92));
          }
        `,
      });

      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      scene.add(mesh);

      let raf = 0;
      const start = performance.now();
      let smooth = 0, smoothActive = 0;

      const frame = () => {
        smooth += (target.current.level - smooth) * 0.12;
        smoothActive += (target.current.active - smoothActive) * 0.06;
        uniforms.uTime.value = (performance.now() - start) / 1000;
        uniforms.uLevel.value = smooth;
        uniforms.uActive.value = smoothActive;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      };
      frame();

      const onResize = () => {
        if (!el) return;
        renderer.setSize(el.clientWidth, el.clientHeight);
        uniforms.uRes.value.set(el.clientWidth, el.clientHeight);
      };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        mesh.geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => { cancelled = true; cleanup(); };
  }, []);

  return (
    <div
      ref={host}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background:
          "radial-gradient(1100px 700px at 22% 8%, #2A1B6B 0%, transparent 60%)," +
          "radial-gradient(900px 620px at 82% 26%, #0B4C63 0%, transparent 62%)," +
          "radial-gradient(760px 520px at 55% 96%, #4A1530 0%, transparent 60%), #06060B",
      }}
    />
  );
}
