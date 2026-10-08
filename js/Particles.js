// Фиксированный пул: при каждом кристалле не создаём десятки новых объектов.
LUM.Particles = class Particles {
  constructor(){this.items=Array.from({length:80},()=>({life:0}));this.cursor=0;}
  emit(x,y,color,count=15){for(let i=0;i<count;i++){const p=this.items[this.cursor++%this.items.length],a=i*Math.PI*2/count;Object.assign(p,{x,y,color,life:.7,vx:Math.cos(a)*85,vy:Math.sin(a)*85-25});}}
  update(dt){for(const p of this.items)if(p.life>0){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=80*dt;}}
  draw(ctx){ctx.save();for(const p of this.items)if(p.life>0){ctx.globalAlpha=p.life/.7;ctx.fillStyle=p.color;ctx.fillRect(p.x-1.5,p.y-1.5,3,3);}ctx.restore();}
};
