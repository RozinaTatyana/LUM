// Меню отвечает за экраны вне уровня. Физика остаётся в Game и Player.
LUM.Menu = class Menu {
  constructor(game){
    this.game=game;this.root=document.getElementById('main-menu');
    this.story=document.getElementById('story');this.step=0;
    this.pages=[
      ['Пробуждение','Элория — забытое царство света. Когда-то природа и древние сооружения были связаны могучими Источниками. Теперь мир погружён во тьму.','garden'],
      ['Свет, который помнит','В тишине забытых садов просыпается LUM — маленькое существо, рождённое из утраченного света. Он слышит зов Источников и отправляется возвращать жизнь забытым местам.','caves'],
      ['Путь к Источнику','Собери десять искр в каждой из четырёх земель и пробуди врата. Встречные существа ранены тьмой: светящийся удар лепестком возвращает им покой. В конце пути ждёт Потухший источник.','source']
    ];
    this.abort=new AbortController();const options={signal:this.abort.signal};
    const on=(id,fn)=>document.getElementById(id).addEventListener('click',fn,options);
    on('new-game',()=>this.openStory(true));on('continue-game',()=>game.continueGame());
    on('menu-atlas',()=>{game.buildAtlas();game.ui.atlas.showModal();});
    for(const name of ['settings','help']){on('menu-'+name,()=>document.getElementById(name+'-dialog').showModal());on(name+'-close',()=>document.getElementById(name+'-dialog').close());}
    on('menu-story',()=>this.openStory(false));on('story-next',()=>{if(++this.step<this.pages.length)this.drawStory();else this.finishStory();});
    on('story-skip',()=>this.finishStory());on('story-back',()=>this.show());
    on('panel-menu',()=>game.toMenu());on('pause-settings',()=>document.getElementById('settings-dialog').showModal());
    document.querySelectorAll('dialog').forEach(d=>d.addEventListener('close',()=>game.input.clear(),options));
    this.loadSettings();
    document.getElementById('reduced-motion').addEventListener('change',()=>this.saveSettings(),options);
  }
  show(){
    this.game.state='menu';this.game.input.clear();this.game.sound.stop();this.game.ui.overlay.hidden=true;
    this.root.hidden=false;this.story.hidden=true;
    document.querySelector('.game-shell').dataset.screen='menu';
    this.game.canvas.tabIndex=-1;
    document.getElementById('continue-game').disabled=!this.game.hasSession();
    document.getElementById('menu-progress').textContent=`Открыто глав: ${this.game.save.unlocked+1} / 4`;
    document.getElementById('new-game').focus();
  }
  hide(){this.root.hidden=true;this.story.hidden=true;this.game.canvas.tabIndex=0;document.querySelector('.game-shell').dataset.screen='game';}
  openStory(newGame){this.newGame=newGame;this.step=0;this.game.state='story';this.root.hidden=true;this.story.hidden=false;this.drawStory();}
  drawStory(){
    const [title,text,image]=this.pages[this.step];
    this.story.style.backgroundImage=`linear-gradient(90deg,#030713f5,#04081770),url('assets/${image}.png')`;
    document.getElementById('story-number').textContent=`ИСТОРИЯ ЭЛОРИИ · ${this.step+1} / ${this.pages.length}`;
    document.getElementById('story-title').textContent=title;document.getElementById('story-text').textContent=text;
    document.getElementById('story-next').textContent=this.step===2?(this.newGame?'Отправиться в сады →':'Вернуться в меню'):'Далее →';
    document.getElementById('story-next').focus();
  }
  finishStory(){if(this.newGame)this.game.startLevel(0);else this.show();}
  loadSettings(){
    let s={};try{s=JSON.parse(localStorage.getItem('lum.settings.v1')||'{}')||{};}catch{}
    const g=this.game;g.sound.enabled=s.enabled!==false;g.sound.setVolume(Number.isFinite(s.volume)?LUM.clamp(s.volume,0,1):.25);
    g.ui.volume.value=g.sound.volume;g.ui.sound.textContent=g.sound.enabled?'♪':'♪ ×';g.ui.sound.setAttribute('aria-pressed',String(g.sound.enabled));
    document.getElementById('reduced-motion').checked=s.reducedMotion===true;this.applyMotion();
  }
  applyMotion(){this.game.reducedMotion=document.getElementById('reduced-motion').checked;document.body.classList.toggle('reduced-motion',this.game.reducedMotion);}
  saveSettings(){this.applyMotion();try{localStorage.setItem('lum.settings.v1',JSON.stringify({enabled:this.game.sound.enabled,volume:this.game.sound.volume,reducedMotion:this.game.reducedMotion}));}catch{}}
  destroy(){this.abort.abort();}
};
