LUM.Renderer = class Renderer {
  constructor(canvas){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');
    this.backgrounds=new Map();this.iconContext=document.getElementById('gem-icon').getContext('2d');this.iconGem=new LUM.Collectible(0,0,0);
  }
  getBackground(name){
    if(this.backgrounds.has(name))return this.backgrounds.get(name);
    // Кэш размытого дальнего слоя: blur не пересчитывается на каждом кадре.
    this.background=document.createElement('canvas');this.background.width=1560;this.background.height=720;
    const c=this.background.getContext('2d'),image=LUM.Assets?.images[name];
    if(image){c.filter='blur(1.7px)';c.drawImage(image,-3,-3,1566,726);c.filter='none';c.fillStyle='#02061c70';c.fillRect(0,0,1560,720);}
    else{const g=c.createLinearGradient(0,0,0,720);g.addColorStop(0,'#142348');g.addColorStop(1,'#403258');c.fillStyle=g;c.fillRect(0,0,1560,720);}
    this.backgrounds.set(name,this.background);return this.background;
  }
  draw(game){
    const c=this.ctx,{level,player,camera}=game,time=game.reducedMotion?0:game.time;
    c.clearRect(0,0,1280,720);c.drawImage(this.getBackground(level.config.background),-camera*.12,0);
    this.drawMotes(c,camera,time);
    c.save();c.translate(-camera,0);
    for(const p of level.platforms)if(p.x+p.w>camera-80&&p.x<camera+1360)p.draw(c);
    for(const h of level.hazards)this.drawSpikes(c,h,time);
    this.drawExit(c,level.exit,game.collected===10&&!level.enemies.some(e=>e.type==='guardian'&&e.alive),time);
    level.collectibles.forEach(g=>g.draw(c,time));level.enemies.forEach(e=>e.draw(c,time));
    for(const p of level.projectiles){c.save();c.shadowColor='#ff96e8';c.shadowBlur=18;c.fillStyle='#ffe0ff';c.beginPath();c.moveTo(p.x,p.y+7);c.lineTo(p.x+7,p.y);c.lineTo(p.x+14,p.y+7);c.lineTo(p.x+7,p.y+14);c.fill();c.restore();}
    for(const cloud of level.clouds){c.save();c.globalAlpha=Math.min(.35,cloud.life*.2);c.fillStyle='#7470a3';c.beginPath();c.ellipse(cloud.x+cloud.w/2,cloud.y+cloud.h/2,cloud.w/2,cloud.h/2,0,0,Math.PI*2);c.fill();c.restore();}
    player.draw(c,time);game.particles.draw(c);
    c.restore();this.drawWater(c,time);
    const vignette=c.createRadialGradient(640,350,260,640,350,800);vignette.addColorStop(0,'#03071700');vignette.addColorStop(1,'#02041266');c.fillStyle=vignette;c.fillRect(0,0,1280,720);
    if(game.state==='won'&&game.chapter===3){const glow=c.createRadialGradient(640,280,20,640,280,480);glow.addColorStop(0,'#ffe3a17a');glow.addColorStop(1,'#ffd5aa00');c.fillStyle=glow;c.fillRect(0,0,1280,720);}
    const icon=this.iconContext;icon.clearRect(0,0,98,108);icon.save();icon.translate(38,37);this.iconGem.draw(icon,time);icon.restore();
  }
  drawMotes(c,camera,time){
    c.save();for(let i=0;i<32;i++){
      const x=((i*173-camera*.25)%1320+1320)%1320,y=140+(i*83)%400+Math.sin(time*.65+i)*16;
      c.globalAlpha=.25+.35*(1+Math.sin(time*1.7+i))/2;c.fillStyle=i%3?'#ffd3a2':'#fba4f3';c.shadowColor=c.fillStyle;c.shadowBlur=8;
      c.beginPath();c.ellipse(x,y,1.3,2.4,Math.sin(time+i),0,Math.PI*2);c.fill();
    }c.restore();
  }
  drawWater(c,time){
    c.save();const shade=c.createLinearGradient(0,640,0,720);shade.addColorStop(0,'#10255200');shade.addColorStop(1,'#04112b8c');c.fillStyle=shade;c.fillRect(0,640,1280,80);
    for(let i=0;i<48;i++){const x=(i*149+Math.sin(time*.8+i)*8)%1280,y=650+(i*7)%65;c.strokeStyle=i%3?'#ce9bdb40':'#ffd6a65c';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x+8+Math.sin(time*1.4+i)*4,y);c.stroke();}c.restore();
  }
  drawSpikes(c,h,time){
    c.save();c.shadowColor='#ff75f0';c.shadowBlur=25+Math.sin(time*2)*3;
    for(let x=h.x;x<h.x+h.w-5;x+=19){const height=h.h*(.85+.15*Math.sin(x));const g=c.createLinearGradient(0,h.y,0,h.y+h.h);g.addColorStop(0,'#fff8ff');g.addColorStop(.45,'#ffb6fa');g.addColorStop(1,'#b13a99');c.fillStyle=g;c.beginPath();c.moveTo(x,h.y+h.h);c.lineTo(x+9.5,h.y+h.h-height);c.lineTo(x+19,h.y+h.h);c.closePath();c.fill();c.shadowBlur=0;c.fillStyle='#d25ac5';c.beginPath();c.moveTo(x+9.5,h.y+h.h-height);c.lineTo(x+9.5,h.y+h.h);c.lineTo(x+19,h.y+h.h);c.fill();c.shadowBlur=25;}c.restore();
  }
  drawExit(c,e,open,time){
    c.save();c.translate(e.x,e.y);c.strokeStyle='#293044';c.lineWidth=16;c.beginPath();c.moveTo(0,100);c.lineTo(0,32);c.bezierCurveTo(0,-16,65,-16,65,32);c.lineTo(65,100);c.stroke();c.strokeStyle=open?'#ffe2a6':'#a889ab';c.lineWidth=2;c.shadowColor='#f4c38b';c.shadowBlur=open?18:3;c.beginPath();c.moveTo(3,100);c.lineTo(3,32);c.bezierCurveTo(3,-12,62,-12,62,32);c.lineTo(62,100);c.stroke();
    const g=c.createLinearGradient(0,0,0,100);g.addColorStop(0,open?'#ffe4adab':'#a991cb30');g.addColorStop(1,'#e6c5a000');c.fillStyle=g;c.fillRect(7,25,51,75);c.shadowBlur=0;c.font='9px Georgia';c.textAlign='center';c.fillStyle=open?'#ffebbc':'#b5a4c3';c.fillText(open?'ВРАТА ОТКРЫТЫ':'10 КРИСТАЛЛОВ',32,-25);if(open){c.globalAlpha=.65+.35*Math.sin(time*3);c.font='28px Georgia';c.fillText('✦',32,58);}c.restore();
  }
};
