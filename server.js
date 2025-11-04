
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
app.use(cors());
app.use(express.json());


const uri = "mongodb+srv://rafassilveira19:<sousa789>@kantine.vfqn2jm.mongodb.net/?appName=kantine";
const client = new MongoClient(uri);

const dbName = "kantine_natal";

async function conectar() {
  try {
    await client.connect();
    console.log("✅ conectado");
  } catch (err) {
    console.error("❌ nao conectou:", err);
  }
}
conectar();


app.post("/pedidos", async (req, res) => {
  try {
    const db = client.db(dbName);
    const pedidos = db.collection("pedidos");
    await pedidos.insertOne(req.body);
    res.status(200).json({ msg: "Pedido salvo no banco!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erro ao salvar pedido." });
  }
});


app.get("/pedidos", async (req, res) => {
  try {
    const db = client.db(dbName);
    const pedidos = db.collection("pedidos");
    const data = await pedidos.find().toArray();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ msg: "Erro ao buscar pedidos." });
  }
});

app.listen(3000, () => console.log("🚀 Servidor rodando em http://localhost:3000"));
