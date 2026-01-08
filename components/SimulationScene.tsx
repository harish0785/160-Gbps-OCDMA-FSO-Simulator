
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { WeatherType } from '../types';
import { BEAM_COLORS, WEATHER_CONFIGS, USERS_PER_BEAM, TOTAL_BEAMS } from '../constants';

interface SimulationSceneProps {
  weather: WeatherType;
  distance: number;
  hoveredUser: number | null;
  onHoverUser: (id: number | null) => void;
}

const beamVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const beamFragmentShader = `
  uniform vec3 color;
  uniform float opacity;
  uniform float time;
  uniform float pulseSpeed;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec2 vUv;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.0);
    float ringIntensity = 0.7 + 0.3 * sin(time * 2.0 + vUv.y * 10.0);
    float finalAlpha = opacity * (fresnel * 1.5 + 0.2) * ringIntensity;
    gl_FragColor = vec4(color, finalAlpha);
  }
`;

const SimulationScene: React.FC<SimulationSceneProps> = ({ weather, distance, hoveredUser, onHoverUser }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rxGroupRef = useRef<THREE.Group | null>(null);
  const txGroupRef = useRef<THREE.Group | null>(null);
  const beamsGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);

  // Mapping visual distance (units) to km slider (0.1 -> 15km)
  // Let's say 1km = 5 Three.js units
  const getVisualDistance = (km: number) => km * 5;

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 15, 40);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const pl = new THREE.PointLight(0xffffff, 2);
    pl.position.set(0, 20, 0);
    scene.add(pl);

    // TX Hub
    const txGroup = new THREE.Group();
    txGroupRef.current = txGroup;
    scene.add(txGroup);
    const txMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 0.6, 32),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1 })
    );
    txMesh.rotation.z = Math.PI / 2;
    txGroup.add(txMesh);

    // RX Target
    const rxGroup = new THREE.Group();
    rxGroupRef.current = rxGroup;
    scene.add(rxGroup);
    const rxMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 1.8, 1, 32),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x3b82f6, emissiveIntensity: 1 })
    );
    rxMesh.rotation.z = Math.PI / 2;
    rxGroup.add(rxMesh);

    // Beams
    const beamsGroup = new THREE.Group();
    beamsGroupRef.current = beamsGroup;
    scene.add(beamsGroup);

    // Users (visual markers on beams)
    const usersGroup = new THREE.Group();
    scene.add(usersGroup);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const updateBeams = () => {
      beamsGroup.clear();
      const visualDist = getVisualDistance(distance);
      const halfDist = visualDist / 2;
      
      txGroup.position.x = -halfDist;
      rxGroup.position.x = halfDist;

      for (let i = 0; i < TOTAL_BEAMS; i++) {
        const radiusAtRx = 0.6 + i * 0.5 + (distance * 0.05); // Divergence effect
        const beamGeo = new THREE.CylinderGeometry(radiusAtRx, 0.5 + i * 0.4, visualDist, 64, 1, true);
        const beamMat = new THREE.ShaderMaterial({
          vertexShader: beamVertexShader,
          fragmentShader: beamFragmentShader,
          uniforms: {
            color: { value: new THREE.Color(BEAM_COLORS[i]) },
            opacity: { value: 0.4 },
            time: { value: 0.0 },
            pulseSpeed: { value: 2.0 + i }
          },
          transparent: true,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.rotation.z = Math.PI / 2;
        beam.userData = { id: i, baseOpacity: 0.4 };
        beamsGroup.add(beam);
      }
    };

    updateBeams();

    // Weather
    const updateWeather = () => {
      if (particlesRef.current) scene.remove(particlesRef.current);
      const config = WEATHER_CONFIGS[weather];
      if (weather === WeatherType.CLEAR) return;

      const count = 10000;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 100;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color: config.particleColor,
        size: weather === WeatherType.FOG ? 0.4 : 0.08,
        transparent: true,
        opacity: config.intensity * 0.6,
        depthWrite: false
      });
      const p = new THREE.Points(geo, mat);
      particlesRef.current = p;
      scene.add(p);
    };
    updateWeather();

    const onMouseMove = (event: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    let frame = 0;
    const animate = () => {
      frame += 0.01;
      requestAnimationFrame(animate);
      controls.update();
      
      beamsGroup.children.forEach((b: any) => {
        if (b.material && b.material.uniforms) {
          b.material.uniforms.time.value = frame;
        }
      });

      if (particlesRef.current) {
        const pArr = particlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < pArr.length / 3; i++) {
          if (weather === WeatherType.RAIN) {
            pArr[i * 3 + 1] -= 0.4;
            if (pArr[i * 3 + 1] < -15) pArr[i * 3 + 1] = 15;
          } else {
            pArr[i * 3] += Math.sin(frame + i) * 0.005;
          }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Sync state changes to scene
  useEffect(() => {
    if (!beamsGroupRef.current) return;
    const visualDist = getVisualDistance(distance);
    const halfDist = visualDist / 2;
    
    if (txGroupRef.current) txGroupRef.current.position.x = -halfDist;
    if (rxGroupRef.current) rxGroupRef.current.position.x = halfDist;

    const config = WEATHER_CONFIGS[weather];
    const weatherFactor = 1.0 - (config.intensity * 0.9);

    beamsGroupRef.current.children.forEach((b: any, i: number) => {
      const radiusAtRx = 0.6 + i * 0.5 + (distance * 0.08); // Divergence effect
      const radiusAtTx = 0.5 + i * 0.4;
      b.geometry.dispose();
      b.geometry = new THREE.CylinderGeometry(radiusAtRx, radiusAtTx, visualDist, 64, 1, true);
      if (b.material && b.material.uniforms) {
        b.material.uniforms.opacity.value = 0.4 * weatherFactor;
      }
    });

    // Re-trigger weather creation for particle changes
    if (sceneRef.current) {
      if (particlesRef.current) sceneRef.current.remove(particlesRef.current);
      if (weather !== WeatherType.CLEAR) {
        const count = 10000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          pos[i * 3] = (Math.random() - 0.5) * 100;
          pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
          color: config.particleColor,
          size: weather === WeatherType.FOG ? 0.4 : 0.08,
          transparent: true,
          opacity: config.intensity * 0.6,
          depthWrite: false
        });
        const p = new THREE.Points(geo, mat);
        particlesRef.current = p;
        sceneRef.current.add(p);
      }
    }
  }, [distance, weather]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default SimulationScene;
