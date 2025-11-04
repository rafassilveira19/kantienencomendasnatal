import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD--EURv-8FVYXXZUlAWq5mDCS-5Fn0W6k",
  authDomain: "kantinenatal.firebaseapp.com",
  projectId: "kantinenatal",
  storageBucket: "kantinenatal.firebasestorage.app",
  messagingSenderId: "70810843695",
  appId: "1:70810843695:web:b811a828b67efcb82ca4da",
  measurementId: "G-NSZG56D460"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function carregarProgresso() {
  const div = document.getElementById("progressoVendas");
  div.textContent = "Carregando dados...";

  try {
    const querySnapshot = await getDocs(collection(db, "pedidos"));
    const pedidos = querySnapshot.docs.map(doc => doc.data());

    let totalGrandes = 0;
    let totalMinis = 0;

    pedidos.forEach(pedido => {
      if (!Array.isArray(pedido.produtos)) return;
      pedido.produtos.forEach(prod => {
        const nome = prod.produto.trim().toLowerCase();
        if (nome.includes("mini")) {
          totalMinis += prod.quantidade;
        } else {
          totalGrandes += prod.quantidade;
        }
      });
    });

    const minisEquivalentes = Math.floor(totalMinis / 10);
    const totalEquivalente = totalGrandes + minisEquivalentes;

    const meta = 1800;
    const faltam = Math.max(meta - totalEquivalente, 0);
    const porcentagem = Math.min((totalEquivalente / meta) * 100, 100).toFixed(1);

    div.innerHTML = `
      <p><b>Grandes:</b> ${totalGrandes}</p>
      <p><b>Minis:</b> ${totalMinis} — equivalem a: <b>${minisEquivalentes}</b> grandes</p>
      <hr style="width:60%; margin:20px auto;">
      <p><b>Total equivalentes a grandes:</b> ${totalEquivalente}</p>

      <div class="barra">
        <div class="preenchido" style="width:${porcentagem}%;">${porcentagem}%</div>
      </div>

      <p style="font-size:20px; color:#b33c00;">
        🎯 Faltam <b>${faltam}</b> para bater a meta de ${meta}!
      </p>
    `;
  } catch (e) {
    console.error(e);
    div.textContent = "Erro ao carregar progresso 😞";
  }
}

carregarProgresso();
