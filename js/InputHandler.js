LUM.InputHandler = class InputHandler {
  constructor(onCommand, isActive=()=>true) {
    this.keys = new Set(); this.jumpQueued = false;this.attackQueued=false;this.healQueued=false;
    this.abort=new AbortController();const options={signal:this.abort.signal};
    const allowed = ['KeyA','KeyD','KeyW','ArrowLeft','ArrowRight','ArrowUp','Space','Escape','KeyR','KeyJ','KeyH','ShiftLeft','ShiftRight'];
    window.addEventListener('keydown', e => {
      if (!isActive() || document.querySelector('dialog[open]') || !allowed.includes(e.code) || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      // Space на кнопке сохраняет обычную клавиатурную активацию.
      if (e.code === 'Space' && e.target.tagName === 'BUTTON') return;
      e.preventDefault();
      if (!e.repeat && !this.keys.has(e.code)) {
        if (['Space','KeyW','ArrowUp'].includes(e.code)) this.jumpQueued = true;
        if(e.code==='KeyJ')this.attackQueued=true;
        if(e.code==='KeyH')this.healQueued=true;
        if (e.code === 'Escape' || e.code === 'KeyR') onCommand(e.code);
      }
      this.keys.add(e.code);
    },options);
    window.addEventListener('keyup', e => this.keys.delete(e.code),options);
    window.addEventListener('blur', () => this.clear(),options);
    document.querySelectorAll('[data-key]').forEach(button => {
      button.addEventListener('pointerdown', e => {
        if(!isActive())return;
        e.preventDefault(); button.setPointerCapture(e.pointerId);
        this.keys.add(button.dataset.key);
        if (button.dataset.key === 'Space') this.jumpQueued = true;
        if(button.dataset.key==='KeyJ')this.attackQueued=true;
        if(button.dataset.key==='KeyH')this.healQueued=true;
      },options);
      for (const event of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(event, () => this.keys.delete(button.dataset.key),options);
    });
  }
  get axis() { return Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft')); }
  takeJump() { const value = this.jumpQueued; this.jumpQueued = false; return value; }
  get jumpHeld(){return ['Space','KeyW','ArrowUp'].some(code=>this.keys.has(code));}
  get sprintHeld(){return this.keys.has('ShiftLeft')||this.keys.has('ShiftRight');}
  takeAttack(){const value=this.attackQueued;this.attackQueued=false;return value;}
  takeHeal(){const value=this.healQueued;this.healQueued=false;return value;}
  clear() { this.keys.clear(); this.jumpQueued = false;this.attackQueued=false;this.healQueued=false; }
  destroy(){this.abort.abort();this.clear();}
};
