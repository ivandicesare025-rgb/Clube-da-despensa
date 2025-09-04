import React, { useEffect, useMemo, useState } from "react";

const CONFIG = {
  lojaNome: "Clube da Despensa",
  descricaoCurta: "Curadoria em casa.",
  minimoPedidoReais: 300,00
  whatsappDestino: "5527992746410",
  catalogoUrl: "",
};

const formatBRL = (n) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

const DEFAULT_CATALOGO = [
  { id: "azeite-ev-500", nome: "Azeite Extra Virgem 500 ml", marca: "Blend Mediterrâneo", preco: 45, unidade: "garrafa", caseSize: 6, caseOnly: false, ativo: true },
  { id: "queijo-parmesao Argentino-1kg", nome: "Queijo Parmesão 1 kg", marca: "Cura 12 meses", preco: 120, unidade: "kg", caseSize: 1, caseOnly: false, ativo: true },
  { id: "picanha-angus-1kg", nome: "Picanha Angus 1 kg", marca: "Frisa Prime", preco: 89, unidade: "kg", caseSize: 1, caseOnly: false, ativo: true },
  { id: "azeitona-verde-2kg", nome: "Azeitona Verde 2 kg (baldinho)", marca: "La Finca", preco: 65, unidade: "balde 2 kg", caseSize: 4, caseOnly: true, ativo: true },
  { id: "provolone-kg", nome: "Provolone Defumado 1 kg", marca: "Italac", preco: 78, unidade: "kg", caseSize: 1, caseOnly: false, ativo: true },
];

function parseCSV(text) {
  const rows = [];
  let i = 0, field = '', row = [], inQuotes = false;
  while (i < text.length) {
    const char = text[i];
    if (inQuotes) {
      if (char === '\"') {
        if (text[i + 1] === '\"') { field += '\"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      } else { field += char; i++; continue; }
    } else {
      if (char === '\"') { inQuotes = true; i++; continue; }
      if (char === ',') { row.push(field); field = ''; i++; continue; }
      if (char === '\\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      if (char === '\\r') { i++; continue; }
      field += char; i++;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  const head = rows.shift()?.map((h) => h.trim().toLowerCase()) || [];
  return rows.filter((r) => r.some((c) => String(c).trim().length > 0)).map((r) => Object.fromEntries(head.map((h, idx) => [h, (r[idx] ?? '').trim()])));
}

function normalizeProduto(p) {
  return {
    id: p.id || `${(p.nome || '').toLowerCase().replace(/\\s+/g, '-')}`,
    nome: p.nome || '',
    marca: p.marca || '',
    preco: Number(String(p.preco || '').replace(',', '.')) || 0,
    unidade: p.unidade || '',
    caseSize: Number(p.casesize || p.caseSize || 1) || 1,
    caseOnly: String(p.caseonly || p.caseOnly || '').toLowerCase() === 'true',
    ativo: String(p.ativo || 'true').toLowerCase() !== 'false',
  };
}

function Badge({ children }) { return <span className="ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-xs">{children}</span>; }

function ProdutoCard({ item, qtd, setQtd }) {
  const [modoCaixa, setModoCaixa] = useState(item.caseOnly);
  const step = modoCaixa ? item.caseSize : 1;
  const handleChange = (val) => {
    let n = parseInt(val || 0, 10);
    if (isNaN(n) || n < 0) n = 0;
    if (modoCaixa) n = Math.round(n / item.caseSize) * item.caseSize;
    setQtd(item.id, n);
  };
  const inc = () => setQtd(item.id, (qtd || 0) + step);
  const dec = () => setQtd(item.id, Math.max(0, (qtd || 0) - step));
  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{item.nome}{item.caseOnly && <Badge>Caixa fechada</Badge>}</h3>
          <p className="text-sm text-gray-600">{item.marca}</p>
          <p className="mt-1 text-sm text-gray-700">Unidade: {item.unidade}</p>
          <p className="mt-2 text-base font-medium">{formatBRL(item.preco)}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4" checked={modoCaixa} onChange={(e) => { const checked = e.target.checked; setModoCaixa(checked); if (checked) { const atual = qtd || 0; const mult = Math.ceil(atual / item.caseSize) || 1; setQtd(item.id, mult * item.caseSize); } }} disabled={item.caseOnly} />
          Comprar em caixa (x{item.caseSize})
        </label>
        <div className="flex items-center rounded-xl border">
          <button className="px-3 py-2" onClick={dec} aria-label="Diminuir">−</button>
          <input className="w-16 border-x py-2 text-center" inputMode="numeric" value={qtd || ""} placeholder="0" onChange={(e) => handleChange(e.target.value)} />
          <button className="px-3 py-2" onClick={inc} aria-label="Aumentar">+</button>
        </div>
      </div>
    </div>
  );
}

function Resumo({ carrinho, total }) {
  const itens = Object.values(carrinho).filter((c) => c.qtd > 0);
  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <h3 className="text-lg font-semibold">Resumo</h3>
      {itens.length === 0 ? <p className="mt-2 text-sm text-gray-600">Seu carrinho está vazio.</p> :
        <ul className="mt-3 space-y-2 text-sm">{itens.map((c) => <li key={c.id} className="flex justify-between"><span>{c.qtd} × {c.nome}</span><span>{formatBRL(c.qtd * c.preco)}</span></li>)}</ul>}
      <div className="mt-4 flex items-center justify-between border-t pt-3 text-base font-medium"><span>Total</span><span>{formatBRL(total)}</span></div>
      <p className="mt-2 text-xs text-gray-600">Pedido mínimo: {formatBRL(CONFIG.minimoPedidoReais)}</p>
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [carrinho, setCarrinho] = useState({});
  const [cliente, setCliente] = useState({ nome: "", telefone: "", endereco: "", bairro: "", cidade: "", entrega: "", observacoes: "" });
  const [catalogo, setCatalogo] = useState(DEFAULT_CATALOGO);
  const [carregandoCatalogo, setCarregandoCatalogo] = useState(false);
  const [erroCatalogo, setErroCatalogo] = useState("");

  useEffect(() => {
    if (!CONFIG.catalogoUrl) return;
    setCarregandoCatalogo(true);
    fetch(CONFIG.catalogoUrl).then(async (res) => {
      const text = await res.text();
      const linhas = parseCSV(text);
      const lista = linhas.map(normalizeProduto).filter((p) => p.ativo);
      if (lista.length) setCatalogo(lista);
    }).catch(() => setErroCatalogo("Não foi possível carregar o catálogo externo.")).finally(() => setCarregandoCatalogo(false));
  }, []);

  const produtosFiltrados = useMemo(() => catalogo.filter((p) => [p.nome, p.marca].join(" ").toLowerCase().includes(query.toLowerCase())), [query, catalogo]);
  const setQtd = (id, qtd) => { const item = catalogo.find((x) => x.id === id); setCarrinho((prev) => ({ ...prev, [id]: { id, nome: item.nome, preco: item.preco, qtd: Math.max(0, qtd) } })); };
  const total = useMemo(() => Object.values(carrinho).reduce((acc, it) => acc + it.qtd * it.preco, 0), [carrinho]);
  const itensResumo = Object.values(carrinho).filter((i) => i.qtd > 0);
  const abaixoMinimo = total < CONFIG.minimoPedidoReais;

  const montarTextoPedido = () => {
    const linhasItens = itensResumo.map((i) => `• ${i.qtd} × ${i.nome} — ${formatBRL(i.preco)} = ${formatBRL(i.qtd * i.preco)}`).join("\\n");
    const texto = `Pedido — ${CONFIG.lojaNome}\\n\\n` +
      `Cliente: ${cliente.nome}\\n` + `Telefone: ${cliente.telefone}\\n` +
      `Endereço: ${cliente.endereco} — ${cliente.bairro} — ${cliente.cidade}\\n` +
      `Entrega desejada: ${cliente.entrega}\\n` +
      `${cliente.observacoes ? `Obs: ${cliente.observacoes}\\n` : ""}` +
      `\\nItens:\\n${linhasItens}\\n\\n` + `Total: ${formatBRL(total)}\\n` +
      `\\nCondições: pedido mínimo ${formatBRL(CONFIG.minimoPedidoReais)}. Pagamento antecipado.`;
    return encodeURIComponent(texto);
  };
  const enviarWhatsApp = () => { const url = `https://wa.me/${CONFIG.whatsappDestino}?text=${montarTextoPedido()}`; window.open(url, "_blank"); };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">{CONFIG.lojaNome}</h1>
        <p className="mt-1 text-gray-700">{CONFIG.descricaoCurta}</p>
        {carregandoCatalogo && <p className="mt-2 text-xs text-gray-500">Carregando catálogo externo…</p>}
        {erroCatalogo && <p className="mt-2 text-xs text-red-600">{erroCatalogo}</p>}
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <input className="w-full rounded-xl border px-4 py-2" placeholder="Buscar produto (azeite, queijo, carne...)" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {produtosFiltrados.map((p) => <ProdutoCard key={p.id} item={p} qtd={carrinho[p.id]?.qtd} setQtd={setQtd} />)}
          </div>
        </div>

        <aside className="space-y-4">
          <Resumo carrinho={carrinho} total={total} />
          <div className="rounded-2xl border p-4 shadow-sm">
            <h3 className="text-lg font-semibold">Dados para entrega</h3>
            <div className="mt-3 space-y-3">
              <input className="w-full rounded-xl border px-3 py-2" placeholder="Nome completo" value={cliente.nome} onChange={(e) => setCliente({ ...cliente, nome: e.target.value })} />
              <input className="w-full rounded-xl border px-3 py-2" placeholder="Telefone (WhatsApp)" value={cliente.telefone} onChange={(e) => setCliente({ ...cliente, telefone: e.target.value })} />
              <input className="w-full rounded-xl border px-3 py-2" placeholder="Endereço" value={cliente.endereco} onChange={(e) => setCliente({ ...cliente, endereco: e.target.value })} />
              <div className="flex gap-3">
                <input className="w-1/2 rounded-xl border px-3 py-2" placeholder="Bairro" value={cliente.bairro} onChange={(e) => setCliente({ ...cliente, bairro: e.target.value })} />
                <input className="w-1/2 rounded-xl border px-3 py-2" placeholder="Cidade" value={cliente.cidade} onChange={(e) => setCliente({ ...cliente, cidade: e.target.value })} />
              </div>
              <input type="date" className="w-full rounded-xl border px-3 py-2" value={cliente.entrega} onChange={(e) => setCliente({ ...cliente, entrega: e.target.value })} />
              <textarea className="w-full rounded-xl border px-3 py-2" placeholder="Observações (horário, portaria, substituições etc.)" rows={3} value={cliente.observacoes} onChange={(e) => setCliente({ ...cliente, observacoes: e.target.value })} />
              {abaixoMinimo && <p className="rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800">Seu pedido ainda não atingiu o mínimo de {formatBRL(CONFIG.minimoPedidoReais)}.</p>}
              <button className="w-full rounded-2xl bg-black px-4 py-3 text-white disabled:opacity-40" onClick={enviarWhatsApp} disabled={Object.values(carrinho).filter((i)=>i.qtd>0).length===0 or abaixoMinimo or not cliente.nome or not cliente.telefone}>Finalizar no WhatsApp</button>
              <p className="text-xs text-gray-600">Ao finalizar você será redirecionado ao WhatsApp com o resumo do pedido para confirmação.</p>
            </div>
          </div>
        </aside>
      </div>

      <footer className="mt-10 border-t pt-6 text-xs text-gray-500">
        <p>Este é um MVP. Para editar produtos sem redeploy, publique uma planilha no Google Sheets como CSV e coloque a URL em <code>CONFIG.catalogoUrl</code>. Colunas esperadas: <code>id, nome, marca, preco, unidade, caseSize, caseOnly, ativo</code>.</p>
      </footer>
    </div>
  );
}
