import {CAMPAIGN_AREAS,CAMPAIGN_LEVELS,areaLevels,campaignArea,campaignLabel} from './campaign.js';

export class CampaignMenu {
  constructor(progress,practice,onSelect){
    this.progress=progress;this.practice=practice;this.onSelect=onSelect;
    document.body.classList.add('area-campaign');
    document.getElementById('campaign-picker').hidden=false;
    document.getElementById('construction-level-choice').hidden=true;
    document.getElementById('campaign-mode').hidden=false;
    this.areaButtons=CAMPAIGN_AREAS.map(area=>{
      const card=document.createElement('article');card.className='area-card';
      card.setAttribute('aria-label',`${area.name} levels`);
      const button=document.createElement('button');button.type='button';button.className='area-cover';
      const image=document.createElement('img');image.src=`${import.meta.env.BASE_URL}${area.image}`;
      image.alt='';image.width=2172;image.height=724;image.decoding='async';image.loading='lazy';image.draggable=false;
      const copy=document.createElement('span');copy.className='area-card-copy';
      const name=document.createElement('strong'),description=document.createElement('small');
      name.textContent=area.name;description.textContent=`${area.theme} · ${area.skill}`;
      copy.append(name,description);button.append(image,copy);card.append(button);
      const levels=areaLevels(area.id);
      button.addEventListener('click',()=>{
        onSelect((levels.find(level=>!progress.completed.has(level.id))??levels[0]).index);
      });
      const nodes=document.createElement('div');nodes.className='area-levels';
      nodes.setAttribute('role','group');nodes.setAttribute('aria-label',`${area.name} levels`);
      const levelButtons=levels.map((level,ordinal)=>{
        const node=document.createElement('button');node.type='button';
        node.textContent=String(ordinal+1).padStart(2,'0');node.title=level.name;
        node.addEventListener('click',()=>onSelect(level.index));nodes.append(node);
        return {level,node};
      });
      const selectedName=document.createElement('p');selectedName.className='area-level-name';
      card.append(nodes,selectedName);document.getElementById('area-tabs').append(card);
      return {area,card,button,levelButtons,selectedName};
    });
    const strip=document.getElementById('area-tabs'),previous=document.getElementById('area-prev'),next=document.getElementById('area-next');
    const step=()=>this.areaButtons[0].card.getBoundingClientRect().width+parseFloat(getComputedStyle(strip).columnGap);
    this.refreshNavigation=()=>{
      if(!strip.clientWidth)return;
      const index=Math.min(this.areaButtons.length-1,Math.max(0,Math.round(strip.scrollLeft/step())));
      this.browsedArea=this.areaButtons[index].area.id;
      previous.disabled=strip.scrollLeft<=1;
      next.disabled=strip.scrollLeft>=strip.scrollWidth-strip.clientWidth-1;
    };
    for(const [button,direction] of [[previous,-1],[next,1]])button.addEventListener('click',()=>{
      const width=step(),index=Math.round(strip.scrollLeft/width)+direction;
      strip.scrollTo({left:Math.max(0,Math.min(this.areaButtons.length-1,index))*width,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    });
    strip.addEventListener('scroll',this.refreshNavigation,{passive:true});
    window.addEventListener('resize',this.refreshNavigation,{passive:true});
    const mode=document.getElementById('campaign-mode'),url=new URL(location.href);
    url.searchParams.delete('campaign');url.searchParams.delete('level');
    if(practice)url.searchParams.delete('practice');else url.searchParams.set('practice','1');
    mode.href=url.href;mode.textContent=practice?'Campaign':'Practice';
    mode.title=practice?'Return to campaign':'Practice any area without saving progress';
  }
  select(index){
    const area=campaignArea(index),levels=areaLevels(area.id),progress=this.progress;
    const clearedTotal=CAMPAIGN_LEVELS.filter(level=>progress.completed.has(level.id)).length;
    const completion=document.getElementById('campaign-completion');
    completion.textContent=`${clearedTotal}/${CAMPAIGN_LEVELS.length}`;
    completion.setAttribute('aria-label',`${clearedTotal} of ${CAMPAIGN_LEVELS.length} levels cleared`);
    for(const entry of this.areaButtons){
      const unlocked=this.practice||progress.unlocked(entry.area.id);
      const previous=CAMPAIGN_AREAS[CAMPAIGN_AREAS.indexOf(entry.area)-1];
      const lockedReason=previous?`Complete ${previous.name} to unlock`:'Complete previous areas to unlock';
      const active=entry.area.id===area.id;
      entry.button.disabled=!unlocked;
      entry.button.setAttribute('aria-pressed',String(active));
      entry.card.classList.toggle('selected',active);entry.card.classList.toggle('locked',!unlocked);
      const completed=areaLevels(entry.area.id).filter(level=>progress.completed.has(level.id)).length;
      entry.button.setAttribute('aria-label',`${entry.area.name}. ${entry.area.skill}. ${unlocked?`${completed} of ${entry.levelButtons.length} levels cleared`:lockedReason}.`);
      entry.button.title=unlocked?`${entry.area.theme} · ${entry.area.skill}`:lockedReason;
      for(const {level,node} of entry.levelButtons){
        const cleared=progress.completed.has(level.id);
        node.disabled=!unlocked;node.classList.toggle('complete',cleared);
        node.setAttribute('aria-pressed',String(level.index===index));
        node.setAttribute('aria-label',`${campaignLabel(level.index)}${cleared?' · complete':''}${unlocked?'':' · locked'}`);
      }
      entry.selectedName.textContent=active?levels.find(level=>level.index===index).name:unlocked?'':'LOCKED';
    }
    // Browsing the carousel does not select/load a course. Keep the active card
    // in view only on an actual area change, not on every level selection.
    if(this.selectedArea!==area.id){
      this.selectedArea=area.id;
      this.browsedArea=area.id;
      this.pendingScrollArea=area.id;
    }
    requestAnimationFrame(()=>{
      const strip=document.getElementById('area-tabs');
      // Checkpoint handoffs update the selection while the menu is hidden.
      // Defer alignment until the menu has a layout again.
      if(strip.clientWidth&&this.pendingScrollArea){
        const selected=this.areaButtons.find(entry=>entry.area.id===this.pendingScrollArea).card;
        const stripBox=strip.getBoundingClientRect(),cardBox=selected.getBoundingClientRect();
        strip.scrollTo({left:strip.scrollLeft+cardBox.left-stripBox.left,behavior:'instant'});
        this.pendingScrollArea=null;
      }
      this.refreshNavigation();
    });
    // Keep the existing start/control wiring and construction selector intact;
    // campaign players choose levels with the buttons inside each area card.
    const select=document.getElementById('level');select.replaceChildren();
    for(const level of levels){
      const completed=progress.completed.has(level.id),label=campaignLabel(level.index);
      const option=document.createElement('option');option.value=level.index;option.textContent=`${label}${completed?' ✓':''}`;select.append(option);
    }
    select.value=String(index);
  }
}
