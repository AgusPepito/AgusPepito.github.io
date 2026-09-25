// A shared course loader sits in the menu or covers a paused course handoff.
export class CourseLoading {
  constructor(){
    this.element=document.createElement('div');
    this.element.id='asset-notice';this.element.hidden=true;
    this.element.innerHTML=`<section class="loading-panel" aria-label="Course loading">
      <p class="loading-stage" role="status"></p>
      <div class="loading-heading"><strong class="loading-course"></strong><span class="loading-value" aria-hidden="true"></span></div>
      <div class="loading-track" role="progressbar" aria-label="Course preparation" aria-valuemin="0" aria-valuemax="100"><i></i></div>
      <p class="loading-error" role="alert" hidden>Could not load this course. Reload to try again.</p>
      <button class="loading-retry" type="button" hidden>RELOAD <span aria-hidden="true">↻</span></button>
    </section>`;
    this.stage=this.element.querySelector('.loading-stage');
    this.course=this.element.querySelector('.loading-course');
    this.value=this.element.querySelector('.loading-value');
    this.track=this.element.querySelector('.loading-track');
    this.error=this.element.querySelector('.loading-error');
    this.retry=this.element.querySelector('.loading-retry');
    this.retry.addEventListener('click',()=>location.reload());
    document.body.append(this.element);
  }
  update({visible,inMenu,name,percent,finalizing,error}){
    this.element.hidden=!visible;
    if(!visible)return;
    const parent=inMenu?document.getElementById('menu-loading-slot'):document.body;
    if(this.element.parentElement!==parent)parent.append(this.element);
    this.element.classList.toggle('in-menu',inMenu);
    this.element.dataset.finalizing=String(finalizing&&!error);
    this.element.dataset.error=String(Boolean(error));
    const stage=error?'LOAD FAILED':finalizing?'PREPARING VISUALS':'LOADING COURSE';
    if(this.stage.textContent!==stage)this.stage.textContent=stage;
    if(this.course.textContent!==name)this.course.textContent=name;
    const value=error?'!':finalizing?'…':`${percent}%`;
    if(this.value.textContent!==value)this.value.textContent=value;
    this.track.hidden=Boolean(error);
    this.track.style.setProperty('--load-progress',`${percent}%`);
    if(finalizing){
      this.track.removeAttribute('aria-valuenow');
      this.track.setAttribute('aria-valuetext','Preparing visuals');
    }else{
      this.track.setAttribute('aria-valuenow',String(percent));
      this.track.removeAttribute('aria-valuetext');
    }
    this.error.hidden=this.retry.hidden=!error;
  }
}
