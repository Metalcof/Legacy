'use strict';
(() => {
  const config = window.SITE_CONFIG || {};
  const brand = typeof config.name === 'string' && config.name.trim() ? config.name.trim() : 'Nexo Studio';
  const phone = String(config.phone || '573185314299').replace(/\D/g, '');
  const email = config.email || 'hernan.pipe12@gmail.com';
  document.querySelectorAll('[data-brand]').forEach(el => { el.textContent = brand; });
  document.title = brand + ' — De tu idea a tu nueva web';
  document.getElementById('year').textContent = new Intl.DateTimeFormat('en', {year:'numeric',timeZone:'America/Bogota'}).format(new Date());
  document.querySelectorAll('[data-email]').forEach(el => { el.href='mailto:'+email; el.textContent=email+' ↗'; });
  document.querySelectorAll('[data-whatsapp]').forEach(el => { el.href='https://wa.me/'+phone+'?text='+encodeURIComponent('Hola, '+brand+'. Me gustaría hablar sobre un proyecto.'); });

  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.navigation');
  function closeMenu(restoreFocus=false) {
    const wasOpen = nav.classList.contains('open');
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded','false');
    menu.setAttribute('aria-label','Abrir menú');
    if (restoreFocus && wasOpen) menu.focus({preventScroll:true});
  }
  menu.addEventListener('click', () => {
    const open=menu.getAttribute('aria-expanded')!=='true';
    nav.classList.toggle('open',open);
    menu.setAttribute('aria-expanded',String(open));
    menu.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');
  });
  nav.querySelectorAll('a').forEach(el=>el.addEventListener('click',()=>closeMenu()));
  document.addEventListener('click',event=>{
    if (!nav.contains(event.target) && !menu.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape') closeMenu(nav.contains(document.activeElement));
  });

  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton=document.querySelector('.motion-toggle');
  let manualPause=false;
  let toastTimer;
  function toast(message) {
    const element=document.getElementById('toast');
    element.textContent=message; element.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>element.classList.remove('visible'),4000);
  }
  function updateMotion() {
    const paused=manualPause||reducedMotion.matches;
    document.body.classList.toggle('motion-paused',paused);
    motionButton.setAttribute('aria-pressed',String(paused));
    motionButton.setAttribute('aria-label',paused?'Activar animaciones':'Pausar animaciones');
    motionButton.title=paused?'Activar animaciones':'Pausar animaciones';
    motionButton.querySelector('span').textContent=paused?'▷':'Ⅱ';
  }
  motionButton.addEventListener('click',()=>{
    if(reducedMotion.matches) { toast('Tu dispositivo tiene activada la opción de reducir movimiento.'); return; }
    manualPause=!manualPause; updateMotion();
  });
  reducedMotion.addEventListener('change',updateMotion);
  updateMotion();

  const dialog=document.getElementById('brief-dialog');
  const form=document.getElementById('brief-form');
  const service=document.getElementById('project-type');
  const submitButton=form.querySelector('.brief-submit');
  const notice=form.querySelector('.brief-notice');
  const feedback=document.getElementById('brief-feedback');
  let returnFocus=null;
  // Delegation also covers the call to action created by the final project stage.
  document.addEventListener('click',event=>{
    if(!(event.target instanceof Element)) return;
    const button=event.target.closest('[data-open-brief]');
    if(!button) return;
    returnFocus=nav.contains(button)&&window.matchMedia('(max-width: 960px)').matches?menu:button;
    closeMenu();
    if(button.dataset.service) service.value=button.dataset.service;
    feedback.textContent='';
    dialog.showModal();
    document.body.classList.add('dialog-open');
  });
  dialog.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{
    const rect=dialog.getBoundingClientRect();
    if(event.target===dialog&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close',()=>{
    document.body.classList.remove('dialog-open');
    if(returnFocus?.isConnected) returnFocus.focus({preventScroll:true});
  });
  form.addEventListener('change',()=>{
    const isEmail=new FormData(form).get('channel')==='email';
    submitButton.firstChild.textContent=isEmail?'Preparar correo ':'Enviar por WhatsApp ';
    notice.textContent=isEmail?'Abriremos tu aplicación de correo con el mensaje preparado. Tú decides cuándo enviarlo.':'Abriremos WhatsApp con tu mensaje preparado. Tú decides cuándo enviarlo.';
    feedback.textContent='';
  });
  form.addEventListener('submit',event=>{
    event.preventDefault();
    const values=new FormData(form);
    const name=String(values.get('name')||'').trim();
    const description=String(values.get('description')||'').trim();
    if(!name||!description) { feedback.textContent='Escribe tu nombre y una breve descripción de tu idea.'; return; }
    const message='Hola, '+brand+'. Soy '+name+'.\n\nMe interesa: '+values.get('service')+'.\n\nMi idea:\n'+description+'\n\nMe gustaría conocer una propuesta para mi proyecto.';
    const link=document.createElement('a');
    if(values.get('channel')==='email') {
      link.href='mailto:'+email+'?subject='+encodeURIComponent('Nuevo proyecto: '+values.get('service'))+'&body='+encodeURIComponent(message);
      feedback.textContent='Si no se abrió tu aplicación de correo, puedes escribirnos a '+email+'.';
    } else {
      link.href='https://wa.me/'+phone+'?text='+encodeURIComponent(message);
      link.target='_blank'; link.rel='noopener noreferrer';
      feedback.textContent='Tu mensaje está preparado en WhatsApp. Revísalo y presiona enviar para contactarnos.';
    }
    document.body.append(link); link.click(); link.remove();
  });
})();
