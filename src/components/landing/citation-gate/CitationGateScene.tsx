'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { SlipItem } from './CitationGate2D';
import { resolveCanonicalId, isValidCitationId } from '@/lib/citations';

// Grouping 28 statutory corpus sections across 4 Acts
const CABINET_ACT_ROWS = [
  { act: 'Registration Act, 1908', count: 8, prefix: 'reg_act_1908' },
  { act: 'Transfer of Property Act, 1882', count: 8, prefix: 'tpa_1882' },
  { act: 'Land Crime Prevention & Remedy Act, 2023', count: 7, prefix: 'lcpra_2023' },
  { act: 'NID Registration Rules', count: 5, prefix: 'nidw_rules' },
];

export interface CitationGateSceneProps {
  slips: SlipItem[];
  isRunning: boolean;
  onSequenceComplete: (verifiedCount: number, strippedCount: number) => void;
  onSelectSlip: (slip: SlipItem) => void;
  onLogEntry: (id: string, reason: string) => void;
  onAnnounce: (message: string) => void;
  hoveredSlipId: string | null;
  setHoveredSlipId: (id: string | null) => void;
}

export function CitationGateScene({
  slips,
  isRunning,
  onSequenceComplete,
  onSelectSlip,
  onLogEntry,
  onAnnounce,
  hoveredSlipId,
  setHoveredSlipId,
}: CitationGateSceneProps) {
  // Sequence runtime state
  const [activeSlipIdx, setActiveSlipIdx] = useState<number | null>(null);
  const [subPhase, setSubPhase] = useState<'idle' | 'feed' | 'lookup' | 'stamp' | 'discharge'>('idle');
  const [activeDrawer, setActiveDrawer] = useState<{ row: number; col: number } | null>(null);
  const [twitchDrawers, setTwitchDrawers] = useState<{ row: number; col: number }[]>([]);
  const [stampDown, setStampDown] = useState(false);
  const [stampType, setStampType] = useState<'verified' | 'fake' | null>(null);

  // Animation timing refs
  const sequenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const cameraShake = useRef(0);

  // Track pointer for gentle 3-degree parallax
  useEffect(() => {
    const onPointerMove = (e: MouseEvent) => {
      mousePos.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    return () => window.removeEventListener('mousemove', onPointerMove);
  }, []);

  // Run sequence controller
  useEffect(() => {
    if (!isRunning) {
      const resetTimer = setTimeout(() => {
        setActiveSlipIdx(null);
        setSubPhase('idle');
        setActiveDrawer(null);
        setTwitchDrawers([]);
        setStampDown(false);
        setStampType(null);
      }, 0);
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
      return () => clearTimeout(resetTimer);
    }

    let currentIndex = 0;
    let localVerified = 0;
    let localStripped = 0;

    function processNextSlip() {
      if (currentIndex >= slips.length) {
        setSubPhase('idle');
        setActiveSlipIdx(null);
        onSequenceComplete(localVerified, localStripped);
        return;
      }

      const slip = slips[currentIndex];
      const canonical = resolveCanonicalId(slip.id);
      const isVerified = isValidCitationId(canonical);

      setActiveSlipIdx(currentIndex);
      setSubPhase('feed');

      // Find matching drawer in the cabinet
      let matchRow = -1;
      let matchCol = -1;
      if (isVerified) {
        if (canonical.includes('reg_act_1908')) matchRow = 0;
        else if (canonical.includes('tpa_1882')) matchRow = 1;
        else if (canonical.includes('lcpra_2023')) matchRow = 2;
        else if (canonical.includes('nidw_rules')) matchRow = 3;

        matchCol = Math.abs(canonical.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % (CABINET_ACT_ROWS[matchRow]?.count || 6);
      }

      // Step 1: Slip feeds into the Gate (~800ms)
      sequenceTimerRef.current = setTimeout(() => {
        setSubPhase('lookup');

        if (isVerified) {
          setActiveDrawer({ row: matchRow, col: matchCol });
        } else {
          // Twitch multiple drawers in search
          setTwitchDrawers([
            { row: 0, col: 2 },
            { row: 1, col: 4 },
            { row: 2, col: 1 },
          ]);
        }

        // Step 2: Cabinet search completes & stamp descends (~900ms)
        sequenceTimerRef.current = setTimeout(() => {
          setActiveDrawer(null);
          setTwitchDrawers([]);
          setSubPhase('stamp');
          setStampDown(true);
          setStampType(isVerified ? 'verified' : 'fake');
          cameraShake.current = 0.04;

          // Step 3: Stamp lifts and slip discharges / shreds (~700ms)
          sequenceTimerRef.current = setTimeout(() => {
            setStampDown(false);
            setSubPhase('discharge');

            if (isVerified) {
              slip.status = 'verified';
              localVerified++;
              onAnnounce(`${slip.id} verified: matches corpus`);
            } else {
              slip.status = 'stripped';
              localStripped++;
              onLogEntry(slip.id, 'not found in laws_corpus.json');
              onAnnounce(`${slip.id} removed: not found in corpus`);
            }

            // Step 4: Advance to next slip (~800ms)
            sequenceTimerRef.current = setTimeout(() => {
              currentIndex++;
              processNextSlip();
            }, 800);
          }, 700);
        }, 900);
      }, 800);
    }

    processNextSlip();

    return () => {
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
    };
  }, [isRunning, slips, onSequenceComplete, onLogEntry, onAnnounce]);

  // Frame loop for camera micro-parallax and shake
  useFrame((state, delta) => {
    // Damp camera shake
    if (cameraShake.current > 0.001) {
      cameraShake.current = THREE.MathUtils.lerp(cameraShake.current, 0, delta * 12);
    } else {
      cameraShake.current = 0;
    }

    // Gentle 3-degree mouse parallax
    const targetX = mousePos.current.x * 0.25;
    const targetY = 2.2 + mousePos.current.y * 0.18 + cameraShake.current;
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, delta * 4);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, delta * 4);
    state.camera.lookAt(0, 0.4, 0);
  });

  return (
    <group position={[0, -0.2, 0]}>
      {/* ── 1. LIGHTING RIG ── */}
      <ambientLight intensity={0.52} color="#fbf7ee" />

      {/* Main warm brass spotlight */}
      <directionalLight
        position={[3.5, 6, 4]}
        intensity={1.8}
        color="#fff4e0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
      />

      {/* Soft cool fill from opposite side */}
      <directionalLight position={[-4, 3, 2]} intensity={0.4} color="#dbe5e8" />

      {/* Spotlamp above the cabinet that focuses during lookup */}
      <spotLight
        position={[0, 4.2, -0.6]}
        target-position={[0, 1.2, -1.8]}
        intensity={activeDrawer ? 3.5 : 0.8}
        color="#ffdd99"
        angle={0.65}
        penumbra={0.6}
      />

      {/* ── 2. DESK FOUNDATION / TABLETOP ── */}
      <mesh position={[0, -1.35, 0]} receiveShadow>
        <boxGeometry args={[8.5, 0.3, 5]} />
        <meshStandardMaterial color="#2d2219" roughness={0.7} />
      </mesh>

      {/* ── 3. CARD-CATALOG WOODEN CABINET (THE CORPUS) ── */}
      <group position={[0, 1.1, -1.8]}>
        {/* Main Cabinet Outer Casing */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[4.8, 2.4, 0.8]} />
          <meshStandardMaterial color="#3a271d" roughness={0.65} />
        </mesh>

        {/* Cabinet Header Arch Plate */}
        <mesh position={[0, 1.3, 0.42]}>
          <boxGeometry args={[3.6, 0.22, 0.04]} />
          <meshStandardMaterial color="#b08d57" metalness={0.8} roughness={0.3} />
        </mesh>
        <Text
          position={[0, 1.3, 0.45]}
          fontSize={0.095}
          color="#1a1a18"
          anchorX="center"
          anchorY="middle"
        >
          BANGLADESH STATUTORY CORPUS • 28 SECTIONS
        </Text>

        {/* 28 Drawers Across 4 Act Rows */}
        {CABINET_ACT_ROWS.map((rowDef, rowIdx) => {
          const rowY = 0.72 - rowIdx * 0.52;
          const colSpacing = 4.2 / rowDef.count;

          return (
            <group key={rowIdx} position={[0, rowY, 0]}>
              {/* Row Label Ribbon */}
              <Text
                position={[-2.1, 0.18, 0.42]}
                fontSize={0.065}
                color="#d4b483"
                anchorX="left"
                anchorY="middle"
              >
                {rowDef.act}
              </Text>

              {/* Individual Drawers */}
              {Array.from({ length: rowDef.count }).map((_, colIdx) => {
                const colX = -2.1 + colSpacing * (colIdx + 0.5);
                const isSelected = activeDrawer?.row === rowIdx && activeDrawer?.col === colIdx;
                const isTwitching = twitchDrawers.some((t) => t.row === rowIdx && t.col === colIdx);
                const pullOutZ = isSelected ? 0.42 : isTwitching ? 0.18 : 0;

                return (
                  <group key={colIdx} position={[colX, 0, 0.4 + pullOutZ]}>
                    {/* Drawer Front Face */}
                    <RoundedBox
                      args={[colSpacing * 0.86, 0.32, 0.08]}
                      radius={0.015}
                      smoothness={4}
                      castShadow
                      receiveShadow
                    >
                      <meshStandardMaterial
                        color={isSelected ? '#543d2b' : '#332015'}
                        roughness={0.6}
                      />
                    </RoundedBox>

                    {/* Brass Label Holder Plate */}
                    <mesh position={[0, 0.02, 0.045]}>
                      <planeGeometry args={[colSpacing * 0.65, 0.16]} />
                      <meshStandardMaterial color="#b08d57" metalness={0.85} roughness={0.3} />
                    </mesh>

                    {/* Paper Label inside Holder */}
                    <mesh position={[0, 0.02, 0.046]}>
                      <planeGeometry args={[colSpacing * 0.55, 0.1]} />
                      <meshStandardMaterial color="#f7f2e7" roughness={0.8} />
                    </mesh>

                    {/* Brass Pull Handle */}
                    <mesh position={[0, -0.07, 0.06]}>
                      <boxGeometry args={[0.08, 0.03, 0.04]} />
                      <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.25} />
                    </mesh>
                  </group>
                );
              })}
            </group>
          );
        })}
      </group>

      {/* ── 4. LEFT INPUT TRAY (FRESH CITATION SLIPS) ── */}
      <group position={[-2.2, -0.5, 0.4]}>
        {/* Tray Box */}
        <mesh receiveShadow>
          <boxGeometry args={[1.5, 0.12, 1.8]} />
          <meshStandardMaterial color="#4a3728" roughness={0.7} />
        </mesh>
        {/* Tray Brass Edge Trim */}
        <mesh position={[0, 0.06, 0.9]}>
          <boxGeometry args={[1.52, 0.04, 0.04]} />
          <meshStandardMaterial color="#b08d57" metalness={0.85} roughness={0.3} />
        </mesh>
        <Text
          position={[0, 0.08, 0.95]}
          fontSize={0.07}
          color="#d4b483"
          anchorX="center"
          anchorY="middle"
        >
          INPUT SLIPS
        </Text>
      </group>

      {/* ── 5. THE BRASS GATE (CHECKPOINT SCANNER) ── */}
      <group position={[0, -0.2, 0.4]}>
        {/* Left Pillar */}
        <mesh position={[-0.85, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.14, 1.2, 0.2]} />
          <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.25} />
        </mesh>

        {/* Right Pillar */}
        <mesh position={[0.85, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.14, 1.2, 0.2]} />
          <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.25} />
        </mesh>

        {/* Top Arch Beam */}
        <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.84, 0.18, 0.22]} />
          <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.25} />
        </mesh>

        {/* Gate Name Inscription */}
        <Text
          position={[0, 1.05, 0.12]}
          fontSize={0.075}
          color="#1a1a18"
          anchorX="center"
          anchorY="middle"
        >
          STATUTORY GATEKEEPER
        </Text>

        {/* Scan line laser emitter (Activates during lookup) */}
        <mesh position={[0, 0.94, 0]}>
          <boxGeometry args={[1.5, 0.02, 0.04]} />
          <meshBasicMaterial
            color={subPhase === 'lookup' ? '#40916c' : '#b08d57'}
            transparent
            opacity={subPhase === 'lookup' ? 0.95 : 0.3}
          />
        </mesh>

        {/* Vertical Reader Scan Beam (Active during lookup) */}
        {subPhase === 'lookup' && (
          <mesh position={[0, 0.45, 0]}>
            <planeGeometry args={[1.4, 0.95]} />
            <meshBasicMaterial
              color="#40916c"
              transparent
              opacity={0.18}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* Shredder Slot In Floor */}
        <mesh position={[0, -0.32, 0]}>
          <boxGeometry args={[1.2, 0.04, 0.16]} />
          <meshStandardMaterial color="#1a1a18" roughness={0.9} />
        </mesh>
      </group>

      {/* ── 6. OVERHEAD STAMP MECHANISM ── */}
      <group position={[0, stampDown ? 0.22 : 1.45, 0.4]}>
        {/* Stamp Plunger Arm */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.8, 16]} />
          <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Brass Stamp Head */}
        <mesh castShadow>
          <cylinderGeometry args={[0.22, 0.24, 0.12, 24]} />
          <meshStandardMaterial color="#b08d57" metalness={0.88} roughness={0.25} />
        </mesh>
      </group>

      {/* ── 7. RIGHT GREEN-FELT TRAY (VERIFIED SLIPS) ── */}
      <group position={[2.2, -0.5, 0.4]}>
        {/* Wooden Tray Foundation */}
        <mesh receiveShadow>
          <boxGeometry args={[1.5, 0.12, 1.8]} />
          <meshStandardMaterial color="#4a3728" roughness={0.7} />
        </mesh>

        {/* Bottle Green Felt Inset Liner */}
        <mesh position={[0, 0.065, 0]} receiveShadow>
          <boxGeometry args={[1.38, 0.02, 1.68]} />
          <meshStandardMaterial color="#1b4332" roughness={0.95} />
        </mesh>

        {/* Tray Brass Inscription */}
        <mesh position={[0, 0.06, 0.9]}>
          <boxGeometry args={[1.52, 0.04, 0.04]} />
          <meshStandardMaterial color="#b08d57" metalness={0.85} roughness={0.3} />
        </mesh>
        <Text
          position={[0, 0.08, 0.95]}
          fontSize={0.07}
          color="#d4b483"
          anchorX="center"
          anchorY="middle"
        >
          VERIFIED ARCHIVE
        </Text>
      </group>

      {/* ── 8. BRASS SCRAP BIN (FOR DISCARDED SHREDDED SLIPS) ── */}
      <group position={[0, -0.95, 0.4]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.3, 0.6, 0.6]} />
          <meshStandardMaterial color="#8a6c38" metalness={0.85} roughness={0.35} />
        </mesh>
        {/* Bin Front Label */}
        <Text
          position={[0, 0.05, 0.31]}
          fontSize={0.065}
          color="#1a1a18"
          anchorX="center"
          anchorY="middle"
        >
          UNVERIFIED DISCARD BIN
        </Text>
      </group>

      {/* ── 9. CITATION PAPER SLIPS (ANIMATING OR RESTING) ── */}
      {slips.map((slip, idx) => {
        const isCurrent = activeSlipIdx === idx;
        const isVerified = slip.status === 'verified';
        const isStripped = slip.status === 'stripped';
        const isHovered = hoveredSlipId === slip.id;

        // Position calculation based on status and sequence phase
        let posX = -2.2;
        let posY = -0.42 + idx * 0.035;
        let posZ = 0.4 + idx * 0.08;
        let rotY = 0;
        const rotZ = 0;

        if (isCurrent) {
          if (subPhase === 'feed') {
            posX = -0.6;
            posY = -0.36;
            posZ = 0.4;
          } else if (subPhase === 'lookup' || subPhase === 'stamp') {
            posX = 0;
            posY = -0.36;
            posZ = 0.4;
          } else if (subPhase === 'discharge') {
            if (isVerified) {
              posX = 1.4;
              posY = -0.4;
              posZ = 0.4;
            } else {
              posX = 0;
              posY = -0.7;
              posZ = 0.4;
            }
          }
        } else if (isVerified) {
          // Settled in green felt tray
          posX = 2.2;
          posY = -0.42 + (idx % 3) * 0.025;
          posZ = 0.35 + (idx % 3) * 0.12;
          rotY = (idx % 2 === 0 ? 0.05 : -0.05);
        } else if (isStripped) {
          // Shredded inside bin
          posX = 0;
          posY = -1.1;
          posZ = 0.4;
        }

        // Lift on hover
        if (isHovered && !isRunning) {
          posY += 0.12;
        }

        // If shredded, render as physical sliced strips falling into bin
        if (isStripped || (isCurrent && subPhase === 'discharge' && !isValidCitationId(resolveCanonicalId(slip.id)))) {
          return (
            <group key={slip.id} position={[0, -0.65, 0.4]}>
              {[-0.3, -0.1, 0.1, 0.3].map((stripX, sIdx) => (
                <mesh
                  key={sIdx}
                  position={[stripX, -sIdx * 0.08, (sIdx % 2) * 0.04]}
                  rotation={[0, 0, (sIdx - 1.5) * 0.15]}
                >
                  <boxGeometry args={[0.15, 0.45, 0.005]} />
                  <meshStandardMaterial color="#f7f2e7" roughness={0.8} />
                </mesh>
              ))}
            </group>
          );
        }

        return (
          <group
            key={slip.id}
            position={[posX, posY, posZ]}
            rotation={[0, rotY, rotZ]}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredSlipId(slip.id);
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              setHoveredSlipId(null);
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isVerified) {
                onSelectSlip(slip);
              }
            }}
          >
            {/* Paper Slip Body */}
            <RoundedBox
              args={[1.05, 0.38, 0.015]}
              radius={0.012}
              smoothness={4}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                color={isHovered ? '#ffffff' : '#faf7f0'}
                roughness={0.78}
              />
            </RoundedBox>

            {/* Monospace Citation ID */}
            <Text
              position={[-0.45, 0.08, 0.012]}
              fontSize={0.052}
              color="#1a1a18"
              anchorX="left"
              anchorY="middle"
            >
              {slip.id}
            </Text>

            {/* Serif Section Title */}
            <Text
              position={[-0.45, -0.06, 0.012]}
              fontSize={0.042}
              color="#4a4a45"
              anchorX="left"
              anchorY="middle"
              maxWidth={0.9}
            >
              {slip.section ? `${slip.section} • ` : ''}{slip.title.length > 28 ? `${slip.title.slice(0, 26)}…` : slip.title}
            </Text>

            {/* Verified Bottle-Green Stamp Impression */}
            {isVerified && (
              <group position={[0.32, 0.02, 0.014]}>
                <mesh>
                  <circleGeometry args={[0.12, 24]} />
                  <meshBasicMaterial color="#1b4332" transparent opacity={0.88} />
                </mesh>
                <Text
                  position={[0, 0, 0.002]}
                  fontSize={0.038}
                  color="#f5f0e8"
                  anchorX="center"
                  anchorY="middle"
                >
                  VERIFIED
                </Text>
              </group>
            )}

            {/* Fake Vermillion Stamp Impression (Appears when stamped) */}
            {isCurrent && stampType === 'fake' && (
              <group position={[0.26, 0.02, 0.014]}>
                <mesh>
                  <planeGeometry args={[0.38, 0.12]} />
                  <meshBasicMaterial color="#c0392b" transparent opacity={0.92} />
                </mesh>
                <Text
                  position={[0, 0, 0.002]}
                  fontSize={0.034}
                  color="#ffffff"
                  anchorX="center"
                  anchorY="middle"
                >
                  NOT IN CORPUS
                </Text>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
}
