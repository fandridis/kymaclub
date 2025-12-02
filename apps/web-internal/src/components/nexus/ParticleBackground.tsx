import { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    color: string;
}

export function ParticleBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const updateCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        updateCanvasSize();

        const particles: Particle[] = [];
        const particleCount = 80;

        // Create particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                color: `rgba(${Math.floor(Math.random() * 50) + 100}, ${Math.floor(Math.random() * 50) + 180}, ${Math.floor(Math.random() * 30) + 220}, ${Math.random() * 0.4 + 0.1})`,
            });
        }

        let animationId: number;

        function animate() {
            if (!ctx || !canvas) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const particle of particles) {
                // Update position
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // Wrap around edges
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.y > canvas.height) particle.y = 0;
                if (particle.y < 0) particle.y = canvas.height;

                // Draw particle
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw connections between nearby particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 120) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(100, 200, 255, ${0.08 * (1 - distance / 120)})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            animationId = requestAnimationFrame(animate);
        }

        animate();

        const handleResize = () => {
            updateCanvasSize();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full opacity-40 pointer-events-none"
            style={{ zIndex: 0 }}
        />
    );
}

