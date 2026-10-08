// Проверяем комплект файлов до запуска, чтобы ошибка публикации была понятной.
window.lumBootStarted=true;
(async function startGame(){
  const status=document.getElementById('load-status'),button=document.getElementById('new-game');
  try{
    const required=['Assets','InputHandler','Platform','Player','Enemy','Collectible','LevelManager','Particles','SoundManager','Renderer','Menu','Game'];
    const missing=required.filter(name=>!window.LUM?.[name]);
    if(missing.length)throw new Error('Отсутствуют файлы: '+missing.map(name=>'js/'+name+'.js').join(', '));
    await LUM.Assets.load();
    window.lumGame=new LUM.Game(document.getElementById('game'));
    button.disabled=false;button.textContent='Начать игру →';
    if(LUM.Assets.failed.length)status.textContent='Часть рисунков не загрузилась. Проверьте, что папка assets загружена целиком и названия файлов сохранены. Игра использует резервную графику.';
  }catch(error){
    button.disabled=true;button.textContent='Игра не загрузилась';
    status.textContent='Проверьте загрузку всех папок проекта на сайт. '+error.message;
    console.error('LUM: ошибка запуска',error);
  }
})();
