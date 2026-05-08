// Correções: Importação CSV formato compacto + Apenas dias úteis

// Definir variável meses (caso não exista no escopo global)
if (typeof meses === 'undefined') {
  window.meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
}

// 1. Substituir função importCSV para formato compacto
window.importCSV = function(inp){
  const f=inp.files[0];
  if(!f){
    toast('❌ Nenhum arquivo selecionado');
    return;
  }
  
  const r=new FileReader();
  r.onload=e=>{
    const conteudo = e.target.result;
    const linhas=conteudo.split('\n').slice(1).filter(l=>l.trim());
    
    let count=0;
    
    linhas.forEach((l)=>{
      const cols=l.trim().split(',');
      
      if(cols.length<5) return;
      
      // Parse Data Base: 01042026 → 2026-04-01
      const dtRaw=cols[0].trim();
      if(dtRaw.length!==8) return;
      const dtDia=dtRaw.substring(0,2);
      const dtMes=dtRaw.substring(2,4);
      const dtAno=dtRaw.substring(4,8);
      const dt=dtAno+'-'+dtMes+'-'+dtDia;
      
      // Parse Tipo
      const tipo=cols[1].trim();
      
      // Parse Período: 01102025 → 2025-10-01
      const perRaw=cols[2].trim();
      if(perRaw.length!==8) return;
      const perAno=perRaw.substring(4,8);
      const perMes=perRaw.substring(2,4);
      const periodo=perAno+'-'+perMes+'-01';
      
      // Parse valores (dividir por 100 para converter de centavos)
      let receber=parseFloat(cols[3])/100;
      let recebido=parseFloat(cols[4])/100;
      
      if(isNaN(receber)||isNaN(recebido)) return;
      
      // Chave: periodo|tipo
      const k=periodo+'|'+tipo;
      
      if(!db[dt])db[dt]={};
      db[dt][k]={receber:receber,recebido:recebido};
      count++;
    });
    
    saveDB();
    fecharImport();
    toast('✅ '+count+' registros importados com sucesso!');
    renderDias();
    if(dtSel)renderTabela();
  };
  r.readAsText(f,'UTF-8');
};

// 2. Função auxiliar para verificar se é dia útil (seg-sex)
function ehDiaUtil(data){
  const d = new Date(data+'T12:00:00');
  const diaSemana = d.getDay(); // 0=dom, 1=seg, 2=ter, 3=qua, 4=qui, 5=sex, 6=sab
  return diaSemana >= 1 && diaSemana <= 5; // seg a sex
}

// 3. Substituir renderDias para mostrar apenas dias úteis
const renderDiasOriginal = window.renderDias;

window.renderDias = function(){
  const $row=document.getElementById('diasRow');
  if(!$row) return;
  
  $row.innerHTML='';
  
  const hoje=new Date();
  const diasMostrar=10; // mostrar 10 dias úteis
  let diasAdicionados=0;
  let offset=-1;
  
  while(diasAdicionados<diasMostrar){
    const d=new Date(hoje);
    d.setDate(hoje.getDate()+offset);
    const dtStr=d.toISOString().split('T')[0];
    
    // Verificar se é dia útil
    if(ehDiaUtil(dtStr)){
      const[aa,mm,dd]=dtStr.split('-');
      const label=dd+'/'+meses[parseInt(mm)-1].substring(0,3);
      
      const btn=document.createElement('button');
      btn.textContent=label;
      btn.onclick=()=>abrirDia(dtStr);
      
      if(dtStr===hoje.toISOString().split('T')[0]){
        btn.style.background='#ff8800';
        btn.style.color='white';
      }
      
      $row.appendChild(btn);
      diasAdicionados++;
    }
    
    offset++;
    if(offset>100) break; // segurança
  }
};

console.log('✅ Correção de importação CSV carregada!');
console.log('✅ Filtro de dias úteis ativado!');
