"use client"

export function triggerConfetti(sourceX?: number, sourceY?: number) {
  const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]
  const confettiCount = 50
  const container = document.body

  // Use provided position or default to center top
  const startX = sourceX ?? window.innerWidth / 2
  const startY = sourceY ?? 0

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement("div")
    confetti.className = "confetti-piece"
    confetti.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background-color: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${startX}px;
      top: ${startY}px;
      opacity: 1;
      pointer-events: none;
      z-index: 9999;
    `

    container.appendChild(confetti)

    const angle = Math.random() * Math.PI * 2 // 0 to 360 degrees (all directions)
    const speed = 5 + Math.random() * 15 // Varied initial speed
    let velocityX = Math.cos(angle) * speed
    let velocityY = Math.sin(angle) * speed - (10 + Math.random() * 10) // Random upward bias
    let rotation = Math.random() * 360
    const rotationSpeed = Math.random() * 20 - 10

    let x = 0
    let y = 0
    let opacity = 1
    const gravity = 0.6 // Gravity pulling down
    const drag = 0.99 // Air resistance

    // Physics-based animation loop
    const animate = () => {
      // Apply physics
      velocityY += gravity // Gravity pulls down
      velocityX *= drag // Air resistance
      velocityY *= drag

      x += velocityX
      y += velocityY
      rotation += rotationSpeed
      opacity -= 0.008 // Fade out over time

      confetti.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`
      confetti.style.opacity = `${opacity}`

      // Continue animation while visible and on screen
      if (opacity > 0 && y < window.innerHeight + 100) {
        requestAnimationFrame(animate)
      } else {
        confetti.remove()
      }
    }

    requestAnimationFrame(animate)
  }
}
