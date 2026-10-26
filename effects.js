'use strict';
(() => {
  const colors = { green:'#b7f58a', cyan:'#83e5f5', violet:'#c7a0ff', pink:'#f4a5d1' };
  const buttons=[...document.querySelectorAll('[data-rgb]')];
  buttons.forEach(button=>button.addEventListener('click',()=>{
    const mode=button.dataset.rgb;
    document.body.classList.toggle('rgb-live',mode==='auto');
    if(mode==='auto') document.body.style.removeProperty('--accent');
    else if(colors[mode]) document.body.style.setProperty('--accent',colors[mode]);
    buttons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  }));
  const productColors = { lavanda:'lavanda', grafito:'grafito', lima:'lima' };
  const productImage = document.querySelector('[data-preview-product-image]');
  const productButtons = [...document.querySelectorAll('[data-preview-color]')];
  productButtons.forEach(button=>button.addEventListener('click',()=>{
    const color=productColors[button.dataset.previewColor];
    if(!productImage || !color) return;
    productImage.src=`assets/headphones-${color}.webp`;
    productImage.alt=`Audífonos premium en color ${color}, fotografía de producto creada con IA`;
    productButtons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  }));
  const catalog=document.querySelector('.sector-catalog');
  if(catalog){
    const filters=[...catalog.querySelectorAll('[data-sector-filter]')];
    const cases=[...catalog.querySelectorAll('[data-sector-case]')];
    function selectSector(sector){
      const selected=filters.find(button=>button.dataset.sectorFilter===sector);
      if(!selected) return;
      const all=sector==='all';
      catalog.dataset.activeSector=sector;
      catalog.classList.toggle('catalog-filtered',!all);
      filters.forEach(button=>button.setAttribute('aria-pressed',String(button===selected)));
      cases.forEach(item=>{item.hidden=!all&&item.dataset.sectorCase!==sector;});
      catalog.querySelector('[data-catalog-product]').hidden=!all&&sector!=='tienda';
      catalog.querySelector('[data-web-count]').textContent=all?'6 proyectos web':'1 proyecto web';
      catalog.querySelector('[data-auto-count]').textContent=all?'6 automatizaciones por sector':'1 automatización para este negocio';
      catalog.querySelector('#catalog-summary').textContent=all?'12 proyectos: 6 páginas web y 6 automatizaciones.':`${selected.textContent.trim()}: un proyecto web y una automatización para explorar.`;
    }
    filters.forEach(button=>button.addEventListener('click',()=>selectSector(button.dataset.sectorFilter)));
    catalog.querySelector('[data-reset-catalog]').addEventListener('click',()=>{
      selectSector('all');
      catalog.querySelector('.catalog-filters').scrollIntoView({behavior:'auto',block:'start'});
      filters[0].focus({preventScroll:true});
    });
    document.querySelector('.navigation a[href="#automatizaciones"]')?.addEventListener('click',()=>selectSector('all'));
  }
})();
