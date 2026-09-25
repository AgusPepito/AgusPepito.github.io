export function setupMenuUI(){
  const dialog=document.getElementById('controls-dialog');
  const device=matchMedia('(pointer: coarse)'),buttons=[...dialog.querySelectorAll('[data-controls-device]')];
  let override=null;
  function selectDevice(value){
    document.getElementById('controls-pc').hidden=value!=='pc';
    document.getElementById('controls-touch').hidden=value!=='touch';
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.controlsDevice===value)));
  }
  const refresh=()=>selectDevice(override??(device.matches?'touch':'pc'));
  for(const button of buttons)button.onclick=()=>{override=button.dataset.controlsDevice;refresh();};
  for(const id of ['open-controls','pause-controls'])document.getElementById(id).onclick=()=>{refresh();dialog.showModal();};
  for(const id of ['close-controls','controls-done'])document.getElementById(id).onclick=()=>dialog.close();
  device.addEventListener('change',refresh);refresh();
  const select=document.getElementById('level');
  for(const [id,step] of [['level-prev',-1],['level-next',1]])document.getElementById(id).onclick=()=>{
    select.selectedIndex=(select.selectedIndex+step+select.options.length)%select.options.length;
    select.dispatchEvent(new Event('change',{bubbles:true}));
  };
}
