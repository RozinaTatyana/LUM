LUM.Player = class Player {
  constructor(x,y,chapter=0) {
    this.w=42;this.h=64;this.chapter=chapter;this.facing=1;this.spawn(x,y);
  }
  spawn(x,y) {
    Object.assign(this,{x,y,vx:0,vy:0,grounded:false,standingOn:null,coyote:0,jumpBuffer:0,invincible:0,jumps:0,attackTime:0,attackCooldown:0,slowed:0,deathProgress:null,deathMode:'blink',sprint:0,gait:0});
  }
  update(dt,input,platforms,worldWidth) {
    this.invincible=Math.max(0,this.invincible-dt);
    this.slowed=Math.max(0,this.slowed-dt);
    this.attackTime=Math.max(0,this.attackTime-dt);this.attackCooldown=Math.max(0,this.attackCooldown-dt);
    this.coyote=this.grounded?.1:Math.max(0,this.coyote-dt);
    this.jumpBuffer=input.takeJump()?.12:Math.max(0,this.jumpBuffer-dt);
    if(this.grounded)this.jumps=0;
    // Shift плавно повышает скорость; отпускание возвращает обычный шаг.
    const running=!!input.sprintHeld&&input.axis!==0;
    this.sprint+=(Number(running)-this.sprint)*(1-Math.exp(-dt*10));
    this.vx=input.axis*(this.slowed>0?170:265+155*this.sprint);if(input.axis)this.facing=input.axis;
    this.gait+=dt*(running?19:11);
    const canGroundJump=this.coyote>0,canAirJump=this.chapter>=1&&this.jumps<2;
    if(this.jumpBuffer>0&&(canGroundJump||canAirJump)) {
      this.jumps=canGroundJump?1:Math.max(1,this.jumps)+1;
      this.vy=-620;this.grounded=false;this.standingOn=null;this.coyote=0;this.jumpBuffer=0;
      this.justJumped=true;
    }
    if(input.takeAttack()&&this.attackCooldown===0){this.attackTime=.4;this.attackCooldown=.48;this.justAttacked=true;}
    // Движение и разрешение столкновений выполняются отдельно по X и Y.
    this.x+=this.vx*dt;
    for(const p of platforms)if(LUM.overlap(this,p)&&this.vx!==0)this.x=this.vx>0?p.x-this.w:p.x+p.w;
    this.x=LUM.clamp(this.x,0,worldWidth-this.w);
    this.vy=Math.min(this.vy+1650*dt,900);this.y+=this.vy*dt;
    this.grounded=false;this.standingOn=null;
    for(const p of platforms)if(LUM.overlap(this,p)){
      if(this.vy>0){this.y=p.y-this.h;this.grounded=true;this.standingOn=p;}
      else if(this.vy<0)this.y=p.y+p.h;
      this.vy=0;
    }
  }
  get attackBox(){return {x:this.facing>0?this.x+this.w:this.x-90,y:this.y-12,w:90,h:this.h+25};}
  draw(ctx,time) {
    if(!window.lumGame?.reducedMotion&&this.deathProgress===null&&this.invincible>0&&Math.floor(time*12)%2===0)return;
    const config=LUM.LEVELS[this.chapter],name=config.hero;
    const sprite=LUM.Assets?.images[name]||LUM.Assets?.images.lum;
    ctx.save();ctx.translate(this.x+this.w/2,this.y+this.h);ctx.scale(this.facing,1);
    const motion=window.lumGame?.reducedMotion?0:1;
    const moving=Math.min(Math.abs(this.vx)/265,1),step=Math.sin(this.gait);
    const bob=this.grounded?step*moving*(this.sprint>0.5?3.2:2)*motion:Math.sin(time*3)*.6*motion;
    const death=this.deathProgress;
    if(death!==null){
      ctx.globalAlpha=this.deathMode==='dust'?Math.pow(1-death,2):1-death;
    }else{
      ctx.rotate(this.grounded?moving*(-.035-this.sprint*.08)+Math.sin(this.gait)*.02*moving*motion:this.vy<0?-.07:.05);
      ctx.scale(1+step*moving*.018*motion,1-step*moving*.022*motion);
    }
    if(sprite){
      const crop=LUM.Assets.crops[name]||LUM.Assets.crops.lum;
      // Широкие лепестки и фонарик декоративны; основной корпус имеет AABB 42×64.
      const h=132,w=h*crop.w/crop.h;
      // Всегда рисуем цельный спрайт: разрезание плаща создавало заметный шов.
      if(this.sprint>.35&&death===null&&motion){
        ctx.save();ctx.fillStyle=config.color;ctx.shadowColor=config.color;ctx.shadowBlur=8;
        for(let i=1;i<=5;i++){ctx.globalAlpha=.22*this.sprint*(1-i/6);ctx.beginPath();ctx.ellipse(-w*.35-i*8,-18+Math.sin(this.gait+i)*5,4,1.5,-.2,0,Math.PI*2);ctx.fill();}
        ctx.restore();
      }
      ctx.drawImage(sprite,crop.x,crop.y,crop.w,crop.h,-w/2,-h+bob,w,h);
    }else{
      ctx.shadowBlur=20;ctx.shadowColor=config.color;ctx.fillStyle=config.color;ctx.beginPath();ctx.ellipse(0,-38,24,33,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#241f33';ctx.fillRect(-8,-47,4,7);ctx.fillRect(8,-47,4,7);
    }
    if(death!==null){
      if(this.deathMode==='dust'){
        ctx.restore();ctx.save();ctx.translate(this.x+this.w/2,this.y+this.h-48);
        ctx.fillStyle=config.color;ctx.shadowColor=config.color;ctx.shadowBlur=5;
        // Мелкая пыль выходит из силуэта и постепенно гаснет. Без лепестков.
        for(let i=0;i<100;i++){
          const seed=Math.sin(i*127.1+31)*43758.5453,f=seed-Math.floor(seed);
          const angle=i*2.39996,spread=death*(18+f*78);
          const x=Math.cos(angle)*spread+(f-.5)*32;
          const y=Math.sin(angle)*spread*.5-(i%11)*5+death*death*35;
          ctx.globalAlpha=Math.sin(Math.PI*death)*(.35+f*.65);
          ctx.beginPath();ctx.arc(x,y,.6+f*1.5,0,Math.PI*2);ctx.fill();
        }
      }
    }else{
      if(this.chapter>=1){ctx.globalAlpha=.5;ctx.fillStyle=config.color;for(let i=0;i<5;i++){const a=time*1.2+i*1.26;ctx.beginPath();ctx.arc(Math.cos(a)*30,-38+Math.sin(a)*36,1.4,0,Math.PI*2);ctx.fill();}}
      if(this.attackTime>0){
        // Мягкий серп и шлейф лепестков: свет успокаивает, а не ранит.
        const phase=1-this.attackTime/.4,angle=-2.3+phase*4.3;
        ctx.globalAlpha=Math.sin(phase*Math.PI);ctx.shadowColor=config.color;ctx.shadowBlur=18;
        const glow=ctx.createLinearGradient(-30,-95,110,0);glow.addColorStop(0,'#bd98ed');glow.addColorStop(.5,'#fff7dc');glow.addColorStop(1,'#f6bdbd');
        ctx.strokeStyle=glow;ctx.lineCap='round';
        for(let i=0;i<7;i++){ctx.lineWidth=(7-i)*1.4;ctx.globalAlpha=Math.sin(phase*Math.PI)*(1-i/8);ctx.beginPath();ctx.ellipse(20,-48,78-i*2,49-i,-.25,angle-.9-i*.06,angle);ctx.stroke();}
        ctx.fillStyle='#fff0d5';ctx.globalAlpha=Math.sin(phase*Math.PI);
        for(let i=0;i<5;i++){const a=angle-i*.24;ctx.save();ctx.translate(20+Math.cos(a)*85,-48+Math.sin(a)*52);ctx.rotate(a);ctx.beginPath();ctx.ellipse(0,0,7,2.6,0,0,Math.PI*2);ctx.fill();ctx.restore();}
      }
    }
    ctx.restore();
  }
};

