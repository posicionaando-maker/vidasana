/* =========================================================
   Vida Sana · Catálogo dinámico
   - Funciona en index.html (destacados + buscador)
   - Funciona en productos.html (filtros por categoría + todos)
   - Categorías y productos se leen desde productos.json
   ========================================================= */

const RUTA_JSON = 'productos.json';

let productos = [];
let vendedor = { whatsapp: '', mensaje: '' };
let categoriaActiva = 'todos';

document.addEventListener('DOMContentLoaded', iniciar);

async function iniciar() {
  try {
    const respuesta = await fetch(RUTA_JSON);
    if (!respuesta.ok) throw new Error('No se pudo cargar productos.json');

    const datos = await respuesta.json();
    productos = Array.isArray(datos.productos) ? datos.productos : [];
    vendedor = datos.vendedor || { whatsapp: '', mensaje: '' };

    // Botón flotante siempre
    configurarWhatsappFlotante();

    // Detectar en qué página estamos
    const esPaginaProductos = !!document.getElementById('filtros');
    const esPaginaIndex = !!document.getElementById('lista-destacados');

    if (esPaginaProductos) {
      // --- productos.html ---
      generarBotonesCategorias();
      renderizarProductos('todos');
    } else if (esPaginaIndex) {
      // --- index.html: mostrar primeros 6 + buscador ---
      renderizarDestacados(productos.slice(0, 6));
      activarBuscador();
    }

  } catch (error) {
    console.error(error);
    const contenedor =
      document.getElementById('lista-productos') ||
      document.getElementById('lista-destacados');
    if (contenedor) {
      contenedor.innerHTML =
        '<p class="sin-resultados">No se pudieron cargar los productos. Intenta más tarde.</p>';
    }
  }
}

/* ---------- Categorías dinámicas (solo productos.html) ---------- */

function obtenerCategoriasUnicas() {
  const set = new Set();
  productos.forEach(p => {
    if (p.categoria && typeof p.categoria === 'string') {
      set.add(p.categoria.trim().toLowerCase());
    }
  });
  return Array.from(set);
}

function capitalizar(texto) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function generarBotonesCategorias() {
  const contenedor = document.getElementById('filtros');
  if (!contenedor) return;
  contenedor.innerHTML = '';

  const categorias = obtenerCategoriasUnicas();

  const btnTodos = crearBoton('todos', 'Todos');
  btnTodos.classList.add('activo');
  contenedor.appendChild(btnTodos);

  categorias.forEach(cat => {
    contenedor.appendChild(crearBoton(cat, capitalizar(cat)));
  });
}

function crearBoton(valor, etiqueta) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = etiqueta;
  btn.dataset.categoria = valor;
  btn.addEventListener('click', () => {
    categoriaActiva = valor;
    actualizarBotonActivo();
    renderizarProductos(valor);
  });
  return btn;
}

function actualizarBotonActivo() {
  const botones = document.querySelectorAll('#filtros button');
  botones.forEach(b => {
    b.classList.toggle('activo', b.dataset.categoria === categoriaActiva);
  });
}

/* ---------- Render de productos (productos.html) ---------- */

function renderizarProductos(categoria) {
  const contenedor = document.getElementById('lista-productos');
  if (!contenedor) return;
  contenedor.innerHTML = '';

  const filtrados = (categoria === 'todos')
    ? productos
    : productos.filter(p => (p.categoria || '').trim().toLowerCase() === categoria);

  if (filtrados.length === 0) {
    contenedor.innerHTML = '<p class="sin-resultados">No hay productos en esta categoría por ahora.</p>';
    return;
  }

  const fragmento = document.createDocumentFragment();
  filtrados.forEach(p => fragmento.appendChild(crearTarjeta(p)));
  contenedor.appendChild(fragmento);
}

/* ---------- Render de destacados (index.html) ---------- */

function renderizarDestacados(lista) {
  const contenedor = document.getElementById('lista-destacados');
  if (!contenedor) return;
  contenedor.innerHTML = '';

  if (!lista || lista.length === 0) {
    contenedor.innerHTML = '<p class="sin-resultados">Aún no hay productos disponibles.</p>';
    return;
  }

  const fragmento = document.createDocumentFragment();
  lista.forEach(p => fragmento.appendChild(crearTarjeta(p)));
  contenedor.appendChild(fragmento);
}

/* ---------- Buscador (index.html) ---------- */

function activarBuscador() {
  const input = document.getElementById('buscador');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();

    if (!q) {
      renderizarDestacados(productos.slice(0, 6));
      return;
    }

    const resultados = productos.filter(p => {
      const nombre = (p.nombre || '').toLowerCase();
      const desc = (p.descripcion || '').toLowerCase();
      const cat = (p.categoria || '').toLowerCase();
      return nombre.includes(q) || desc.includes(q) || cat.includes(q);
    });

    renderizarDestacados(resultados);
  });
}

/* ---------- Tarjeta de producto ---------- */

function crearTarjeta(producto) {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'tarjeta';

  const img = document.createElement('img');
  img.src = producto.imagen || '';
  img.alt = producto.nombre || 'Producto';
  img.loading = 'lazy';
  tarjeta.appendChild(img);

  const info = document.createElement('div');
  info.className = 'tarjeta-info';

  const titulo = document.createElement('h3');
  titulo.textContent = producto.nombre || 'Producto';
  info.appendChild(titulo);

  const desc = document.createElement('p');
  desc.className = 'descripcion';
  desc.textContent = producto.descripcion || '';
  info.appendChild(desc);

  const precio = document.createElement('p');
  precio.className = 'precio';
  const moneda = producto.moneda || 'USD';
  precio.textContent = formatearPrecio(producto.precio, moneda);
  info.appendChild(precio);

    tarjeta.appendChild(info);
  return tarjeta;
}

function formatearPrecio(precio, moneda) {
  if (precio === undefined || precio === null || precio === '') return '';
  const num = Number(precio);
  if (isNaN(num)) return String(precio) + ' ' + moneda;
  return `${num.toFixed(2)} ${moneda}`;
}

/* ---------- WhatsApp ---------- */

function construirUrlWhatsapp() {
  const numero = (vendedor.whatsapp || '').replace(/\D/g, '');
  const mensaje = encodeURIComponent(vendedor.mensaje || 'Hola, quiero más información');
  return `https://wa.me/${numero}?text=${mensaje}`;
}

function configurarWhatsappFlotante() {
  const btn = document.getElementById('btn-whatsapp');
  if (btn) btn.href = construirUrlWhatsapp();
}
