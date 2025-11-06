import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"

const firebaseConfig = {
  apiKey: "AIzaSyD--EURv-8FVYXXZUlAWq5mDCS-5Fn0W6k",
  authDomain: "kantinenatal.firebaseapp.com",
  projectId: "kantinenatal",
  storageBucket: "kantinenatal.firebasestorage.app",
  messagingSenderId: "70810843695",
  appId: "1:70810843695:web:b811a828b67efcb82ca4da",
  measurementId: "G-NSZG56D460"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

window.addEventListener("DOMContentLoaded", () => {
  let encomendas = []
  let carrinho = []
  let entregues = []

  const tabelaBody = document.querySelector('#tabela tbody')
  const carrinhoBody = document.querySelector('#carrinhoTable tbody')
  const logDiv = document.getElementById('log')
  const entreguesContainer = document.getElementById("entreguesContainer")
  const tabelaEntreguesBody = document.querySelector("#tabelaEntregues tbody")
  const getEl = id => document.getElementById(id)

  const log = (msg, ok = true) => {
    logDiv.className = ok ? 'ok' : 'err'
    logDiv.textContent = msg
    setTimeout(() => logDiv.textContent = '', 2500)
  }

  function renderTabela() {
    tabelaBody.innerHTML = ''
    const pendentes = encomendas
      .filter(e => !e.entregue)
      .sort((a, b) => {
        const da = new Date(a.data)
        const db = new Date(b.data)
        if (da.getTime() !== db.getTime()) return da - db
        return a.hora.localeCompare(b.hora)
      })

    const grupos = {}
    pendentes.forEach(e => {
      if (!grupos[e.data]) grupos[e.data] = []
      grupos[e.data].push(e)
    })

    for (const data in grupos) {
      const linhaData = document.createElement('tr')
      const dataFormatada = new Date(data + "T00:00:00").toLocaleDateString('pt-BR')
      linhaData.innerHTML = `<td colspan="8" style="background:#ffe4cc;font-weight:bold;">📅 ${dataFormatada}</td>`
      tabelaBody.appendChild(linhaData)

      grupos[data].forEach(e => {
        const produtos = e.produtos.map(p => `${p.produto} (${p.quantidade})`).join(', ')
        const total = e.produtos.reduce((a, p) => a + p.quantidade, 0)
        const tr = document.createElement('tr')
        tr.innerHTML = `
          <td>${e.nome}</td>
          <td>${new Date(e.data + "T00:00:00").toLocaleDateString('pt-BR')}</td>
          <td>${e.hora || '-'}</td>
          <td>${e.retirada || '-'}</td>
          <td>${produtos}</td>
          <td><b>${total}</b></td>
          <td>${e.celular}</td>
          <td>
            <button class="btn-edit" data-id="${e.id}">✏️</button>
            <button class="btn-del" data-id="${e.id}">🗑️</button>
            <button class="btn-ok" data-id="${e.id}" style="background:#228b22;color:#fff;">✅</button>
          </td>`
        tabelaBody.appendChild(tr)
      })
    }
  }

  function renderCarrinho() {
    carrinhoBody.innerHTML = ''
    if (carrinho.length === 0) {
      carrinhoBody.innerHTML = `<tr><td colspan="3" style="color:#999;">Nenhum produto adicionado</td></tr>`
      return
    }
    carrinho.forEach((p, i) => {
      carrinhoBody.innerHTML += `
        <tr><td>${p.produto}</td><td>${p.quantidade}</td>
        <td><button type="button" data-i="${i}">🗑️</button></td></tr>`
    })
  }

  carrinhoBody.addEventListener('click', e => {
    const i = e.target?.dataset?.i
    if (i === undefined) return
    carrinho.splice(Number(i), 1)
    renderCarrinho()
  })

  getEl('produto').addEventListener('change', () => {
    getEl('outroProduto').style.display = getEl('produto').value === 'outro' ? 'inline-block' : 'none'
  })

  getEl('addBtn').addEventListener('click', () => {
    const produto = getEl('produto').value === 'outro' ? getEl('outroProduto').value.trim() : getEl('produto').value
    const qtd = parseInt(getEl('quantidade').value)
    if (!produto || !qtd || qtd <= 0) return log('Preencha produto e quantidade.', false)
    carrinho.push({ produto, quantidade: qtd })
    renderCarrinho()
    getEl('produtoForm').reset()
    getEl('outroProduto').style.display = 'none'
  })

  getEl('finalizarBtn').addEventListener('click', async () => {
    const nome = getEl('nome').value.trim()
    const data = getEl('data').value
    const hora = getEl('hora').value
    const retirada = getEl('retirada').value
    const celular = getEl('celular').value.trim()
    if (!nome || !data || !hora || !retirada || !celular || carrinho.length === 0)
      return log('Preencha tudo.', false)
    const pedido = { nome, data, hora, retirada, celular, produtos: [...carrinho], entregue: false }
    await addDoc(collection(db, "pedidos"), pedido)
    carrinho = []
    renderCarrinho()
    getEl('clienteForm').reset()
    carregarPedidos()
    log('Pedido salvo!')
  })

  tabelaBody.addEventListener('click', async e => {
    const id = e.target.dataset.id
    if (!id) return

    if (e.target.classList.contains('btn-del')) {
  const modal = document.getElementById('confirmModal')
  const btnConfirm = document.getElementById('confirmDelete')
  const btnCancel = document.getElementById('cancelDelete')

  modal.style.display = 'flex'

  btnCancel.onclick = () => {
    modal.style.display = 'none'
  }

  btnConfirm.onclick = async () => {
    try {
      await deleteDoc(doc(db, "pedidos", id))
      log('🗑️ Encomenda apagada com sucesso!')
      carregarPedidos()
    } catch (err) {
      console.error(err)
      log('Erro ao apagar encomenda.', false)
    }
    modal.style.display = 'none'
  }

  return


    }

    if (e.target.classList.contains('btn-edit')) {
      const ped = encomendas.find(p => p.id === id)
      if (!ped) return
      getEl('nome').value = ped.nome
      getEl('data').value = ped.data
      getEl('hora').value = ped.hora
      getEl('retirada').value = ped.retirada
      getEl('celular').value = ped.celular
      carrinho = [...ped.produtos]
      renderCarrinho()
      await deleteDoc(doc(db, "pedidos", id))
      log('Edite e finalize para salvar.')
      return
    }

    if (e.target.classList.contains('btn-ok')) {
      try {
        await updateDoc(doc(db, "pedidos", id), { entregue: true })
        log("✅ Pedido marcado como entregue!")
        carregarPedidos()
      } catch (err) {
        console.error(err)
        log("Erro ao marcar como entregue.", false)
      }
    }
  })

  document.getElementById('toggleEntregues').addEventListener('click', () => {
    const aberto = entreguesContainer.style.display === 'block'
    entreguesContainer.style.display = aberto ? 'none' : 'block'
    document.getElementById('toggleEntregues').textContent = aberto
      ? '📦 Encomendas Entregues ⬇️'
      : '📦 Encomendas Entregues ⬆️'
  })

  function buildResumoDoDia(dataISO) {
    const mapa = {}
    encomendas
      .filter(e => e?.data === dataISO && !e.entregue && Array.isArray(e.produtos))
      .forEach(e => {
        const hora = e.hora
        const retirada = e.retirada
        e.produtos.forEach(p => {
          const chave = `${retirada}|${hora}|${p.produto}`
          if (!mapa[chave]) mapa[chave] = { retirada, hora, produto: p.produto, quantidade: 0 }
          mapa[chave].quantidade += Number(p.quantidade)
        })
      })
    const grupos = {}
    Object.values(mapa).forEach(i => {
      if (!grupos[i.retirada]) grupos[i.retirada] = []
      grupos[i.retirada].push(i)
    })
    for (const k in grupos)
      grupos[k].sort((a, b) => a.hora.localeCompare(b.hora))
    return grupos
  }

  getEl('filtrarBtn').addEventListener('click', () => {
    const d = getEl('filtroData').value
    if (!d) return log('Escolha uma data.', false)
    window.resumoAgrupado = buildResumoDoDia(d)
    if (!window.resumoAgrupado || Object.keys(window.resumoAgrupado).length === 0)
      return log('Sem encomendas pendentes nessa data.')
    log('Relatório pronto para imprimir.')
  })

 getEl('imprimirBtn').addEventListener('click', () => {
  if (!window.resumoAgrupado || Object.keys(window.resumoAgrupado).length === 0)
    return log('Use o botão Filtrar antes.', false)

  const dataSelecionada = getEl('filtroData').value
  const dataFormatada = new Date(dataSelecionada + "T00:00:00").toLocaleDateString('pt-BR')

  let txt = `RELATÓRIO Do DIA ${dataFormatada}\n\n`

  for (const local in window.resumoAgrupado) {
    txt += `📍 ${local.toUpperCase()}\n`
    window.resumoAgrupado[local].forEach(i => {
      txt += `${i.hora} - ${i.quantidade} ${i.produto}\n`
    })
    txt += "\n"
  }

  const w = window.open('', '_blank')
  w.document.write(`<pre style="font-size:16px;font-family:monospace;white-space:pre-wrap;">${txt}</pre>`)
  w.document.close()
  w.focus()
  w.print()
})


  function renderEntregues() {
    tabelaEntreguesBody.innerHTML = ''
    const grupos = {}
    entregues
      .sort((a, b) => new Date(a.data) - new Date(b.data))
      .forEach(e => {
        if (!grupos[e.data]) grupos[e.data] = []
        grupos[e.data].push(e)
      })

    for (const data in grupos) {
      const linhaData = document.createElement('tr')
      const dataFormatada = new Date(data + "T00:00:00").toLocaleDateString('pt-BR')
      linhaData.innerHTML = `<td colspan="7" style="background:#e0ffe0;font-weight:bold;">📅 ${dataFormatada}</td>`
      tabelaEntreguesBody.appendChild(linhaData)

      grupos[data].forEach(e => {
        const produtos = e.produtos.map(p => `${p.produto} (${p.quantidade})`).join(', ')
        const total = e.produtos.reduce((a, p) => a + p.quantidade, 0)
        const tr = document.createElement('tr')
        tr.innerHTML = `
          <td>${new Date(e.data + "T00:00:00").toLocaleDateString('pt-BR')}</td>
          <td>${e.nome}</td>
          <td>${e.hora || '-'}</td>
          <td>${e.retirada || '-'}</td>
          <td>${produtos}</td>
          <td><b>${total}</b></td>
          <td>${e.celular}</td>`
        tabelaEntreguesBody.appendChild(tr)
      })
    }
  }

  async function carregarPedidos() {
    try {
      const querySnapshot = await getDocs(collection(db, "pedidos"))
      const todos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      encomendas = todos.filter(e => !e.entregue)
      entregues = todos.filter(e => e.entregue)
      renderTabela()
      renderEntregues()
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err)
      log("Erro ao carregar pedidos.", false)
    }
  }

  carregarPedidos()
  renderCarrinho()
})
