// Correção da função importCSV para o formato do CSV da Expandh
// Formato: Data Base (DDMMAAAA), Tipo, Período (DDMMAAAA), Receber, Recebido

function importCSV(inp){
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
      
      // Chave: período|tipo
      const k=periodo+'|'+tipo;
      
      if(!db[dt])db[dt]={};
      db[dt][k]={receber:receber,recebido:recebido};
      count++;
    });
    
    saveDB();
    fecharImport();
    toast(`📥 ${count} registros importados com sucesso!`);
    renderDias();
    if(dtSel)renderTabela();
  };
  r.readAsText(f,'UTF-8');
}

// Garante que a função sobrescreva a definição anterior
window.importCSV = importCSV;

console.log('✅ Correção de importação CSV carregada!');
