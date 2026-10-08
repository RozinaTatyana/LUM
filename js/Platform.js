LUM.Platform = class Platform {
  constructor(x, y, w, h = 32) { Object.assign(this, {x,y,w,h,baseX:x,baseY:y,dx:0,dy:0,motion:null}); }
  update(time) {
    const oldX=this.x,oldY=this.y;
    if(this.motion){const m=this.motion;this[m.axis]=this[m.axis==='x'?'baseX':'baseY']+Math.sin(time*m.speed)*m.range;}
    this.dx=this.x-oldX;this.dy=this.y-oldY;
  }
  draw(ctx) {
    const ledge=LUM.Assets?.images.ledge;
    if(ledge){
      if(!this.motion)this.drawSupport(ctx);
      // Верхняя золотая кромка изображения совмещена с верхом AABB.
      const height=this.w>300?145:110;
      ctx.drawImage(ledge,29,90,2116,600,this.x-4,this.y-height*140/600,this.w+8,height);
      return;
    }
    const g = ctx.createLinearGradient(0,this.y,0,this.y+this.h); g.addColorStop(0,'#5f526b'); g.addColorStop(1,'#292739');
    ctx.fillStyle = g; ctx.beginPath();ctx.roundRect(this.x,this.y,this.w,this.h,7);ctx.fill();
    ctx.fillStyle = '#adb78c';ctx.beginPath();ctx.roundRect(this.x,this.y,this.w,6,3);ctx.fill();
    ctx.fillStyle = '#d2d5a0';ctx.fillRect(this.x+7,this.y,this.w-14,2);
    ctx.strokeStyle='#77677d';ctx.lineWidth=1;
    for(let x=this.x+22;x<this.x+this.w-5;x+=48){ctx.beginPath();ctx.moveTo(x,this.y+9);ctx.lineTo(x-5,this.y+this.h-5);ctx.stroke();}
    // Несветящиеся свисающие листья принадлежат платформе, не являются предметами.
    ctx.fillStyle='#6a7b72';for(let x=this.x+12;x<this.x+this.w;x+=42){ctx.beginPath();ctx.ellipse(x,this.y+this.h+5,3,10,.4,0,Math.PI*2);ctx.fill();}
  }
  drawSupport(ctx){
    // Опоры — только декорация: физика использует прямоугольник самой платформы.
    ctx.save();const top=this.y+22,bottom=658,center=this.x+this.w/2;
    const sprite=this.w<300?LUM.Assets?.images.pillar:LUM.Assets?.images.arch;
    if(sprite){
      if(this.w<300){
        const height=bottom-top+12,width=Math.max(62,Math.min(92,height*.25));
        ctx.drawImage(sprite,305,17,366,1580,center-width/2,top-12,width,height);
      }else{
        // Золотая поверхность арки в исходном PNG находится на y=240.
        const height=(bottom-this.y)*1031/828;
        ctx.drawImage(sprite,33,37,1382,1031,this.x-4,this.y-height*203/1031,this.w+8,height);
      }
      ctx.restore();return;
    }
    const stone=ctx.createLinearGradient(center-24,0,center+24,0);stone.addColorStop(0,'#091125');stone.addColorStop(.35,'#293044');stone.addColorStop(.7,'#171c31');stone.addColorStop(1,'#745060');
    if(this.w<300){
      ctx.fillStyle=stone;ctx.fillRect(center-18,top,36,bottom-top);
      ctx.fillStyle='#343447';ctx.fillRect(center-30,top,60,14);ctx.fillRect(center-24,top+14,48,12);
      ctx.strokeStyle='#8b647044';ctx.lineWidth=1;for(let y=top+32;y<bottom;y+=21){ctx.beginPath();ctx.moveTo(center-18,y);ctx.lineTo(center+18,y);ctx.stroke();}
      ctx.fillStyle='#c4916370';ctx.fillRect(center+14,top+30,2,bottom-top-30);
    }else{
      const leg=36;ctx.fillStyle=stone;ctx.fillRect(this.x+20,top,leg,bottom-top);ctx.fillRect(this.x+this.w-leg-20,top,leg,bottom-top);
      ctx.strokeStyle='#1c2238';ctx.lineWidth=28;ctx.beginPath();ctx.moveTo(this.x+45,bottom);ctx.lineTo(this.x+45,top+86);ctx.bezierCurveTo(this.x+45,top-5,this.x+this.w-45,top-5,this.x+this.w-45,top+86);ctx.lineTo(this.x+this.w-45,bottom);ctx.stroke();
      ctx.strokeStyle='#7e5a6744';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(this.x+58,bottom);ctx.lineTo(this.x+58,top+86);ctx.bezierCurveTo(this.x+58,top+5,this.x+this.w-58,top+5,this.x+this.w-58,top+86);ctx.lineTo(this.x+this.w-58,bottom);ctx.stroke();
      ctx.strokeStyle='#7d596744';for(let y=top+48;y<bottom;y+=25){ctx.beginPath();ctx.moveTo(this.x+20,y);ctx.lineTo(this.x+56,y);ctx.moveTo(this.x+this.w-56,y);ctx.lineTo(this.x+this.w-20,y);ctx.stroke();}
    }
    ctx.restore();
  }
};
