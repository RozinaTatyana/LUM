// Изображения хранятся вместе с проектом: сеть и сборщик не нужны.
// При ошибке загрузки остаётся процедурный рисунок, а игра продолжает работать.
LUM.Assets = { images: {}, crops: {lum:{x:300,y:20,w:1080,h:980},shell:{x:105,y:10,w:1390,h:960}}, loaded: false, failed: [] };
LUM.Assets.load = async function () {
  const names = ['garden', 'lum', 'ledge', 'shell', 'pillar', 'arch', 'caves', 'grotto', 'source', 'droplet', 'thornwing', 'hollowflower', 'thief', 'lumCrystal', 'lumWater', 'lumSource'];
  await Promise.all(names.map(name => new Promise(resolve => {
    const image = new Image();let settled=false;
    // На медленном хостинге одна зависшая картинка не блокирует всё меню.
    const timeout=setTimeout(()=>finish(false),15000);
    const finish=success=>{
      if(settled)return;settled=true;clearTimeout(timeout);
      if(success){this.images[name]=image;if(!this.crops[name])this.crops[name]={x:0,y:0,w:image.width,h:image.height};}
      else this.failed.push(name);
      resolve();
    };
    image.onload=()=>finish(true);
    image.onerror=()=>finish(false);
    image.src = `assets/${name}.png`;
  })));
  this.loaded = true;
};
