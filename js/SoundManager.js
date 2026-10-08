// Авторский синтез Web Audio: звуковые файлы и сторонняя музыка не используются.
LUM.SoundManager = class SoundManager {
  constructor(){this.enabled=true;this.volume=.25;this.context=null;this.voices=new Set();this.note=0;this.nextNote=0;}
  async unlock(){
    if(!this.enabled)return;
    const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
    if(!this.context){this.context=new Audio();this.master=this.context.createGain();this.master.connect(this.context.destination);this.master.gain.value=this.volume;}
    try{await this.context.resume();}catch{/* При запрете аудио игра продолжает работать. */}
  }
  setVolume(value){this.volume=LUM.clamp(Number(value),0,1);if(this.master)this.master.gain.setTargetAtTime(this.enabled?this.volume:0,this.context.currentTime,.03);}
  toggle(){this.enabled=!this.enabled;this.setVolume(this.volume);if(this.enabled)this.unlock();else this.stop();}
  tone(frequency,duration=.18,amplitude=.15,type='sine'){
    if(!this.enabled||!this.context||this.context.state!=='running')return;
    const c=this.context,o=c.createOscillator(),gain=c.createGain(),start=c.currentTime;
    o.type=type;o.frequency.value=frequency;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(amplitude,start+.015);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    o.connect(gain);gain.connect(this.master);this.voices.add(o);o.onended=()=>{this.voices.delete(o);o.disconnect();gain.disconnect();};o.start();o.stop(start+duration);
  }
  effect(name){const notes={jump:440,collect:880,hit:145,attack:620,win:1046,heal:740};this.tone(notes[name]||440,name==='win'?.65:.18,.15,name==='hit'?'triangle':'sine');}
  tick(chapter){
    if(!this.context||!this.enabled)return;
    const now=this.context.currentTime;if(now<this.nextNote)return;
    const melody=[261.63,329.63,392,523.25,440,392,329.63,293.66];
    this.tone(melody[this.note++%melody.length]*(chapter===2?.75:1),1.05,.055);this.nextNote=now+.65;
  }
  stop(){for(const voice of this.voices){try{voice.stop();}catch{}}this.voices.clear();this.nextNote=0;}
  destroy(){this.stop();this.context?.close();}
};
