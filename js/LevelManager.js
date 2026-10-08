// Каждая глава задаётся данными, а не копией игрового цикла.
LUM.LEVELS = [
  {
    name:'Забытые сады', subtitle:'Пробуждение', background:'garden', hero:'lum', color:'#ffe1a6',
    description:'Древние сады Элории. Верни первые искры в мир, погружённый во тьму.',
    abilities:'J — светящий удар. Собери 10 кристаллов и дойди до врат.',
    platforms:[[0,390,440],[510,350,190],[770,250,190],[1030,350,180],[1290,450,220],[1590,510,480],[2140,450,180],[2390,390,190],[2650,450,180],[2890,520,410]],
    gems:[[0,350],[1,60],[2,60],[3,60],[4,75],[5,55],[5,425],[6,55],[7,60],[8,55]],
    enemies:[['droplet',1,40,125],['shell',5,145,290]], hazards:[[5,370,50]],
  },
  {
    name:'Хрустальные пещеры', subtitle:'Глубже в Элорию', background:'caves', hero:'lumCrystal', color:'#c9d8ff',
    description:'Лиловые кристаллы и движущиеся карнизы. Свет LUM становится холоднее и сильнее.',
    abilities:'Открыт двойной прыжок: повторно нажми Space в воздухе.',
    platforms:[[0,510,360],[425,430,180],[675,345,170],[920,250,180],[1170,340,190],[1430,440,310],[1810,355,180],[2060,270,180],[2310,360,210],[2600,450,560]],
    gems:[[0,260],[1,65],[2,55],[3,65],[4,65],[5,190],[6,60],[7,60],[8,80],[9,375]],
    moving:[{index:4,axis:'y',range:24,speed:.8},{index:6,axis:'y',range:22,speed:.7}],
    enemies:[['thornwing',2,20,125],['hollowflower',5,80,80],['droplet',9,90,220]], hazards:[[9,280,50]],
  },
  {
    name:'Водные гроты', subtitle:'Затопленные глубины', background:'grotto', hero:'lumWater', color:'#abedff',
    description:'Затопленные руины, холодные водопады и отражения. Панцирники охраняют озёра.',
    abilities:'Двойной прыжок + ускорение: удерживай Shift во время движения.',
    platforms:[[0,440,350],[420,370,200],[690,450,210],[970,360,190],[1230,275,200],[1500,380,340],[1910,470,200],[2180,390,200],[2450,305,200],[2720,435,530]],
    gems:[[0,255],[1,75],[2,75],[3,65],[4,70],[5,225],[6,70],[7,70],[8,70],[9,370]],
    moving:[{index:2,axis:'x',range:20,speed:.7},{index:7,axis:'y',range:20,speed:.6}],
    enemies:[['shell',5,70,150],['thief',9,80,230],['thornwing',4,10,130]], hazards:[[9,285,58]],
  },
  {
    name:'Потухший источник', subtitle:'Возрождение', background:'source', hero:'lumSource', color:'#f5c3f6',
    description:'Сердце сада. Найди последние искры, успокой Хранителя и пробуди Источник.',
    abilities:'Двойной прыжок, ускорение и H — лечение один раз за попытку.',
    platforms:[[0,470,360],[425,395,190],[685,310,190],[945,400,220],[1235,485,320],[1630,395,210],[1910,300,190],[2170,395,220],[2460,480,680]],
    gems:[[0,270],[1,65],[2,65],[3,80],[4,220],[5,70],[6,65],[7,80],[8,380],[8,580]],
    enemies:[['hollowflower',4,65,65],['thornwing',6,15,125],['thief',3,35,110],['guardian',8,150,150]],
    hazards:[[8,430,52]],
  }
];

LUM.LevelManager = class LevelManager {
  constructor(index=0) {
    this.index=index; this.config=LUM.LEVELS[index]; this.height=720;this.projectiles=[];this.clouds=[];
    this.platforms=this.config.platforms.map(p=>new LUM.Platform(...p));
    this.width=this.platforms.at(-1).x+this.platforms.at(-1).w;
    this.spawn={x:180,y:this.platforms[0].y-64}; this.checkpoint={...this.spawn};
    for(const m of this.config.moving||[])this.platforms[m.index].motion={...m};
    this.collectibles=this.config.gems.map(([i,offset],n)=>{
      const p=this.platforms[i],gem=new LUM.Collectible(p.x+offset,p.y-65,n);
      gem.anchor=p;gem.offset=offset;return gem;
    });
    this.enemies=this.config.enemies.map(([type,i,left,right])=>{
      const p=this.platforms[i];return new LUM.Enemy(type,p.x+left,p.y,p.x+left,p.x+right,p);
    });
    this.hazards=(this.config.hazards||[]).map(([i,offset,w])=>({x:this.platforms[i].x+offset,y:this.platforms[i].y-48,w,h:48}));
    for(let i=0;i<this.platforms.length-1;i++){
      const p=this.platforms[i],next=this.platforms[i+1];
      this.hazards.push({x:p.x+p.w+4,y:590,w:next.x-p.x-p.w-8,h:70});
    }
    const last=this.platforms.at(-1);this.exit={x:last.x+last.w-110,y:last.y-115,w:80,h:115};
  }
  updatePlatforms(time) { for(const p of this.platforms)p.update(time); }
  updateCheckpoint(player) {
    const p=player.standingOn;
    if(!player.grounded||!p||p.motion)return;
    const area={x:player.x-60,y:player.y,w:player.w+120,h:player.h};
    if(player.x>=p.x+5&&player.x+player.w<=p.x+p.w-5&&!this.hazards.some(h=>LUM.overlap(area,h))&&!this.enemies.some(e=>e.alive&&LUM.overlap(area,e)))this.checkpoint={x:player.x,y:player.y};
  }
};
