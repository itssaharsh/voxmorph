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
            return clamp(v * 0.9 + 0.5, 0.0, 1.0);   // -> 0..1, so thresholds mean something
          }

          void main(){
            vec2 uv = gl_FragCoord.xy / uRes.xy;
            float agh = uRes.x / uRes.y;
            float t = uTime * 0.05;
            float swell = 0.5 + uSwell * 1.3;

            const float HORIZON = 0.60;

            vec3 skyHigh = vec3(0.055, 0.180, 0.380);
            vec3 skyLow  = vec3(0.180, 0.420, 0.620);
            vec3 seaDeep = vec3(0.012, 0.075, 0.180);
            vec3 seaMid  = vec3(0.043, 0.235, 0.420);
            vec3 seaLit  = vec3(0.180, 0.520, 0.680);
            vec3 foam    = vec3(0.780, 0.930, 0.980);

            vec3 col;

            if (uv.y > HORIZON) {
              // ── sky and clouds ──
              float k = (uv.y - HORIZON) / (1.0 - HORIZON);
              col = mix(skyLow, skyHigh, pow(k, 0.85));

              // two cloud decks drifting at different speeds
              vec2 cp = vec2(uv.x * agh * 1.5, (uv.y - HORIZON) * 3.2);
              float far  = fbm(cp * 1.5 + vec2(t * 1.7, 0.0));
              float near = fbm(cp * 0.85 + vec2(t * 2.9, -t * 0.4) + far * 0.6);

              float deck1 = smoothstep(0.36, 0.78, far)  * (1.0 - k * 0.25);
              float deck2 = smoothstep(0.44, 0.86, near) * (1.0 - k * 0.10);

              vec3 cloudDark = vec3(0.090, 0.180, 0.310);
              vec3 cloudLit  = vec3(0.680, 0.800, 0.900);
              vec3 cloud = mix(cloudDark, cloudLit, smoothstep(0.42, 0.90, near));

              col = mix(col, cloud * 0.80, deck1 * 0.70);
              col = mix(col, cloud, deck2 * 0.85);

              // light spilling along the horizon
              col += vec3(0.35, 0.55, 0.70) * pow(1.0 - k, 6.0) * 0.30;
            } else {
              // ── water ──
              float d = (HORIZON - uv.y) / HORIZON;          // 0 at horizon, 1 at the bottom
              float persp = 1.0 / (d * 5.5 + 0.10);          // wave detail compresses to the horizon

              vec2 wp = vec2(uv.x * agh, d);
              float w1 = sin((wp.x * 3.1 + wp.y * 1.4) * persp * 0.55 + t * 5.0);
              float w2 = sin((wp.x * 1.9 - wp.y * 2.2) * persp * 0.42 - t * 3.6);
              float w3 = sin((wp.x * 5.4 + wp.y * 3.0) * persp * 0.30 + t * 7.0);
              float waves = (w1 * 0.5 + w2 * 0.32 + w3 * 0.18) * swell;

              float turb = fbm(vec2(wp.x * 2.2, d * 6.0) + vec2(0.0, t * 3.0) + waves * 0.25);

              col = mix(seaMid, seaDeep, smoothstep(0.0, 0.95, d));
              col = mix(col, seaLit, smoothstep(0.25, 1.05, waves * 0.5 + turb) * (0.60 - d * 0.30));

              // sun glitter, a vertical path down the middle
              float path = exp(-pow((uv.x - 0.52) * agh * 2.1, 2.0));
              float glint = pow(max(0.0, waves * 0.45 + (turb - 0.35)), 5.0) * path;
              col += foam * glint * (0.55 + uSwell * 1.1) * (1.0 - d * 0.55);

              // crests breaking into foam
              float crest = smoothstep(0.72, 1.05, waves * 0.5 + turb * 0.75);
              col = mix(col, foam, crest * 0.26 * (1.0 - d * 0.65));

              // haze where the water meets the sky
              col = mix(col, skyLow * 0.9, pow(1.0 - d, 9.0) * 0.75);
            }

            // keep the page readable: darken overall, and more toward the centre
            float vig = smoothstep(1.55, 0.25, length((uv - vec2(0.5, 0.52)) * vec2(agh, 1.0)));
            col *= 0.60 + 0.34 * vig;
            col *= 0.90 + 0.22 * uSwell;

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
