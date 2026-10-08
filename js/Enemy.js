LUM.ENEMY_TYPES={
  droplet:{name:'Капельник',asset:'droplet',w:44,h:58,speed:55,hp:1,description:'Охраняет свою платформу. Один удар света успокаивает его.'},
  thornwing:{name:'Шипокрыл',asset:'thornwing',w:48,h:54,speed:60,hp:1,description:'Летает над платформой. Заметив LUM, предупреждает о пикировании розовым свечением.'},
  hollowflower:{name:'Пустоцвет',asset:'hollowflower',w:60,h:75,speed:0,hp:2,description:'Маскируется под бутон. Раскрывается при приближении, затем выпускает шип света.'},
  shell:{name:'Тенелич',asset:'shell',w:68,h:48,speed:42,hp:2,description:'Медленный панцирник. После удара выпускает облачко пыльцы, замедляющее LUM.'},
  thief:{name:'Собиратель света',asset:'thief',w:42,h:72,speed:105,hp:1,description:'Убегает от LUM. При контакте роняет украденный кристалл рядом: его можно вернуть.'},
  guardian:{name:'Хранитель Источника',asset:'hollowflower',w:86,h:106,speed:0,hp:4,description:'Хранитель последней главы. Четыре удара света возвращают ему покой. Врата откроются после его освобождения.'},
};
LUM.Enemy = class Enemy {
  constructor(type,x,floorY,left,right,platform=null){
    const spec=LUM.ENEMY_TYPES[type];Object.assign(this,{type,x,y:floorY-spec.h,left,right,platform,...spec});
    this.baseY=this.y;this.floorY=floorY;this.direction=1;this.alive=true;this.age=0;this.hitCooldown=0;this.deathTime=0;this.phase='idle';this.attackClock=0;this.openAmount=0;this.diveAmount=0;
  }
  update(dt,player,level) {
    this.age+=dt;this.hitCooldown=Math.max(0,this.hitCooldown-dt);
    if(!this.alive){this.deathTime=Math.max(0,this.deathTime-dt);return;}
    const near=Math.abs(player.x-this.x)<230;
    this.attackClock+=dt;
    if(this.type==='thornwing'){
      const period=this.age%4;
      this.phase=near&&period>2&&period<2.7?'warning':near&&period>=2.7&&period<3.3?'dive':'fly';
      this.diveAmount+=(Number(this.phase==='dive')-this.diveAmount)*(1-Math.exp(-dt*12));
      this.y=this.baseY-80+this.diveAmount*70+Math.sin(this.age*2.4)*12;
    }else if(this.type==='hollowflower'||this.type==='guardian'){
      this.phase=near?(this.attackClock>2.05?'attack':'open'):'closed';
      this.openAmount+=(Number(near)-this.openAmount)*(1-Math.exp(-dt*5));
      if(near&&this.attackClock>2.4){this.attackClock=0;level.projectiles.push({x:this.x+this.w/2,y:this.y+this.h*.5,w:14,h:14,vx:player.x<this.x?-165:165,life:2});}
    }else{
      this.phase=this.type==='thief'&&near?'run':this.type==='droplet'&&Math.abs(player.x-this.x)<80?'attack':'walk';
      if(this.type==='shell'&&this.hitCooldown>0)this.phase='dust';
      if(this.type==='thief'&&near)this.direction=player.x<this.x?1:-1;
    }
    this.x+=this.speed*this.direction*dt;
    if(this.x<this.left){this.x=this.left;this.direction=1;}
    if(this.x>this.right){this.x=this.right;this.direction=-1;}
  }
  hit(level) {
    if(!this.alive||this.hitCooldown>0)return false;
    this.hp--;this.hitCooldown=.45;
    if(this.type==='shell')level.clouds.push({x:this.x-30,y:this.y-10,w:this.w+60,h:this.h+25,life:2.5});
    if(this.hp<=0){this.alive=false;this.deathTime=.8;this.phase='freed';}return true;
  }
  draw(ctx,time){
    if(!this.alive&&this.deathTime===0)return;
    ctx.save();ctx.translate(this.x+this.w/2,this.y+this.h);ctx.scale(-this.direction,1);
    const motion=window.lumGame?.reducedMotion?0:1;
    const pace=this.phase==='run'?17:this.type==='shell'?5:9;
    const gait=Math.sin(this.age*pace)*motion;
    const release=this.alive?0:1-this.deathTime/.8;
    if(this.hitCooldown>0){ctx.filter='brightness(1.35)';ctx.translate(-Math.sin(this.hitCooldown/.45*Math.PI)*9,0);ctx.rotate(-.08*Math.sin(this.hitCooldown/.45*Math.PI));}
    if(!this.alive){ctx.globalAlpha=1-release;ctx.translate(0,-release*24);ctx.scale(1-release*.5,1-release*.5);}
    const sprite=LUM.Assets?.images[this.asset],crop=LUM.Assets?.crops[this.asset];
    const h=this.type==='guardian'?155:this.type==='thornwing'?95:this.type==='shell'?90:112;
    const flower=this.type==='hollowflower'||this.type==='guardian';
    const squash=flower?.65+this.openAmount*.35:1;
    const walking=['walk','run'].includes(this.phase);
    ctx.rotate((walking?gait*.035:this.type==='thornwing'?.07*Math.sin(this.age*5):.015*Math.sin(this.age*2))*motion);
    if(this.phase==='attack'){ctx.rotate(-.09*Math.sin(this.age*10)*motion);ctx.shadowColor='#f7bce7';ctx.shadowBlur=12;}
    const breath=1+Math.sin(this.age*3)*.018*motion;
    const flap=this.type==='thornwing'?1+Math.sin(this.age*18)*.13*motion:1;
    ctx.scale(flap/breath,breath);
    if(sprite&&crop){const w=h*crop.w/crop.h;ctx.drawImage(sprite,crop.x,crop.y,crop.w,crop.h,-w/2,-h*squash+(walking?-Math.abs(gait)*3:Math.sin(this.age*4)*1.5)*motion,w,h*squash);}
    else{ctx.fillStyle='#ae82b7';ctx.beginPath();ctx.ellipse(0,-this.h/2,this.w*.6,this.h*.6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffe6ad';ctx.fillRect(-12,-this.h/2,5,6);ctx.fillRect(8,-this.h/2,5,6);}
    if(this.phase==='warning'){ctx.filter='none';ctx.fillStyle='#ffacd8';ctx.font='bold 22px Georgia';ctx.textAlign='center';ctx.fillText('!',0,-h-10);}
    if(this.phase==='dust'){ctx.filter='none';ctx.fillStyle='#ac91c5';ctx.globalAlpha=.45;for(let i=0;i<6;i++){const a=this.age*3+i;ctx.beginPath();ctx.arc(Math.cos(a)*40,-30+Math.sin(a)*24,2+i%3,0,Math.PI*2);ctx.fill();}}
    if(this.type==='guardian'&&this.alive){ctx.filter='none';ctx.fillStyle='#26172e';ctx.fillRect(-40,-h-13,80,5);ctx.fillStyle='#f7b8ee';ctx.fillRect(-40,-h-13,80*this.hp/4,5);}
    if(!this.alive){ctx.filter='none';ctx.globalAlpha=Math.sin(release*Math.PI);ctx.fillStyle='#ffe7b9';ctx.shadowColor='#edbbf6';ctx.shadowBlur=14;for(let i=0;i<9;i++){const a=i*Math.PI*2/9;ctx.save();ctx.translate(Math.cos(a)*release*85,-h/2+Math.sin(a)*release*55);ctx.rotate(a+release);ctx.beginPath();ctx.ellipse(0,0,3,7,0,0,Math.PI*2);ctx.fill();ctx.restore();}}
    ctx.restore();
  }
};
