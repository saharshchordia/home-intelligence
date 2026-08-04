"use client";

import { Box, Focus, Home, Layers3, Rotate3D } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { modelModes, roomZones, type ModelMode } from "../../lib/model-layout";
import type { SpatialZone } from "../../lib/twin-data";

export type ModelPin = {
  id: string;
  entityId?: string | null;
  assertionId?: string;
  label: string;
  count: number;
  severity: "maintenance" | "recommendation" | "safety";
  mode: ModelMode;
  position: [number, number, number];
  kind?: "entity" | "evidence";
};

type HouseModelProps = {
  mode: ModelMode;
  pins: ModelPin[];
  zones: SpatialZone[];
  showZones: boolean;
  placementAssertionId?: string | null;
  selectedEntityId: string;
  onModeChange(mode: ModelMode): void;
  onSelectEntity(entityId: string): void;
  onSelectPin(pin: ModelPin): void;
  onPlaceEvidence?(placement: { mode: ModelMode; position: [number, number, number]; entityId?: string | null; zoneId?: string | null }): void;
};

const toneColors = {
  living: 0xc9d9c8,
  service: 0xd8c9ac,
  sleeping: 0xc7d3df,
  circulation: 0xe2ddd2,
  utility: 0xc8c5bd,
};

const cameraViews: Record<ModelMode, { position: [number, number, number]; target: [number, number, number] }> = {
  exterior: { position: [68, 45, 73], target: [0, 6, 0] },
  first: { position: [39, 54, 45], target: [0, 0, 0] },
  second: { position: [34, 48, 38], target: [0, 0, 2] },
  lower: { position: [39, 48, 45], target: [0, 0, 0] },
  garage: { position: [25, 25, 27], target: [0, 0, 0] },
};

function applyCameraView(camera: THREE.PerspectiveCamera, controls: OrbitControls, mode: ModelMode) {
  const view = cameraViews[mode];
  const distanceScale = camera.aspect < 0.8 ? Math.min(2.6, 1.24 / camera.aspect) : 1;
  camera.position.set(
    view.target[0] + (view.position[0] - view.target[0]) * distanceScale,
    view.target[1] + (view.position[1] - view.target[1]) * distanceScale,
    view.target[2] + (view.position[2] - view.target[2]) * distanceScale,
  );
  controls.target.set(...view.target);
  controls.update();
}

function addEdges(mesh: THREE.Mesh, color = 0x6c746e) {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 }),
  );
  mesh.add(edges);
}

function labelSprite(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(255,255,255,.92)";
  context.roundRect(12, 18, 488, 92, 16);
  context.fill();
  context.strokeStyle = "rgba(37,52,44,.2)";
  context.stroke();
  context.fillStyle = "#26342d";
  context.font = "600 34px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 256, 65, 452);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(9.5, 2.4, 1);
  sprite.renderOrder = 10;
  return sprite;
}

function roomGroup(mode: Exclude<ModelMode, "exterior">) {
  const group = new THREE.Group();
  group.name = `${mode}-rooms`;
  const zones = roomZones.filter((zone) => zone.mode === mode);
  for (const zone of zones) {
    const geometry = new THREE.BoxGeometry(zone.width, 0.72, zone.depth);
    const material = new THREE.MeshStandardMaterial({
      color: toneColors[zone.tone],
      roughness: 0.82,
      metalness: 0,
      emissive: 0x000000,
    });
    const room = new THREE.Mesh(geometry, material);
    room.position.set(zone.x, 0.35, zone.z);
    room.receiveShadow = true;
    room.userData.entityId = zone.entityId;
    room.userData.baseColor = toneColors[zone.tone];
    room.userData.clickable = true;
    addEdges(room);
    const sprite = labelSprite(zone.label);
    if (sprite) {
      sprite.position.set(0, 1.4, 0);
      room.add(sprite);
    }
    group.add(room);
  }
  return group;
}

function roofPlane(width: number, depth: number, x: number, y: number, z: number, angle: number) {
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.6, depth),
    new THREE.MeshStandardMaterial({ color: 0x343836, roughness: 0.92 }),
  );
  roof.position.set(x, y, z);
  roof.rotation.z = angle;
  roof.castShadow = true;
  return roof;
}

function buildExterior() {
  const group = new THREE.Group();
  group.name = "exterior";
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xe7e7df, roughness: 0.92 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xf8f7f0, roughness: 0.78 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x26342d, roughness: 0.7 });
  const first = new THREE.Mesh(new THREE.BoxGeometry(36, 9.5, 52.5), wallMaterial);
  first.position.y = 4.75;
  first.castShadow = true;
  first.receiveShadow = true;
  first.userData.entityId = "home";
  first.userData.clickable = true;
  addEdges(first, 0x8b918c);
  group.add(first);

  const secondStem = new THREE.Mesh(new THREE.BoxGeometry(15, 7.5, 25.5), wallMaterial);
  secondStem.position.set(0, 12.75, -5);
  secondStem.castShadow = true;
  const secondCross = new THREE.Mesh(new THREE.BoxGeometry(31, 7.5, 12), wallMaterial);
  secondCross.position.set(0, 12.75, 12.5);
  secondCross.castShadow = true;
  group.add(secondStem, secondCross);

  group.add(
    roofPlane(24, 55, -8.3, 12.9, 0, Math.PI / 5.5),
    roofPlane(24, 55, 8.3, 12.9, 0, -Math.PI / 5.5),
    roofPlane(13, 28, -4.6, 20.3, -5, Math.PI / 4.8),
    roofPlane(13, 28, 4.6, 20.3, -5, -Math.PI / 4.8),
  );

  const door = new THREE.Mesh(new THREE.BoxGeometry(4.2, 7.2, 0.35), darkMaterial);
  door.position.set(-11, 3.7, 26.42);
  group.add(door);
  for (const x of [-2, 7, 13]) {
    const window = new THREE.Mesh(new THREE.BoxGeometry(4.5, 4.2, 0.28), trimMaterial);
    window.position.set(x, 5.1, 26.45);
    group.add(window);
  }

  const chimney = new THREE.Mesh(new THREE.BoxGeometry(4, 13, 4), new THREE.MeshStandardMaterial({ color: 0xb8aba0, roughness: 1 }));
  chimney.position.set(-7, 18, -9);
  chimney.castShadow = true;
  group.add(chimney);

  const garage = new THREE.Mesh(new THREE.BoxGeometry(11, 7, 19), wallMaterial);
  garage.position.set(28, 3.5, 4);
  garage.userData.entityId = "garage";
  garage.userData.clickable = true;
  garage.castShadow = true;
  addEdges(garage);
  group.add(garage, roofPlane(8, 20, 25.3, 9, 4, Math.PI / 5), roofPlane(8, 20, 30.7, 9, 4, -Math.PI / 5));

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(115, 130),
    new THREE.MeshStandardMaterial({ color: 0x718165, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  ground.receiveShadow = true;
  group.add(ground);

  const driveway = new THREE.Mesh(
    new THREE.PlaneGeometry(13, 74),
    new THREE.MeshStandardMaterial({ color: 0x8b8580, roughness: 1 }),
  );
  driveway.rotation.x = -Math.PI / 2;
  driveway.position.set(27, 0.02, 22);
  group.add(driveway);
  return group;
}

function zoneMesh(zone: SpatialZone) {
  const geometry = new THREE.BoxGeometry(zone.width, Math.max(zone.height, 0.08), zone.depth);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(zone.color),
    transparent: true,
    opacity: zone.mode === "exterior" ? 0.34 : 0.22,
    roughness: 0.7,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(zone.x, zone.y, zone.z);
  mesh.userData.entityId = zone.entityId;
  mesh.userData.zoneId = zone.id;
  mesh.userData.clickable = true;
  mesh.userData.spatialZone = true;
  addEdges(mesh, 0x214c3c);
  const sprite = labelSprite(zone.name);
  if (sprite) {
    sprite.position.set(0, Math.max(zone.height / 2 + 1.2, 1.3), 0);
    mesh.add(sprite);
  }
  return mesh;
}

function buildGaragePlan() {
  const group = roomGroup("garage");
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(8.5, 0.35, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x59655d }),
  );
  door.position.set(0, 0.6, 9.2);
  group.add(door);
  return group;
}

export default function HouseModel({ mode, pins, zones, showZones, placementAssertionId, selectedEntityId, onModeChange, onSelectEntity, onSelectPin, onPlaceEvidence }: HouseModelProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const pinLayerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const groupsRef = useRef<Record<ModelMode, THREE.Group> | null>(null);
  const zoneGroupsRef = useRef<Record<ModelMode, THREE.Group> | null>(null);
  const modeRef = useRef(mode);
  const pinsRef = useRef(pins);
  const zonesRef = useRef(zones);
  const showZonesRef = useRef(showZones);
  const placementAssertionIdRef = useRef(placementAssertionId);
  const onPlaceEvidenceRef = useRef(onPlaceEvidence);
  const selectedRef = useRef(selectedEntityId);
  const onSelectEntityRef = useRef(onSelectEntity);
  const visiblePins = useMemo(() => pins.filter((pin) => pin.mode === mode), [mode, pins]);

  useEffect(() => { pinsRef.current = pins; }, [pins]);
  useEffect(() => { zonesRef.current = zones; }, [zones]);
  useEffect(() => { showZonesRef.current = showZones; }, [showZones]);
  useEffect(() => { placementAssertionIdRef.current = placementAssertionId; }, [placementAssertionId]);
  useEffect(() => { onPlaceEvidenceRef.current = onPlaceEvidence; }, [onPlaceEvidence]);
  useEffect(() => { onSelectEntityRef.current = onSelectEntity; }, [onSelectEntity]);

  useEffect(() => {
    selectedRef.current = selectedEntityId;
    const scene = sceneRef.current;
    if (!scene) return;
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !object.userData.clickable || !(object.material instanceof THREE.MeshStandardMaterial)) return;
      object.material.emissive.setHex(object.userData.entityId === selectedEntityId ? 0x315f49 : 0x000000);
      object.material.emissiveIntensity = object.userData.entityId === selectedEntityId ? 0.22 : 0;
    });
  }, [selectedEntityId]);

  useEffect(() => {
    modeRef.current = mode;
    const groups = groupsRef.current;
    const zoneGroups = zoneGroupsRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!groups || !camera || !controls) return;
    for (const [id, group] of Object.entries(groups)) group.visible = id === mode;
    if (zoneGroups) for (const [id, group] of Object.entries(zoneGroups)) group.visible = id === mode && showZonesRef.current;
    applyCameraView(camera, controls, mode);
  }, [mode]);

  useEffect(() => {
    const zoneGroups = zoneGroupsRef.current;
    if (!zoneGroups) return;
    for (const [id, group] of Object.entries(zoneGroups)) group.visible = id === modeRef.current && showZones;
  }, [showZones]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe9ece7);
    scene.fog = new THREE.Fog(0xe9ece7, 180, 360);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 350);
    const initialView = cameraViews[modeRef.current];
    camera.position.set(...initialView.position);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.minDistance = 18;
    controls.maxDistance = 300;
    controls.maxPolarAngle = Math.PI / 2.03;
    controls.target.set(...initialView.target);
    controls.update();

    scene.add(new THREE.HemisphereLight(0xf7f4e9, 0x48544b, 2.1));
    const sun = new THREE.DirectionalLight(0xfff2d8, 3.2);
    sun.position.set(-35, 65, 42);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -70;
    sun.shadow.camera.right = 70;
    sun.shadow.camera.top = 70;
    sun.shadow.camera.bottom = -70;
    scene.add(sun);

    const groups: Record<ModelMode, THREE.Group> = {
      exterior: buildExterior(),
      first: roomGroup("first"),
      second: roomGroup("second"),
      lower: roomGroup("lower"),
      garage: buildGaragePlan(),
    };
    const zoneGroups: Record<ModelMode, THREE.Group> = {
      exterior: new THREE.Group(),
      first: new THREE.Group(),
      second: new THREE.Group(),
      lower: new THREE.Group(),
      garage: new THREE.Group(),
    };
    for (const zone of zonesRef.current) zoneGroups[zone.mode].add(zoneMesh(zone));
    for (const [id, group] of Object.entries(groups)) {
      group.visible = id === modeRef.current;
      scene.add(group);
    }
    for (const [id, group] of Object.entries(zoneGroups)) {
      group.name = `${id}-zones`;
      group.visible = id === modeRef.current && showZonesRef.current;
      scene.add(group);
    }
    sceneRef.current = scene;
    cameraRef.current = camera;
    controlsRef.current = controls;
    groupsRef.current = groups;
    zoneGroupsRef.current = zoneGroups;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerStart = { x: 0, y: 0 };
    const setPointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    const intersections = (event: PointerEvent) => {
      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(scene.children, true).filter((hit) => hit.object.userData.clickable);
    };
    const onPointerDown = (event: PointerEvent) => { pointerStart = { x: event.clientX, y: event.clientY }; };
    const onPointerUp = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5) return;
      const hit = intersections(event)[0];
      if (placementAssertionIdRef.current && hit) {
        const point = hit.point;
        onPlaceEvidenceRef.current?.({
          mode: modeRef.current,
          position: [Number(point.x.toFixed(2)), Number(point.y.toFixed(2)), Number(point.z.toFixed(2))],
          entityId: hit.object.userData.entityId ?? null,
          zoneId: hit.object.userData.zoneId ?? null,
        });
        return;
      }
      const entityId = hit?.object.userData.entityId;
      if (entityId) onSelectEntityRef.current(entityId);
    };
    const onPointerMove = (event: PointerEvent) => {
      renderer.domElement.style.cursor = intersections(event).length > 0 ? "pointer" : "grab";
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointermove", onPointerMove, { passive: true });

    const resize = () => {
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      applyCameraView(camera, controls, modeRef.current);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const projected = new THREE.Vector3();
    let frame = 0;
    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      const layer = pinLayerRef.current;
      if (layer) {
        const rect = renderer.domElement.getBoundingClientRect();
        for (const pin of pinsRef.current) {
          const element = layer.querySelector<HTMLElement>(`[data-pin-id="${pin.id}"]`);
          if (!element || pin.mode !== modeRef.current) continue;
          projected.set(...pin.position).project(camera);
          const visible = projected.z > -1 && projected.z < 1;
          element.style.display = visible ? "grid" : "none";
          if (visible) element.style.transform = `translate3d(${(projected.x * 0.5 + 0.5) * rect.width}px, ${(-projected.y * 0.5 + 0.5) * rect.height}px, 0) translate(-50%, -50%)`;
        }
      }
      frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) object.geometry.dispose();
        const material = "material" in object ? object.material : null;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else if (material instanceof THREE.Material) material.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      groupsRef.current = null;
      zoneGroupsRef.current = null;
    };
  }, []);

  return (
    <div className="house-model-shell">
      <div ref={mountRef} className="house-canvas" aria-label="Interactive three-dimensional model of the home" />
      <div ref={pinLayerRef} className="model-pin-layer">
        {visiblePins.map((pin) => (
          <button
            key={pin.id}
            data-pin-id={pin.id}
            className={`model-pin ${pin.severity} ${pin.kind === "evidence" ? "evidence-pin" : ""}`}
            aria-label={pin.kind === "evidence" ? `Evidence pin for ${pin.label}` : `${pin.count} accepted ${pin.count === 1 ? "finding" : "findings"} at ${pin.label}`}
            title={pin.label}
            onClick={() => onSelectPin(pin)}
          >
            <span>{pin.kind === "evidence" ? "•" : pin.count}</span>
          </button>
        ))}
      </div>
      <div className="model-toolbar" aria-label="Model level">
        {modelModes.map((item) => (
          <button key={item.id} className={mode === item.id ? "active" : ""} onClick={() => onModeChange(item.id)}>
            {item.id === "exterior" ? <Home size={15} /> : item.id === "garage" ? <Box size={15} /> : <Layers3 size={15} />}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <div className="model-status"><Focus size={14} /> {placementAssertionId ? "Click the model to place evidence" : showZones ? "Spatial zones visible" : "Report-derived geometry"}</div>
      <div className="orbit-status" aria-hidden="true"><Rotate3D size={14} /></div>
    </div>
  );
}
