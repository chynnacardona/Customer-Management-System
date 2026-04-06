import { useEffect, useRef } from 'react';

function ParticlesBg() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles = [];
    const particleCount = 70; // Saktong dami lang para hindi masapawan ang clouds mo

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.8 + 0.2; // Iba't ibang laki ng bituin
        this.speedX = Math.random() * 0.3 - 0.15; // Swabe at mabagal lang ang galaw
        this.speedY = Math.random() * 0.3 - 0.15;
        this.opacity = Math.random() * 0.6 + 0.1;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Pag lumabas sa screen, lilitaw sa kabilang side (wrapping)
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        ctx.fillStyle = `rgba(180, 210, 255, ${this.opacity})`; // Kulay blueish-white na katulad ng code mo
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1, // Nakapatong sa static stars pero nasa ilalim ng main layout
        pointerEvents: 'none',
      }}
    />
  );
}

export default ParticlesBg;