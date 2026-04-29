import { useEffect, useRef } from "react";

export default function ParticleBackground() {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0, radius: 200 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let particles = [];
    const particleCount = 100;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.baseX = this.x;
        this.baseY = this.y;
        this.size = Math.random() * 2 + 1;
        this.density = (Math.random() * 30) + 2;
        
        const isBlue = Math.random() > 0.5;
        this.color = isBlue 
          ? `rgba(37, 99, 235, ${0.3 + Math.random() * 0.4})`
          : `rgba(6, 182, 212, ${0.3 + Math.random() * 0.4})`;
        
        this.vx = (Math.random() - 0.5) * 1.2;
        this.vy = (Math.random() - 0.5) * 1.2;
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }

      update() {
        this.baseX += this.vx;
        this.baseY += this.vy;

        if (this.baseX < 0) { this.baseX = 0; this.vx *= -1; }
        if (this.baseX > canvas.width) { this.baseX = canvas.width; this.vx *= -1; }
        if (this.baseY < 0) { this.baseY = 0; this.vy *= -1; }
        if (this.baseY > canvas.height) { this.baseY = canvas.height; this.vy *= -1; }

        let dx = mouse.current.x - this.x;
        let dy = mouse.current.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.current.radius) {
          let force = (mouse.current.radius - distance) / mouse.current.radius;
          let forceX = (dx / distance) * force * this.density;
          let forceY = (dy / distance) * force * this.density;
          this.x -= forceX;
          this.y -= forceY;
        }

        let distToBaseX = this.baseX - this.x;
        let distToBaseY = this.baseY - this.y;
        this.x += distToBaseX * 0.1;
        this.y += distToBaseY * 0.1;

        if (this.x < -10) this.x = -10;
        if (this.x > canvas.width + 10) this.x = canvas.width + 10;
        if (this.y < -10) this.y = -10;
        if (this.y > canvas.height + 10) this.y = canvas.height + 10;
      }
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].draw();
        particles[i].update();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);

    resize();
    init();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ background: "transparent" }}
    />
  );
}

