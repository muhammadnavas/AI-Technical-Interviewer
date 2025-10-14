import { Box, MeshDistortMaterial, OrbitControls, Sphere, Torus } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'

// Animated 3D AI Avatar
function AnimatedAIHead({ isThinking }) {
  const meshRef = useRef()
  const groupRef = useRef()
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    
    // Floating animation
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 2) * 0.1
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.1
    }
    
    // Pulsing when thinking
    if (meshRef.current && isThinking) {
      const scale = 1 + Math.sin(t * 5) * 0.05
      meshRef.current.scale.set(scale, scale, scale)
    }
  })

  return (
    <group ref={groupRef}>
      {/* Main Head */}
      <Sphere ref={meshRef} args={[1, 64, 64]} scale={1}>
        <MeshDistortMaterial
          color="#6366f1"
          attach="material"
          distort={0.3}
          speed={isThinking ? 3 : 1}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>

      {/* Eyes */}
      <Sphere position={[-0.35, 0.2, 0.8]} args={[0.15, 32, 32]}>
        <meshStandardMaterial color="#ffffff" emissive="#4f46e5" emissiveIntensity={0.5} />
      </Sphere>
      <Sphere position={[0.35, 0.2, 0.8]} args={[0.15, 32, 32]}>
        <meshStandardMaterial color="#ffffff" emissive="#4f46e5" emissiveIntensity={0.5} />
      </Sphere>

      {/* Eye Pupils */}
      <Sphere position={[-0.35, 0.2, 0.95]} args={[0.08, 32, 32]}>
        <meshStandardMaterial color="#1e1b4b" />
      </Sphere>
      <Sphere position={[0.35, 0.2, 0.95]} args={[0.08, 32, 32]}>
        <meshStandardMaterial color="#1e1b4b" />
      </Sphere>

      {/* Mouth/Speaker Grill */}
      <Box position={[0, -0.3, 0.85]} args={[0.5, 0.1, 0.05]}>
        <meshStandardMaterial color="#312e81" />
      </Box>

      {/* Antenna */}
      <Box position={[0, 1.2, 0]} args={[0.05, 0.3, 0.05]}>
        <meshStandardMaterial color="#818cf8" emissive="#6366f1" emissiveIntensity={0.5} />
      </Box>
      <Sphere position={[0, 1.4, 0]} args={[0.1, 32, 32]}>
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1} />
      </Sphere>
    </group>
  )
}

// Orbiting Particles
function OrbitingParticles() {
  const particlesRef = useRef()
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.3
    }
  })

  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < 50; i++) {
      const angle = (i / 50) * Math.PI * 2
      const radius = 2 + Math.random() * 0.5
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      const y = (Math.random() - 0.5) * 2
      temp.push({ position: [x, y, z] })
    }
    return temp
  }, [])

  return (
    <group ref={particlesRef}>
      {particles.map((particle, i) => (
        <Sphere key={i} position={particle.position} args={[0.02, 8, 8]}>
          <meshStandardMaterial color="#818cf8" emissive="#6366f1" emissiveIntensity={0.5} />
        </Sphere>
      ))}
    </group>
  )
}

// Energy Rings
function EnergyRings({ isThinking }) {
  const ring1Ref = useRef()
  const ring2Ref = useRef()
  const ring3Ref = useRef()
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.5
      ring1Ref.current.rotation.z = t * 0.3
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = -t * 0.4
      ring2Ref.current.rotation.y = t * 0.2
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y = t * 0.6
      ring3Ref.current.rotation.z = -t * 0.4
    }
  })

  return (
    <>
      <Torus ref={ring1Ref} args={[1.5, 0.02, 16, 100]}>
        <meshStandardMaterial 
          color="#a78bfa" 
          emissive="#8b5cf6" 
          emissiveIntensity={isThinking ? 1 : 0.3}
          transparent
          opacity={0.6}
        />
      </Torus>
      <Torus ref={ring2Ref} args={[1.7, 0.02, 16, 100]}>
        <meshStandardMaterial 
          color="#6366f1" 
          emissive="#4f46e5" 
          emissiveIntensity={isThinking ? 1 : 0.3}
          transparent
          opacity={0.6}
        />
      </Torus>
      <Torus ref={ring3Ref} args={[1.9, 0.02, 16, 100]}>
        <meshStandardMaterial 
          color="#818cf8" 
          emissive="#6366f1" 
          emissiveIntensity={isThinking ? 1 : 0.3}
          transparent
          opacity={0.6}
        />
      </Torus>
    </>
  )
}

// Main 3D AI Avatar Component
export default function AIAvatar3D({ isThinking = false, className = '' }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
        <spotLight position={[0, 5, 0]} intensity={0.5} angle={0.3} penumbra={1} color="#6366f1" />

        {/* 3D Elements */}
        <AnimatedAIHead isThinking={isThinking} />
        <OrbitingParticles />
        <EnergyRings isThinking={isThinking} />

        {/* Controls */}
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  )
}
