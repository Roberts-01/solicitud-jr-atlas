const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let step=1;
const today=new Date(),tz=today.getTimezoneOffset()*60000;
$('#fechaSolicitud').value=new Date(today-tz).toISOString().slice(0,10);

function showStep(n){
  step=n;
  $$('.panel').forEach(p=>p.classList.toggle('active',+p.dataset.step===n));
  $$('.step').forEach((s,i)=>{
    s.classList.toggle('active',i+1===n);
    s.classList.toggle('done',i+1<n);
    s.querySelector('b').textContent=i+1<n?'✓':i+1;
  });
  window.scrollTo({top:0,behavior:'smooth'});
}
function validCurrent(){
  const p=$(`.panel[data-step="${step}"]`);
  for(const el of p.querySelectorAll('input[required]')){
    if(!el.checkValidity()){el.reportValidity();return false}
  }
  return true;
}
$$('.next').forEach(b=>b.onclick=()=>{
  if(!validCurrent())return;
  if(step===2){
    $('#termHijo').textContent=$('#hijo').value;
    $('#termNacimiento').textContent=formatDate($('#nacimiento').value);
  }
  showStep(step+1);
});
$$('.prev').forEach(b=>b.onclick=()=>showStep(step-1));

function formatDate(v){
  if(!v)return'';
  const[y,m,d]=v.split('-');
  return`${d}/${m}/${y}`;
}
function longDate(v){
  if(!v)return{d:'',m:'',y:''};
  const[y,m,d]=v.split('-');
  const meses=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return{d:String(+d),m:meses[+m-1],y};
}
function setupPad(canvas){
  const ctx=canvas.getContext('2d');
  let drawing=false,hasInk=false,last=null;

  canvas.style.touchAction='none';
  canvas.style.userSelect='none';
  canvas.style.webkitUserSelect='none';
  canvas.style.cursor='crosshair';

  function resize(){
    const saved=hasInk?canvas.toDataURL('image/png'):null;
    const r=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
    canvas.width=Math.max(1,Math.round(r.width*dpr));
    canvas.height=Math.max(1,Math.round(r.height*dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.lineWidth=2.4;
    ctx.lineCap='round';
    ctx.lineJoin='round';
    ctx.strokeStyle='#111';
    if(saved){
      const img=new Image();
      img.onload=()=>ctx.drawImage(img,0,0,r.width,r.height);
      img.src=saved;
    }
  }

  function point(clientX,clientY){
    const r=canvas.getBoundingClientRect();
    return{x:clientX-r.left,y:clientY-r.top};
  }

  function begin(p){
    drawing=true;last=p;
    ctx.beginPath();
    ctx.moveTo(p.x,p.y);
    ctx.lineTo(p.x+0.01,p.y+0.01);
    ctx.stroke();
    hasInk=true;
  }

  function draw(p){
    if(!drawing)return;
    ctx.beginPath();
    ctx.moveTo(last.x,last.y);
    ctx.lineTo(p.x,p.y);
    ctx.stroke();
    last=p;hasInk=true;
  }

  function stop(){drawing=false;last=null}

  // Mouse / PC
  canvas.addEventListener('mousedown',e=>{
    if(e.button!==0)return;
    e.preventDefault();
    begin(point(e.clientX,e.clientY));
  });
  canvas.addEventListener('mousemove',e=>{
    if(!drawing)return;
    e.preventDefault();
    draw(point(e.clientX,e.clientY));
  });
  window.addEventListener('mouseup',stop);

  // Pantallas táctiles
  canvas.addEventListener('touchstart',e=>{
    e.preventDefault();
    const t=e.changedTouches[0];
    begin(point(t.clientX,t.clientY));
  },{passive:false});
  canvas.addEventListener('touchmove',e=>{
    if(!drawing)return;
    e.preventDefault();
    const t=e.changedTouches[0];
    draw(point(t.clientX,t.clientY));
  },{passive:false});
  canvas.addEventListener('touchend',e=>{e.preventDefault();stop()},{passive:false});
  canvas.addEventListener('touchcancel',stop,{passive:false});

  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('resize',resize);
  resize();

  return{
    clear(){
      const r=canvas.getBoundingClientRect();
      ctx.clearRect(0,0,r.width,r.height);
      hasInk=false;stop();
    },
    hasInk:()=>hasInk,
    data:()=>canvas.toDataURL('image/png')
  };
}
const pads={firmaTitular:setupPad($('#firmaTitular')),firmaHijo:setupPad($('#firmaHijo'))};
$$('[data-clear]').forEach(b=>b.onclick=()=>pads[b.dataset.clear].clear());

$('#jrForm').addEventListener('submit',e=>{
  e.preventDefault();
  if(!validCurrent())return;
  if(!pads.firmaTitular.hasInk()||!pads.firmaHijo.hasInk()){
    alert('Se requieren las dos firmas para generar la solicitud.');
    return;
  }
  generatePDF();
});

async function logoData(){
  try{
    const r=await fetch('atlas-logo.png'),b=await r.blob();
    return await new Promise((ok,no)=>{
      const fr=new FileReader();
      fr.onload=()=>ok(fr.result);fr.onerror=no;fr.readAsDataURL(b);
    });
  }catch(e){return null}
}
function addParagraph(doc,text,y,indent=0){
  doc.setFont('helvetica','normal');doc.setFontSize(10.3);doc.setLineHeightFactor(1.45);
  const x=15+indent,w=186-indent,lines=doc.splitTextToSize(text,w);
  doc.text(lines,x,y,{align:'justify',maxWidth:w});
  return y+lines.length*5.05+3.2;
}

async function generatePDF(){
  if(!window.jspdf){
    alert('No se pudo cargar el generador de PDF. Verifique su conexión a internet.');
    return;
  }
  const{jsPDF}=window.jspdf;
  const doc=new jsPDF({unit:'mm',format:'letter'}),W=216;
  const logo=await logoData();
  if(logo)doc.addImage(logo,'PNG',15,17,27,25);

  doc.setTextColor(0);
  doc.setFont('helvetica','bold');doc.setFontSize(13.5);
  doc.text('SOLICITUD ASOCIADO JR SENIOR 30 A 34 AÑOS',119,35,{align:'center'});

  const f=longDate($('#fechaSolicitud').value);
  doc.setFont('helvetica','normal');doc.setFontSize(10.5);
  doc.text(`Zapopan Jal, a ${f.d} de ${f.m} del ${f.y}`,128,55,{align:'center'});

  const titular=$('#titular').value.trim(),cert=$('#certificado').value.trim(),
        hijo=$('#hijo').value.trim(),nac=formatDate($('#nacimiento').value);

  doc.setFontSize(10.2);
  doc.text(titular,15,76);doc.line(15,77,128,77);
  doc.text('Titular del certificado',130,76);
  doc.text('No.',174,76);doc.text(cert,184,76);doc.line(183,77,204,77);

  let y=83;
  const p1=`Solicito sea admitido(a) mi hijo(a) ${hijo}, quien nació el día ${nac}, en la Categoría de “ASOCIADO JR SENIOR” y como tal continúe haciendo uso de las instalaciones del CLUB ATLAS CHAPALITA, en tanto no cumpla los 35 años y permanezca soltero(a).`;
  const p2='Al mismo tiempo, acepto que la cuota para asociado JUNIOR, que para este caso es del 50% (cincuenta) de la mensualidad vigente, sea incluida automáticamente en mi estado de cuenta, en la inteligencia que tengo el derecho en cualquier momento de renunciar a esta categoría, mediante simple aviso por escrito al CLUB y/o entrega de credencial de asociado, por ende se dejará de cobrar a partir del siguiente mes.';
  const p3=`Reconozco que mi hijo(a) ${hijo} tiene los mismos derechos y obligaciones para el CLUB ATLAS CHAPALITA como cualquier descendiente, y por lo tanto la calidad como asociado está condicionada a la tenencia a mi nombre del certificado de aportación del que se desprende su condición. En caso de cancelación o enajenación a terceros del certificado, se extinguirá la calidad de “ASOCIADO(A) JR SENIOR” que de dicho certificado se desprende.`;
  const p4='Por otra parte, me obligo para con el CLUB ATLAS CHAPALITA, que en el momento en que mi hijo(a) cambie de estado civil, lo comunicaré por escrito al club, en un periodo no mayor a 30 días naturales posteriores al matrimonio; de lo contrario acepto que perderá su calidad de “ASOCIADO(A) JR SENIOR” y con ello sus derechos.';
  const p5='Las anteriores manifestaciones son bajo formal protesta de decir verdad, así como las que posteriormente se hagan relacionadas con el asunto motivo de la presente.';

  y=addParagraph(doc,p1,y);
  y=addParagraph(doc,p2,y,13);
  y=addParagraph(doc,p3,y,13);
  y=addParagraph(doc,p4,y,13);
  y=addParagraph(doc,p5,y,13);

  const sigY=Math.max(y+1,218);
  doc.addImage(pads.firmaTitular.data(),'PNG',18,sigY-10,44,15);
  doc.addImage(pads.firmaHijo.data(),'PNG',77,sigY-10,44,15);
  doc.setLineWidth(.25);
  doc.line(15,sigY+7,63,sigY+7);
  doc.line(74,sigY+7,123,sigY+7);
  doc.line(146,sigY+7,197,sigY+7);
  doc.setFontSize(10);
  doc.text('TITULAR',39,sigY-1,{align:'center'});
  doc.text('ASOCIADO(A) JR',98.5,sigY-1,{align:'center'});
  doc.text('CLUB ATLAS CHAPALITA',171.5,sigY-1,{align:'center'});

  doc.setFont('helvetica','normal');doc.setFontSize(9.8);
  doc.text('Celular',18,sigY+24);doc.text($('#celular').value.trim(),36,sigY+24);doc.line(34,sigY+25,116,sigY+25);
  doc.text('Correo electrónico',18,sigY+34);doc.text($('#correo').value.trim(),52,sigY+34);doc.line(50,sigY+35,116,sigY+35);

  const safe=hijo.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+/g,'_');
  doc.save(`Solicitud_JR_B_Senior_${safe||'Asociado'}.pdf`);
  $('#status').textContent='PDF generado y descargado correctamente.';
}
