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
      const label=dd+'/'+window.meses[parseInt(mm)-1].substring(0,3);      
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


// 4. Corrigir cálculo de diferença em tempo real
setTimeout(()=>{
  const inputs = document.querySelectorAll('input[type="number"]');
  inputs.forEach(inp=>{
    inp.addEventListener('input', function(){
      // Encontrar a linha da tabela
      const tr = this.closest('tr');
      if(!tr) return;
      
      // Pegar os valores de A Receber e Recebido
      const inputsRow = tr.querySelectorAll('input[type="number"]');
      if(inputsRow.length<2) return;
      
      const aReceber = parseFloat(inputsRow[0].value) || 0;
      const recebido = parseFloat(inputsRow[1].value) || 0;
      const diferenca = aReceber - recebido;
      
      // Encontrar a célula de diferença (7ª coluna)
      const cells = tr.querySelectorAll('td');
      if(cells.length >= 7){
        const difCell = cells[6];
        if(diferenca === 0){
          difCell.textContent = '—';
        } else {
          difCell.textContent = 'R$ ' + diferenca.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
          if(diferenca > 0) difCell.style.color = '#ff4444';
          else difCell.style.color = '#44ff44';
        }
      }
      
      // Calcular porcentagem (8ª coluna)
      if(cells.length >= 8 && aReceber > 0){
        const pctCell = cells[7];
        const pct = (recebido / aReceber) * 100;
        pctCell.textContent = pct.toFixed(2) + '%';
      }
    });
  });
}, 1000);

console.log('✅ Correção de cálculo de diferença ativada!');


// 5. Corrigir períodos para serem 6 meses retroativos baseados na data selecionada
const renderTabelaOriginal = window.renderTabela;

window.renderTabela = function(){
  if(!dtSel) return;
  
  // Calcular os 6 meses retroativos baseados na data selecionada
  const dataSel = new Date(dtSel+'T12:00:00');
  const periodos = [];
  
  for(let i=5; i>=0; i--){
    const d = new Date(dataSel);
    d.setMonth(dataSel.getMonth() - i);
    const per = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-01';
    periodos.push(per);
  }
  
  // Armazenar os períodos calculados globalmente
  window.periodosAtuais = periodos;
    window.janelaAtual = periodos; // Substituir janela global
  
  // Chamar função original
  renderTabelaOriginal();
};

console.log('✅ Períodos retroativos ativados!');
