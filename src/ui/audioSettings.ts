import type {AudioPlayback} from '../audio/playback';
export function createAudioSettingsDialog(audio:AudioPlayback){
 const dialog=document.createElement('dialog');dialog.className='audio-dialog';dialog.setAttribute('aria-labelledby','audio-title');
 dialog.innerHTML='<div class="audio-heading"><h2 id="audio-title">Sound &amp; music</h2><button class="audio-close" type="button" aria-label="Close sound settings">×</button></div><button class="audio-mute" type="button"></button><label class="audio-volume"><span>Music <output id="music-value"></output></span><input id="music-volume" type="range" min="0" max="100" step="1"></label><label class="audio-volume"><span>Sound effects <output id="effects-value"></output></span><input id="effects-volume" type="range" min="0" max="100" step="1"></label><button class="audio-test" type="button">Test sound</button><p class="audio-status" role="status"></p><p class="audio-note">Audio is optional. All feedback remains visible on screen.</p>';
 document.body.append(dialog);
 const mute=dialog.querySelector<HTMLButtonElement>('.audio-mute')!,close=dialog.querySelector<HTMLButtonElement>('.audio-close')!,test=dialog.querySelector<HTMLButtonElement>('.audio-test')!,status=dialog.querySelector<HTMLElement>('.audio-status')!;
 const music=dialog.querySelector<HTMLInputElement>('#music-volume')!,effects=dialog.querySelector<HTMLInputElement>('#effects-volume')!;
 let opener:HTMLButtonElement|undefined;
 function update(){
  const s=audio.settings(),state=audio.status();
  mute.textContent=s.muted?'Enable audio':'Mute all audio';mute.setAttribute('aria-pressed',String(!s.muted));
  music.value=String(Math.round(s.music*100));effects.value=String(Math.round(s.effects*100));
  dialog.querySelector('#music-value')!.textContent=music.value+'%';dialog.querySelector('#effects-value')!.textContent=effects.value+'%';
  test.disabled=s.muted||s.effects===0||state==='unavailable';
  status.textContent=(state==='muted'?'All audio muted.':state==='ready'?'Audio enabled.':state==='unavailable'?'Audio is unavailable on this device.':'Audio needs a click to start.')+(audio.persisted()?'':' Preferences are session only.');
 }
 mute.addEventListener('click',()=>{const muted=!audio.settings().muted;audio.set({muted});if(!muted)void audio.activate();});
 music.addEventListener('input',()=>audio.set({music:Number(music.value)/100}));
 effects.addEventListener('input',()=>audio.set({effects:Number(effects.value)/100}));
 test.addEventListener('click',()=>{void audio.activate().then(()=>audio.play('gem'));});
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus();opener=undefined;});
 audio.subscribe(update);update();
 function bind(button:HTMLButtonElement){
  const refresh=()=>{const s=audio.settings();button.textContent=s.muted?'♪ Off':'♪ Audio';button.setAttribute('aria-label',s.muted?'Sound settings, audio muted':'Sound settings, audio enabled');button.setAttribute('title','Sound and music settings');button.setAttribute('aria-haspopup','dialog');};
  const open=()=>{opener=button;update();if(!dialog.open)dialog.showModal();mute.focus();};
  button.addEventListener('click',open);const unsubscribe=audio.subscribe(refresh);refresh();
  return ()=>{button.removeEventListener('click',open);unsubscribe();};
 }
 return {bind};
}
