import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'

function ChunkCube({ position, isReceived, chunkIndex }) {
  const meshRef = useRef()
  const targetScale = isReceived ? 1.2 : 1
  const targetColor = isReceived ? new THREE.Color('#10b981') : new THREE.Color('#94a3b8')
  
  useFrame((state) => {
    if (meshRef.current) {
      // Smooth scale animation
      meshRef.current.scale.x += (targetScale - meshRef.current.scale.x) * 0.1
      meshRef.current.scale.y += (targetScale - meshRef.current.scale.y) * 0.1
      meshRef.current.scale.z += (targetScale - meshRef.current.scale.z) * 0.1
      
      // Smooth color transition
      meshRef.current.material.color.lerp(targetColor, 0.1)
      
      // Gentle floating animation for received chunks
      if (isReceived) {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + chunkIndex) * 0.1
      }
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial
          color={isReceived ? '#10b981' : '#94a3b8'}
          metalness={0.3}
          roughness={0.4}
          emissive={isReceived ? '#10b981' : '#000000'}
          emissiveIntensity={isReceived ? 0.2 : 0}
        />
      </mesh>
      <Text
        position={[0, 0, 0.41]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {chunkIndex + 1}
      </Text>
    </group>
  )
}

function ChunkGrid({ transfer }) {
  const chunks = useMemo(() => {
    if (!transfer) return []
    return Array.from({ length: transfer.totalChunks }, (_, i) => i)
  }, [transfer])

  const receivedSet = useMemo(() => {
    return new Set(transfer?.receivedChunks || [])
  }, [transfer])

  const gridSize = Math.ceil(Math.sqrt(chunks.length))
  
  const positions = useMemo(() => {
    return chunks.map((_, idx) => {
      const x = (idx % gridSize) - gridSize / 2
      const z = Math.floor(idx / gridSize) - gridSize / 2
      return [x * 1.2, 0, z * 1.2]
    })
  }, [chunks, gridSize])

  return (
    <group>
      {chunks.map((chunkIndex, idx) => (
        <ChunkCube
          key={chunkIndex}
          position={positions[idx]}
          isReceived={receivedSet.has(chunkIndex)}
          chunkIndex={chunkIndex}
          totalChunks={chunks.length}
        />
      ))}
    </group>
  )
}

export default function ThreeDChunkVisualizer({ transfer }) {
  if (!transfer) return null

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden bg-gray-900/10 backdrop-blur-sm border border-white/20">
      <Canvas camera={{ position: [8, 8, 8], fov: 50 }}>
        <color attach="background" args={['#0f172a']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
        <ChunkGrid transfer={transfer} />
        <OrbitControls 
          enablePan={false}
          minDistance={5}
          maxDistance={20}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  )
}
