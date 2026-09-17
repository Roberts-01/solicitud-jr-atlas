const catalog={
  jrs:{
    title:'Asociados JR',
    items:[
      ['SOLICITUD JR-A CHAPALITA','Solicitud digital disponible','jr-25-29.html',true],
      ['SOLICITUD JR-A SENIOR CHAPALITA','Solicitud digital disponible','jr-a-senior.html',true],
      ['SOLICITUD JR-B CHAPALITA','Próximamente','#',false],
      ['SOLICITUD JR-B SENIOR CHAPALITA','Próximamente','#',false],
      ['SOLICITUD JR-C CHAPALITA','Próximamente','#',false],
      ['SOLICITUD JR-C SENIOR CHAPALITA','Próximamente','#',false],
      ['SOLICITUD JR-CASADO HASTA 40 AÑOS CHAPALITA','Próximamente','#',false],
      ['SOLICITUD JR-CASADO SENIOR HASTA 40 AÑOS CHAPALITA','Próximamente','#',false]
    ]
  },
  familiar:{
    title:'Familiar',
    items:[
      ['SOLICITUD FAMILIAR-A CHAPALITA','Próximamente','#',false],
      ['SOLICITUD FAMILIAR-B CHAPALITA','Próximamente','#',false],
      ['SOLICITUD FAMILIAR-C CHAPALITA','Próximamente','#',false],
      ['SOLICITUD FAMILIAR-CASADO HASTA 40 AÑOS CHAPALITA','Próximamente','#',false],
      ['SOLICITUD FAMILIAR-CASADO MÁS 40 AÑOS CHAPALITA','Próximamente','#',false]
    ]
  },
  papas:{
    title:'Papá / Nietos',
    items:[
      ['SOLICITUD NIETO HASTA 14 AÑOS CHAPALITA','Próximamente','#',false],
      ['SOLICITUD NIETO HASTA 24 AÑOS CHAPALITA','Próximamente','#',false],
      ['SOLICITUD NIETO SENIOR HASTA 14 AÑOS CHAPALITA','Próximamente','#',false],
      ['SOLICITUD PAPÁ CHAPALITA','Próximamente','#',false]
    ]
  }
};
const cards=document.getElementById('cards');
const title=document.getElementById('categoryTitle');
const count=document.getElementById('categoryCount');

function render(key){
  const group=catalog[key];
  title.textContent=group.title;
  count.textContent=`${group.items.length} formatos`;
  cards.innerHTML=group.items.map((x,i)=>`
    <article class="card ${x[3]?'enabled':'disabled'}">
      <div class="num">${String(i+1).padStart(2,'0')}</div>
      <div class="cardtext"><h3>${x[0]}</h3><p>${x[1]}</p></div>
      ${x[3]?`<a href="${x[2]}">Iniciar solicitud <span>→</span></a>`:`<button disabled>Próximamente</button>`}
    </article>`).join('');
}
document.querySelectorAll('.category').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.category').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  render(btn.dataset.cat);
}));
render('jrs');
