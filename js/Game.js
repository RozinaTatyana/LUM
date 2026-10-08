LUM.Game = class Game {
  constructor(canvas){
    this.canvas=canvas;this.renderer=new LUM.Renderer(canvas);this.sound=new LUM.SoundManager();this.save=this.loadSave();
    this.chapter=this.save.lastChapter;this.state='ready';this.resetWorld();
    this.ui={};for(const id of ['overlay','panel-title','panel-text','panel-tag','primary','secondary','timer','lives','crystals','pause','status','best','toast','score','abilities','level-name','chapter-select','atlas','atlas-content','sound','volume'])this.ui[id]=document.getElementById(id);
    this.abort=new AbortController();this.events={signal:this.abort.signal};
    this.input=this.createInput();
    this.bindUI();this.buildChapterSelect();this.buildAtlas();this.menu=new LUM.Menu(this);this.menu.show();this.updateHUD();
    this.lastTimestamp=null;this.accumulator=0;this.frame=this.frame.bind(this);this.raf=requestAnimationFrame(this.frame);
  }
  createInput(){return new LUM.InputHandler(code=>{
    if(document.querySelector('dialog[open]'))return;
    if(code==='Escape')this.togglePause();if(code==='KeyR'&&['running','paused','won','lost'].includes(this.state))this.restart();
  },()=>['running','dying','paused','won','lost'].includes(this.state));}
  bindUI(){
    const on=(element,event,handler)=>element.addEventListener(event,handler,this.events);
    on(this.ui.primary,'click',()=>{
      if(this.state==='paused')this.resume();
      else if(this.state==='lost')this.continueGame();
      else if(this.state==='won'&&this.chapter<3)this.startLevel(this.chapter+1);
      else this.restart();
    });
    on(this.ui.secondary,'click',()=>this.restart());on(this.ui.pause,'click',()=>this.togglePause());
    on(document.getElementById('atlas-close'),'click',()=>this.ui.atlas.close());
    on(this.ui.atlas,'click',e=>{const button=e.target.closest('[data-level]');if(button&&!button.disabled){this.ui.atlas.close();this.startLevel(Number(button.dataset.level));}});
    on(this.ui.sound,'click',()=>{this.sound.toggle();this.ui.sound.textContent=this.sound.enabled?'♪':'♪ ×';this.ui.sound.setAttribute('aria-pressed',String(this.sound.enabled));this.menu?.saveSettings();});
    on(this.ui.volume,'input',()=>{this.sound.setVolume(this.ui.volume.value);this.menu?.saveSettings();});
    on(document.getElementById('fullscreen'),'click',async()=>{
      try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.game-shell').requestFullscreen();}catch{this.message('Полноэкранный режим недоступен в этом окне.');}
    });
    on(document,'visibilitychange',()=>{if(document.hidden&&['running','dying'].includes(this.state))this.pause('Игра остановлена, пока вкладка скрыта.');});
    on(window,'blur',()=>{if(['running','dying'].includes(this.state))this.pause();});
    on(window,'pagehide',()=>this.saveSession());
  }
  resetWorld(){
    clearTimeout(this.toastTimeout);this.level=new LUM.LevelManager(this.chapter);this.player=new LUM.Player(this.level.spawn.x,this.level.spawn.y,this.chapter);
    this.deathClock=0;this.sessionClock=0;this.time=0;this.elapsed=0;this.lives=3;this.collected=0;this.defeated=0;this.camera=0;this.healAvailable=this.chapter===3;this.exitHintShown=false;this.particles=new LUM.Particles();
    this.sound?.stop();this.input?.clear();
  }
  loadSave(){
    const empty={unlocked:0,lastChapter:0,stats:Array.from({length:4},()=>({best:null,completed:false,maxCrystals:0}))};
    try{
      const raw=localStorage.getItem('lum.campaign.v1');
      if(!raw){
        const old=JSON.parse(localStorage.getItem('lum.gardens.v1')||'null');
        if(old){empty.stats[0].maxCrystals=Number.isInteger(old.maxCrystals)?LUM.clamp(old.maxCrystals,0,10):0;if(Number.isFinite(old.best)&&old.best>0)empty.stats[0].best=old.best;}
        if(old?.completed){empty.unlocked=1;empty.stats[0].completed=true;}return empty;
      }
      const data=JSON.parse(raw);if(!data||typeof data!=='object')return empty;
      if(Array.isArray(data.stats))for(let i=0;i<4;i++){
        const s=data.stats[i]||{};empty.stats[i]={best:Number.isFinite(s.best)&&s.best>0?s.best:null,completed:s.completed===true,maxCrystals:Number.isInteger(s.maxCrystals)?LUM.clamp(s.maxCrystals,0,10):0};
      }
      // Открытие главы подтверждается прохождением предыдущих, а не только числом.
      while(empty.unlocked<3&&empty.stats[empty.unlocked].completed)empty.unlocked++;
      
      empty.lastChapter=Number.isInteger(data.lastChapter)?LUM.clamp(data.lastChapter,0,empty.unlocked):0;empty.session=data.session||null;return empty;
    }catch{return empty;}
  }
  persist(){try{localStorage.setItem('lum.campaign.v1',JSON.stringify(this.save));}catch{/* Приватный режим не должен ломать игру. */}}
  get score(){return this.collected*100+this.defeated*50;}
  startLevel(index){
    if(!Number.isInteger(index)||index<0||index>this.save.unlocked)return;
    this.chapter=index;this.save.lastChapter=index;this.persist();this.restart();
  }
  restart(){
    // Снимаем старые обработчики перед повторным подключением: R не умножает ввод.
    this.abort.abort();this.input.destroy();this.abort=new AbortController();this.events={signal:this.abort.signal};
    this.input=this.createInput();this.bindUI();
    this.resetWorld();this.menu?.hide();this.state='running';this.accumulator=0;this.lastTimestamp=null;this.ui.overlay.hidden=true;
    this.ui.toast.classList.remove('visible');this.sound.unlock();this.canvas.focus();this.updateHUD();
    this.saveSession();this.message('Shift — ускорение · J — удар света · Esc — пауза',4);
  }
  readyPanel(){this.showPanel(this.level.config.name,this.level.config.description,'Начать путешествие →',`ГЛАВА ${this.chapter+1} · ${this.level.config.subtitle}`);}
  pause(text='Свет подождёт. Продолжи, когда будешь готов.'){
    if(!['running','dying'].includes(this.state))return;this.pausedState=this.state;this.state='paused';this.saveSession();this.input.clear();this.sound.stop();this.accumulator=0;
    this.showPanel('Путешествие на паузе',text,'Продолжить','ПАУЗА');this.updateHUD();
  }
  resume(){
    if(this.state!=='paused')return;this.state=this.pausedState||'running';this.input.clear();this.lastTimestamp=null;this.accumulator=0;
    this.ui.overlay.hidden=true;this.sound.unlock();this.canvas.focus();this.updateHUD();
  }
  togglePause(){if(['running','dying'].includes(this.state))this.pause();else if(this.state==='paused')this.resume();
      else if(this.state==='lost')this.continueGame();}
  showPanel(title,text,button,tag){
    clearTimeout(this.toastTimeout);this.ui.toast.classList.remove('visible');
    this.ui['panel-title'].textContent=title;this.ui['panel-text'].textContent=text;this.ui['panel-tag'].textContent=tag;
    this.ui.primary.textContent=button;this.ui.secondary.hidden=!['paused','won','lost'].includes(this.state);
    document.getElementById('pause-settings').hidden=this.state!=='paused';
    this.ui.overlay.hidden=false;this.ui.primary.focus();
  }
  message(text,duration=3){
    clearTimeout(this.toastTimeout);this.ui.toast.textContent=text;this.ui.toast.classList.add('visible');
    this.toastTimeout=setTimeout(()=>this.ui.toast.classList.remove('visible'),duration*1000);
  }
  damage(enemy=null){
    if(this.player.invincible>0||this.state!=='running')return;
    if(enemy?.type==='thief'&&this.collected>0){
      const gem=this.level.collectibles.findLast(g=>g.collected);gem.collected=false;gem.anchor=null;
      gem.x=this.level.checkpoint.x+12;gem.baseY=this.level.checkpoint.y+this.player.h-65;gem.update(this.time);this.collected--;
    }
    this.lives--;this.sound.stop();this.sound.effect('hit');
    this.state='dying';this.player.y=Math.min(this.player.y,570);this.deathClock=0;this.player.deathProgress=0;this.player.deathMode=this.lives===0?'dust':'blink';this.deathDuration=this.lives===0?.95:.22;this.input.clear();this.saveSession();
    this.updateHUD();
  }
  win(){
    if(this.state!=='running')return;this.state='won';this.save.session=null;this.input.clear();this.sound.stop();this.sound.effect('win');
    const stats=this.save.stats[this.chapter],record=stats.best===null||this.elapsed<stats.best;
    if(record)stats.best=this.elapsed;stats.completed=true;stats.maxCrystals=10;this.save.unlocked=Math.max(this.save.unlocked,Math.min(3,this.chapter+1));this.persist();
    if(this.chapter<3){const next=new LUM.LevelManager(this.chapter+1);this.save.session={chapter:this.chapter+1,lives:3,elapsed:0,time:0,checkpoint:{...next.spawn},healAvailable:this.chapter+1===3,gems:next.collectibles.map(()=>({collected:false,dropped:false})),enemies:next.enemies.map(e=>({hp:e.hp}))};this.persist();}
    this.buildChapterSelect();this.buildAtlas();
    this.showPanel(this.chapter===3?'Элория снова наполнена светом':'Источник света пробуждён',`Глава ${this.chapter+1}/4 · ${this.score} очков · ${LUM.formatTime(this.elapsed)}.${record?' Новый рекорд!':''}`,this.chapter<3?'Следующая глава →':'Пройти финал ещё раз',this.chapter===3?'ПУТЕШЕСТВИЕ ЗАВЕРШЕНО':'ГЛАВА ПРОЙДЕНА');this.updateHUD();
  }
  update(dt){
    if(this.state==='dying'){this.updateDeath(dt);return;}
    if(this.state!=='running')return;
    this.time+=dt;this.elapsed+=dt;this.sessionClock+=dt;
    if(this.sessionClock>=2){this.sessionClock=0;this.saveSession();}
    // Сначала переносим стоящего игрока вместе с движущимся карнизом.
    const support=this.player.standingOn;this.level.updatePlatforms(this.time);
    if(support){this.player.x+=support.dx;this.player.y+=support.dy;}
    this.player.update(dt,this.input,this.level.platforms,this.level.width);
    if(this.player.justJumped){this.sound.effect('jump');this.player.justJumped=false;}
    if(this.player.justAttacked){this.sound.effect('attack');this.player.justAttacked=false;}
    if(this.input.takeHeal()){
      if(this.healAvailable&&this.lives<3){this.lives++;this.healAvailable=false;this.sound.effect('heal');this.particles.emit(this.player.x,this.player.y,'#f5c3f6',25);this.message('Свет восстановил одну жизнь.');}
      else this.message(this.chapter===3?'Лечение доступно один раз, когда потеряна жизнь.':'Лечение откроется в финальной главе.');
    }
    for(const gem of this.level.collectibles){
      gem.update(this.time);
      if(!gem.collected&&LUM.overlap(this.player,gem)){
        gem.collected=true;this.collected++;this.saveSession();this.sound.effect('collect');this.particles.emit(gem.x+11,gem.y+15,'#ffe4aa');
        const stats=this.save.stats[this.chapter];if(this.collected>stats.maxCrystals){stats.maxCrystals=this.collected;this.persist();}
        if(this.collected===10)this.message(this.chapter===3?'Все искры собраны! Освободи Хранителя и найди врата.':'Все искры собраны! Найди светящиеся врата.');
      }
    }
    for(const enemy of this.level.enemies){
      enemy.update(dt,this.player,this.level);
      if(enemy.alive&&this.player.attackTime>0&&LUM.overlap(this.player.attackBox,enemy)&&enemy.hit(this.level)){
        this.particles.emit(enemy.x+enemy.w/2,enemy.y,'#d8bdff');if(!enemy.alive)this.defeated++;
      }
      if(enemy.alive&&LUM.overlap(this.player,enemy))this.damage(enemy);
    }
    this.updateEffects(dt);
    if(this.player.y>this.level.height+30||this.level.hazards.some(h=>LUM.overlap(this.player,h)))this.damage();
    if(this.state==='running'){
      this.level.updateCheckpoint(this.player);
      if(LUM.overlap(this.player,this.level.exit)){
        const guardian=this.level.enemies.find(e=>e.type==='guardian'&&e.alive);
        if(this.collected===10&&!guardian)this.win();
        else if(!this.exitHintShown){this.message(guardian?'Хранитель ещё во тьме — успокой его ударом J.':`Для врат нужны все кристаллы: ещё ${10-this.collected}.`);this.exitHintShown=true;}
      }else this.exitHintShown=false;
    }
    const target=LUM.clamp(this.player.x-1280*.38,0,this.level.width-1280);this.camera+=(target-this.camera)*(1-Math.exp(-dt*7));
    this.particles.update(dt);this.updateHUD();
  }
  updateEffects(dt){
    for(const p of this.level.projectiles){p.x+=p.vx*dt;p.life-=dt;if(p.life>0&&LUM.overlap(p,this.player)){this.damage();p.life=0;}}
    this.level.projectiles=this.level.projectiles.filter(p=>p.life>0);
    for(const cloud of this.level.clouds){cloud.life-=dt;if(LUM.overlap(cloud,this.player))this.player.slowed=.3;}
    this.level.clouds=this.level.clouds.filter(c=>c.life>0);
  }
  hasSession(){return !!this.validSession(this.save.session);}
  validSession(s){
    if(!s||!Number.isInteger(s.chapter)||s.chapter<0||s.chapter>this.save.unlocked||!Number.isInteger(s.lives)||s.lives<1||s.lives>3||!Number.isFinite(s.elapsed)||s.elapsed<0||s.elapsed>86400)return null;
    const level=new LUM.LevelManager(s.chapter);
    if(!Array.isArray(s.gems)||s.gems.length!==10||s.gems.some(g=>!g||typeof g.collected!=='boolean'||typeof g.dropped!=='boolean')||!Array.isArray(s.enemies)||s.enemies.length!==level.enemies.length)return null;
    if(s.enemies.some((e,i)=>!e||!Number.isInteger(e.hp)||e.hp<0||e.hp>LUM.ENEMY_TYPES[level.enemies[i].type].hp))return null;
    const cp=s.checkpoint;if(!cp||!Number.isFinite(cp.x)||!Number.isFinite(cp.y)||!level.platforms.some(p=>!p.motion&&cp.x>=p.x&&cp.x+42<=p.x+p.w&&Math.abs(cp.y+64-p.y)<1))return null;
    return s;
  }
  saveSession(){
    if(!['running','dying','paused','lost'].includes(this.state))return;
    this.save.session={chapter:this.chapter,lives:this.lives===0?3:this.lives,elapsed:this.elapsed,time:this.time,checkpoint:{...this.level.checkpoint},healAvailable:this.healAvailable,
      gems:this.level.collectibles.map(g=>({collected:g.collected,dropped:!g.anchor})),enemies:this.level.enemies.map(e=>({hp:e.hp}))};this.persist();
  }
  continueGame(){
    const s=this.validSession(this.save.session);if(!s)return;
    this.chapter=s.chapter;this.resetWorld();this.elapsed=s.elapsed;this.time=Number.isFinite(s.time)&&s.time>=0&&s.time<=86400?s.time:s.elapsed;this.lives=s.lives;this.healAvailable=this.chapter===3&&s.healAvailable===true;
    this.level.checkpoint={...s.checkpoint};this.player.spawn(s.checkpoint.x,s.checkpoint.y);this.player.invincible=2;
    s.gems.forEach((data,i)=>{const gem=this.level.collectibles[i];gem.collected=data.collected;if(data.dropped){gem.anchor=null;gem.x=s.checkpoint.x+12;gem.baseY=s.checkpoint.y+this.player.h-65;}});
    s.enemies.forEach((data,i)=>{const e=this.level.enemies[i];e.hp=data.hp;e.alive=e.hp>0;e.deathTime=0;});
    this.collected=this.level.collectibles.filter(g=>g.collected).length;this.defeated=this.level.enemies.filter(e=>!e.alive).length;
    this.camera=LUM.clamp(this.player.x-1280*.38,0,this.level.width-1280);this.level.updatePlatforms(this.time);
    this.state='running';this.menu.hide();this.ui.overlay.hidden=true;this.lastTimestamp=null;this.accumulator=0;this.sound.unlock();this.canvas.focus();this.updateHUD();this.message('Путешествие продолжается с безопасной платформы.');
  }
  toMenu(){this.saveSession();this.menu.show();this.updateHUD();}
  updateDeath(dt){
    this.deathClock+=dt;this.player.deathProgress=LUM.clamp(this.deathClock/this.deathDuration,0,1);this.particles.update(dt);
    if(this.deathClock<this.deathDuration)return;
    if(this.lives===0){this.state='lost';this.showPanel('Искра ещё вернётся',`Кристаллы: ${this.collected}/10 · Очки: ${this.score} · Время: ${LUM.formatTime(this.elapsed)}`,'Продолжить путешествие','ПРОГРЕСС СОХРАНЁН');}
    else{const p=this.level.checkpoint;this.player.spawn(p.x,p.y);this.player.invincible=2;this.state='running';this.saveSession();this.message('Свет собрался вновь. Продолжай с безопасной платформы.');}
    this.updateHUD();
  }
  buildChapterSelect(){
    this.ui['chapter-select'].innerHTML=LUM.LEVELS.map((l,i)=>`<option value="${i}" ${i>this.save.unlocked?'disabled':''}>${i+1}. ${l.name}${i>this.save.unlocked?' · закрыто':''}</option>`).join('');this.ui['chapter-select'].value=this.chapter;
  }
  buildAtlas(){
    this.ui['atlas-content'].innerHTML=`<h3>Локации Элории</h3><div class="atlas-grid locations">${LUM.LEVELS.map((l,i)=>`<article><img src="assets/${l.background}.png" alt="${l.name}"><div><span class="eyebrow">ГЛАВА ${i+1}</span><h4>${l.name}</h4><p>${l.description}</p><p>${l.abilities}</p><button data-level="${i}" ${i>this.save.unlocked?'disabled':''}>${i>this.save.unlocked?'Откроется после предыдущей главы':'Играть →'}</button></div></article>`).join('')}</div><h3>LUM — свет, который помнит</h3><div class="atlas-grid heroes">${LUM.LEVELS.map((l,i)=>`<article><img src="assets/${l.hero}.png" alt="LUM: ${l.subtitle}"><h4>${l.subtitle}</h4><p>${l.abilities}</p></article>`).join('')}</div><h3>Раненные тьмой</h3><div class="atlas-grid enemies">${Object.values(LUM.ENEMY_TYPES).map(e=>`<article><img src="assets/${e.asset}.png" alt="${e.name}"><h4>${e.name}</h4><p>${e.description}</p></article>`).join('')}</div>`;
  }
  updateHUD(){
    if(!this.ui)return;
    this.ui.timer.textContent=LUM.formatTime(this.elapsed);
    const hearts=Array.from({length:3},(_,i)=>`<svg class="life-heart${i>=this.lives?' spent':''}" viewBox="0 0 48 44" aria-hidden="true"><use href="#${i>=this.lives?'heart-gray-symbol':'heart-symbol'}"/></svg>`).join('');
    if(this.ui.lives.innerHTML!==hearts)this.ui.lives.innerHTML=hearts;
    this.ui.lives.setAttribute('aria-label',`Жизни: ${this.lives} из 3`);this.ui.crystals.innerHTML=`${this.collected} <small>/ 10</small>`;
    const best=this.save.stats[this.chapter].best;this.ui.best.textContent=best===null?'—':LUM.formatTime(best);
    this.ui.score.textContent=`${this.score} очков`;this.ui.abilities.textContent=`${this.chapter+1}/4 · ${this.chapter===0?'J: удар':this.chapter===1?'двойной прыжок':this.chapter===2?'Shift: ускорение':`H: ${this.healAvailable?'лечение':'использовано'}`}`;
    this.ui['level-name'].textContent=this.level.config.name.toUpperCase();
    this.ui.pause.disabled=!['running','dying','paused'].includes(this.state);this.ui.pause.textContent=this.state==='paused'?'▶':'Ⅱ';
    this.ui.pause.setAttribute('aria-label',this.state==='paused'?'Продолжить':'Пауза');this.ui['chapter-select'].disabled=this.state==='running';
    this.ui['chapter-select'].value=this.chapter;
    this.ui.status.textContent={ready:'10 искр ждут своего хранителя',running:this.collected===10?'Найди врата →':'Собери 10 золотых кристаллов →',paused:'Путешествие на паузе',won:'Свет вернулся в Элорию',lost:'Искра погасла · попробуй снова',dying:'Свет собирается вновь…',menu:'',story:''}[this.state];
  }
  frame(timestamp){
    const dt=this.lastTimestamp===null?0:Math.min((timestamp-this.lastTimestamp)/1000,.1);this.lastTimestamp=timestamp;
    if(['running','dying'].includes(this.state)){
      this.accumulator+=dt;while(this.accumulator>=1/120&&['running','dying'].includes(this.state)){this.update(1/120);this.accumulator-=1/120;}
      if(this.state==='running')this.sound.tick(this.chapter);
    }
    this.renderer.draw(this);this.raf=requestAnimationFrame(this.frame);
  }
  destroy(){cancelAnimationFrame(this.raf);clearTimeout(this.toastTimeout);this.abort.abort();this.input.destroy();this.menu?.destroy();this.sound.destroy();}
};
