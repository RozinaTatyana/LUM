LUM.Collectible = class Collectible {
  constructor(x,y,index){Object.assign(this,{x,baseY:y,y,w:22,h:30,index,collected:false});}
  update(time){if(this.anchor){this.x=this.anchor.x+this.offset;this.baseY=this.anchor.y-65;}this.y=this.baseY+Math.sin(time*2.5+this.index*.9)*7;}
  draw(ctx,time){
    if(this.collected)return;
    ctx.save();ctx.translate(this.x+11,this.y+15);
    const glow=ctx.createRadialGradient(0,0,1,0,0,47);glow.addColorStop(0,'#ffdb9490');glow.addColorStop(.4,'#ffb86738');glow.addColorStop(1,'#ffd98900');ctx.fillStyle=glow;ctx.fillRect(-47,-47,94,94);
    ctx.shadowColor='#ffc573';ctx.shadowBlur=20;
    // Грани рисуются заливкой, без обводки. Золотой силуэт отличен от цветов.
    const gradient=ctx.createLinearGradient(-12,-28,12,28);gradient.addColorStop(0,'#fffbe1');gradient.addColorStop(.4,'#ffe5a1');gradient.addColorStop(1,'#f4aa53');ctx.fillStyle=gradient;
    ctx.beginPath();ctx.moveTo(0,-28);ctx.lineTo(14,0);ctx.lineTo(0,28);ctx.lineTo(-14,0);ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;ctx.fillStyle='#fff5d0';ctx.beginPath();ctx.moveTo(0,-28);ctx.lineTo(-3,1);ctx.lineTo(-14,0);ctx.closePath();ctx.fill();
    ctx.fillStyle='#f5bf68';ctx.beginPath();ctx.moveTo(0,-28);ctx.lineTo(14,0);ctx.lineTo(3,1);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ffeaba';ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(-3,1);ctx.lineTo(0,28);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fffadd';ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(7,0);ctx.lineTo(0,15);ctx.lineTo(-5,0);ctx.closePath();ctx.fill();
    for(let i=0;i<4;i++){const phase=time*.8+i*1.7+this.index,x=Math.cos(phase)*23,y=Math.sin(phase)*27;ctx.globalAlpha=.35+.5*(1+Math.sin(time*3+i))/2;ctx.fillStyle='#ffe8b4';ctx.beginPath();ctx.moveTo(x,y-3);ctx.lineTo(x+1.5,y);ctx.lineTo(x,y+3);ctx.lineTo(x-1.5,y);ctx.fill();}ctx.restore();
  }
};
