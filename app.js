const SUPABASE_URL =
  "https://caoqqzzwwpiivmqqeigw.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_4FaRj7XuzifYgPa8BjtO8A_C46t5q0Q";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

let clientes = [];
const CLIENTES_POR_PAGINA = 20;
let paginaClientes = 0;
let cargandoClientes = false;
let hayMasClientes = true;
let temporizadorBusqueda = null;
let busquedaClientes = "";

document.addEventListener("DOMContentLoaded", () => {
    localStorage.removeItem("usuario");

    const usuarioGuardado =
        sessionStorage.getItem("usuario");

    if (!usuarioGuardado) {
        return;
    }

    document
        .getElementById("loginScreen")
        .classList.add("hidden");

    document
        .getElementById("appScreen")
        .classList.remove("hidden");

    iniciarVista();
});


async function login() {
    const telefono =
        document.getElementById("telefono")
            .value
            .replace(/\D/g, "");

    const key =
        document.getElementById("password")
            .value
            .trim();

    if (!telefono || !key) {
        alert("Ingresa teléfono y contraseña");
        return;
    }

    if (telefono.length !== 10) {
        alert("Ingresa un teléfono válido de 10 dígitos");
        return;
    }

    try {
        const respuesta =
            await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    telefono,
                    key
                })
            });

        const resultado =
            await respuesta.json();

        if (!respuesta.ok) {
            alert(
                resultado.error ||
                "No se pudo iniciar sesión"
            );

            return;
        }

        sessionStorage.setItem(
    "usuario",
    JSON.stringify(resultado.usuario)
);

        document
            .getElementById("loginScreen")
            .classList.add("hidden");

        document
            .getElementById("appScreen")
            .classList.remove("hidden");

        iniciarVista();

    } catch (error) {
        console.error("Error en login:", error);

        alert("No se pudo conectar con el servidor");
    }
}


function logout() {
    sessionStorage.removeItem("usuario");
    localStorage.removeItem("usuario");
    location.reload();
}


async function cargarClientes({
    reiniciar = true
} = {}) {

    if (cargandoClientes) {
        return;
    }

    const container =
        document.getElementById("clientsList");

    const tituloClientes =
        document.getElementById("tituloClientes");

    if (!container) {
        return;
    }

    if (tituloClientes) {
        tituloClientes.textContent =
            busquedaClientes
                ? "Resultados de búsqueda"
                : "Adeudos Activos";
    }

    cargandoClientes = true;

    if (reiniciar) {
        paginaClientes = 0;
        hayMasClientes = true;
        clientes = [];

        container.innerHTML = `
            <div class="loading-state">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
                <span>Cargando clientes...</span>
            </div>
        `;
    }

    actualizarBotonCargarMas();

    const desde =
        paginaClientes * CLIENTES_POR_PAGINA;

    const hasta =
        desde + CLIENTES_POR_PAGINA - 1;

    let nuevosClientes = [];
    let errorConsulta = null;

    if (!busquedaClientes) {

        const { data, error } =
            await supabaseClient
                .from("ccp_v_saldos_clientes")
                .select(`
                    id,
                    nombre,
                    telefono,
                    departamento,
                    saldo
                `)
                .order("saldo", {
                    ascending: false
                })
                .range(desde, hasta);

        nuevosClientes = data || [];
        errorConsulta = error;
    }
 else {

    const texto =
        busquedaClientes
            .replace(/[%_,()]/g, " ")
            .trim();

    const { data, error } =
        await supabaseClient
            .from("ccp_v_saldos_clientes")
            .select(`
                id,
                nombre,
                telefono,
                departamento,
                saldo
            `)
            .or(
                `nombre.ilike.%${texto}%,departamento.ilike.%${texto}%,telefono.ilike.%${texto}%`
            )
            .order("saldo", {
                ascending: false
            })
            .range(desde, hasta);

    nuevosClientes = data || [];
    errorConsulta = error;
}

    cargandoClientes = false;

    if (errorConsulta) {

        console.error(
            "Error cargando clientes:",
            errorConsulta
        );

        if (reiniciar) {
            container.innerHTML = `
                <div class="empty-state">
                    No se pudieron cargar los clientes
                </div>
            `;
        }

        actualizarBotonCargarMas();
        return;
    }

    if (reiniciar) {
        clientes = nuevosClientes;
    }
    else {
        clientes = [
            ...clientes,
            ...nuevosClientes
        ];
    }

    hayMasClientes =
        nuevosClientes.length === CLIENTES_POR_PAGINA;

    if (nuevosClientes.length > 0) {
        paginaClientes++;
    }

    renderClientes();
    actualizarBotonCargarMas();
}

async function cargarMasClientes() {

    if (
        cargandoClientes ||
        !hayMasClientes
    ) {
        return;
    }

    await cargarClientes({
        reiniciar: false
    });
}

function actualizarBotonCargarMas() {

    const boton =
        document.getElementById("loadMoreClients");

    if (!boton) {
        return;
    }

    if (!hayMasClientes) {
        boton.classList.add("hidden");
        return;
    }

    boton.classList.remove("hidden");
    boton.disabled = cargandoClientes;
    boton.innerHTML = cargandoClientes
        ? `
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            Cargando...
        `
        : `
            <i class="fa-solid fa-chevron-down"></i>
            Cargar más clientes
        `;
}

function nuevoCobroRapido() {

    document
        .getElementById("modalTitle")
        .innerHTML = "Cobro rápido";

    document
        .getElementById("modalBody")
        .innerHTML = `
            <div class="modal-body">

                <select id="cobroRapidoPiso">
                    <option value="23">
                        Piso 23
                    </option>

                    <option value="26">
                        Piso 26
                    </option>
                </select>

                <input
                    id="cobroRapidoMonto"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Dinero recibido"
                >

                <button
                    class="save-btn"
                    onclick="guardarCobroRapido()"
                >
                    Registrar entrada
                </button>

            </div>
        `;

    abrirModal();

    document
        .getElementById("cobroRapidoMonto")
        .focus();
}

async function guardarCobroRapido() {

    const monto =
        Number(
            document.getElementById("cobroRapidoMonto").value
        );

    const pisoId =
        document.getElementById("cobroRapidoPiso").value;

    if (!monto || monto <= 0) {

        alert("Ingresa un monto válido");

        return;
    }

    const {
        data: mostrador,
        error: errorMostrador
    } =
        await supabaseClient
            .from("ccp_clientes")
            .select("id,nombre")
            .ilike("nombre", "mostrador")
            .eq("activo", true)
            .maybeSingle();

    if (errorMostrador || !mostrador) {

        console.error(
            "Error buscando mostrador:",
            errorMostrador
        );

        alert(
            'No se encontró el usuario "mostrador"'
        );

        return;
    }

   const { error } =
    await supabaseClient
        .from("ccp_movimientos")
        .insert({
            cliente_id: mostrador.id,
            piso_id: pisoId,
            id_tipo_pago: 1,
            tipo: "ENTRADA",
            concepto: "Cobro rápido · Entrada de efectivo · Usuario: mostrador",
            monto: Math.abs(monto),
            fecha: new Date().toISOString()
        });

if (error) {

    console.error(
        "Error registrando entrada:",
        error
    );

    alert(error.message);

    return;
}

alert(
    `Entrada registrada: $${monto.toFixed(2)}`
);

cerrarModal();

}

function renderClientes() {

    const container =
        document.getElementById("clientsList");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        clientes.length === 0 &&
        !cargandoClientes
    ) {
        container.innerHTML = `
            <div class="empty-state">
                No hay clientes con saldo pendiente
            </div>
        `;

        return;
    }

    clientes.forEach(cliente => {

        let color = "green";

        if (Number(cliente.saldo) > 500) {
            color = "red";
        }
        else if (Number(cliente.saldo) > 100) {
            color = "orange";
        }

        container.innerHTML += `
            <div class="client-card">

                <div class="client-left">

                    <div class="client-name">
                        ${cliente.nombre}
                    </div>

                    <div class="client-last">
                        ${cliente.departamento || "Sin departamento"}
                    </div>

                </div>

                <div class="client-right">

                    <div class="client-balance ${color}">
                        ${
                            Number(cliente.saldo) > 0
                                ? `$${Number(cliente.saldo).toFixed(2)}`
                                : "Sin adeudo"
                        }
                    </div>

                    <div style="display:flex;gap:8px;">

                        <button
                            class="notify-btn"
                            onclick="verHistorial(${cliente.id})"
                            title="Ver historial"
                        >
                            <i class="fa-solid fa-clock-rotate-left"></i>
                        </button>

                        <button
                            class="notify-btn"
                            onclick="editarCliente(${cliente.id})"
                            title="Editar cliente"
                        >
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>

                        <button
                            class="notify-btn"
                            onclick="desactivarCliente(${cliente.id})"
                            title="Dar de baja"
                        >
                            <i class="fa-solid fa-user-xmark"></i>
                        </button>

                        ${
                            cliente.telefono
                                ? `
                                    <button
                                        class="notify-btn"
                                        onclick="notificar(${cliente.id})"
                                        title="WhatsApp"
                                    >
                                        <i class="fa-brands fa-whatsapp"></i>
                                    </button>
                                `
                                : ""
                        }

                    </div>

                </div>

            </div>
        `;
    });
}

async function cargarResumen() {

    const {
        data,
        error
    } =
        await supabaseClient
            .rpc("get_ccp_resumen");

    if (error) {

        console.error(
            "Error cargando resumen:",
            error
        );

        return;
    }

    const resumen = data?.[0];

    if (!resumen) {
        return;
    }

    document
        .getElementById("totalAdeudo")
        .textContent =
        `$${Number(
            resumen.total_adeudo || 0
        ).toFixed(2)}`;

    document
        .getElementById("totalClientes")
        .textContent =
        Number(
            resumen.total_clientes || 0
        );

    document
        .getElementById("clientesPendientes")
        .textContent =
        Number(
            resumen.clientes_pendientes || 0
        );
}

async function refrescarDashboard() {

    busquedaClientes = "";

    const buscador =
        document.getElementById("searchClient");

    if (buscador) {
        buscador.value = "";
    }

    await cargarClientes({
        reiniciar: true
    });

    await cargarResumen();
    await cargarDineroCaja();
}

function iniciarVista(){

    const usuario =
        JSON.parse(
            sessionStorage.getItem("usuario")
        );

    if(!usuario) return;

    const userInfo =
        document.getElementById("userInfo");

    if(userInfo){
        userInfo.textContent =
            `${usuario.nombre} · ${usuario.telefono}`;
    }

    if(Number(usuario.rol) === 1){

        document.querySelector(".stats-grid").style.display = "";
        document.querySelector(".search-box").style.display = "";
        document.querySelector(".quick-actions").style.display = "";

        cargarResumen();
        cargarClientes();
        cargarDineroCaja();
        return;
    }

    cargarVistaUsuario(usuario.id);
}

async function cargarVistaUsuario(clienteId){
    document.querySelector(".stats-grid").style.display="none";
    document.querySelector(".search-box").style.display="none";
    document.querySelector(".quick-actions").style.display="none";

  const {
    data: datosCliente,
    error: errorCliente
} =
    await supabaseClient
        .from("ccp_clientes")
        .select(`
            id,
            nombre,
            telefono,
            departamento
        `)
        .eq("id", clienteId)
        .single();

if (errorCliente || !datosCliente) {
    alert(
        errorCliente?.message ||
        "No se encontró el cliente"
    );
    return;
}

const {
    data: datosSaldo,
    error: errorSaldo
} =
    await supabaseClient
        .from("ccp_v_saldos_clientes")
        .select("saldo")
        .eq("id", clienteId)
        .maybeSingle();

if (errorSaldo) {

    console.error(
        "Error consultando saldo:",
        errorSaldo
    );
}

const cliente = {
    ...datosCliente,
    saldo: Number(datosSaldo?.saldo) || 0
};

    if(errorCliente){
        alert(errorCliente.message);
        return;
    }

    const { data:movimientos,error:errorMovimientos }=
        await supabaseClient
            .from("ccp_movimientos")
            .select("*")
            .eq("cliente_id",clienteId)
            .order("fecha",{ascending:false});

    if(errorMovimientos){
        alert(errorMovimientos.message);
        return;
    }

    const container=
        document.getElementById("clientsList");

    container.innerHTML=`
        <div class="client-card">
            <div class="client-left">
                <div class="client-name">
                    ${cliente.nombre}
                </div>
                <div class="client-last">
                    Saldo actual
                </div>
            </div>
            <div class="client-right">
                <div class="client-balance ${
                    Number(cliente.saldo)>400
                    ? "red"
                    : Number(cliente.saldo)>100
                    ? "orange"
                    : "green"
                }">
                    $${Number(cliente.saldo).toFixed(2)}
                </div>
            </div>
        </div>
        <div class="section-title" style="margin-top:30px;">
            <h3>Mi consumo</h3>
        </div>
        <div class="historial-list">
            ${movimientos.map(m=>`
                <div class="historial-item">
                    <strong>${m.tipo}</strong>
                    <div>${m.concepto||""}</div>
                    <div>
                        $${Number(m.monto).toFixed(2)}
                    </div>
                    <div style="font-size:.8rem;color:#888;">
                        ${new Date(m.fecha).toLocaleString()}
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}


function notificar(id) {

    const cliente =
        clientes.find(
            c => c.id === id
        );

    if (!cliente) return;

    const mensaje = `Hola ${cliente.nombre} 👋

Te compartimos tu saldo actual de cafetería.

Saldo pendiente: $${Number(cliente.saldo).toFixed(2)}

Gracias ☕`;

    window.open(
        `https://wa.me/52${cliente.telefono}?text=${encodeURIComponent(mensaje)}`,
        "_blank"
    );
}


document.addEventListener("input", event => {

    if (event.target.id !== "searchClient") {
        return;
    }

    clearTimeout(temporizadorBusqueda);

    const texto =
        event.target.value.trim();

    temporizadorBusqueda = setTimeout(() => {

        busquedaClientes = texto;

        cargarClientes({
            reiniciar: true
        });

    }, 300);

});

function abrirModal() {

    document
        .getElementById("modal")
        .classList.remove("hidden");
}

function cerrarModal() {

    document
        .getElementById("modal")
        .classList.add("hidden");
}

async function guardarCliente() {

    const nombre =
        document.getElementById("clienteNombre").value;

    const telefono =
        document.getElementById("clienteTelefono").value;

    const departamento =
        document.getElementById("clienteDepartamento").value;

    if(!nombre){

        alert("Ingresa el nombre");

        return;
    }

    const { error } =
        await supabaseClient
            .from("ccp_clientes")
            .insert({
                nombre,
                telefono,
                departamento
            });

    if(error){
        console.error(error);
        alert(error.message);
        return;
    }

    alert("Cliente registrado");
    cerrarModal();
    cargarClientes();
}

function nuevoCliente() {

    document.getElementById("modalTitle")
        .innerHTML = "Nuevo Cliente";

    document.getElementById("modalBody")
        .innerHTML = `

        <div class="modal-body">

            <input
                id="clienteNombre"
                placeholder="Nombre"
            >

            <input
                id="clienteTelefono"
                placeholder="Teléfono"
            >

            <input
                id="clienteDepartamento"
                placeholder="Departamento"
            >

            <button
                class="save-btn"
                onclick="guardarCliente()"
            >
                Guardar Cliente
            </button>
        </div>

    `;
    abrirModal();
}


async function nuevoConsumo() {

    const { data: productos, error } =
    await supabaseClient
        .from("ccp_productos")
        .select("*")
        .eq("activo", true)
        .order("id_categoria", {
            ascending: true
        })
        .order("nombre", {
            ascending: true
        });

    if (error) {
        console.error(error);
        alert("No se pudieron cargar los productos");
        return;
    }

    document.getElementById("modalTitle")
        .innerHTML = "Registrar Consumo";

    document.getElementById("modalBody")
        .innerHTML = `
            <div class="modal-body">

                <div class="client-picker">

                    <div class="client-search-control">
                        <i class="fa-solid fa-magnifying-glass"></i>

                        <input
                            type="text"
                            id="buscarClienteConsumo"
                            placeholder="Buscar cliente..."
                            autocomplete="off"
                        >

                        <i
                            id="loadingClienteConsumo"
                            class="fa-solid fa-circle-notch fa-spin hidden"
                        ></i>
                    </div>

                    <input
                        type="hidden"
                        id="consumoCliente"
                    >

                    <div
                        id="clienteSeleccionadoConsumo"
                        class="selected-client hidden"
                    ></div>

                    <div
                        id="resultadosClienteConsumo"
                        class="client-search-results hidden"
                    ></div>

                </div>

                <select id="consumoPiso">
                    <option value="23">
                        Piso 23
                    </option>

                    <option value="26">
                        Piso 26
                    </option>
                </select>
                

                <div class="productos-selector">

    <div class="productos-selector-header">
        <div>
            <strong>Productos</strong>
            <small>Selecciona la cantidad</small>
        </div>

        <span id="totalConsumo">
            $0.00
        </span>
    </div>

    <div class="productos-lista">

        ${(productos || []).map(producto => `

            <div
                class="producto-row"
                data-id="${producto.id}"
                data-nombre="${producto.nombre}"
                data-precio="${producto.precio}"
            >

                <div class="producto-info">
                    <strong>
                        ${producto.nombre}
                    </strong>

                    <small>
                        $${Number(producto.precio).toFixed(2)}
                    </small>
                </div>

                <div class="cantidad-control">

                    <button
                        type="button"
                        onclick="cambiarCantidadProducto(${producto.id}, -1)"
                    >
                        <i class="fa-solid fa-minus"></i>
                    </button>

                    <span
                        class="producto-cantidad"
                        id="cantidadProducto${producto.id}"
                    >
                        0
                    </span>

                    <button
                        type="button"
                        onclick="cambiarCantidadProducto(${producto.id}, 1)"
                    >
                        <i class="fa-solid fa-plus"></i>
                    </button>

                </div>

            </div>

        `).join("")}

    </div>

</div>

                <button
                    class="save-btn"
                    onclick="guardarConsumo()"
                >
                    Guardar Consumo
                </button>

            </div>
        `;

    abrirModal();

    configurarBuscadorClienteConsumo();

    document
        .getElementById("buscarClienteConsumo")
        .focus();
}


function cambiarCantidadProducto(productoId, cambio) {

    const cantidadElement =
        document.getElementById(
            `cantidadProducto${productoId}`
        );

    if (!cantidadElement) {
        return;
    }

    const cantidadActual =
        Number(cantidadElement.textContent);

    const nuevaCantidad =
        Math.max(0, cantidadActual + cambio);

    cantidadElement.textContent =
        nuevaCantidad;

    actualizarTotalConsumo();
}

function actualizarTotalConsumo() {

    let total = 0;

    document
        .querySelectorAll(".producto-row")
        .forEach(producto => {

            const cantidad =
                Number(
                    producto
                        .querySelector(".producto-cantidad")
                        .textContent
                );

            const precio =
                Number(producto.dataset.precio);

            total += cantidad * precio;
        });

    const totalElement =
        document.getElementById("totalConsumo");

    if (totalElement) {
        totalElement.textContent =
            `$${total.toFixed(2)}`;
    }
}


function configurarBuscadorClienteConsumo() {

    const input = document.getElementById("buscarClienteConsumo");
    const resultados =document.getElementById("resultadosClienteConsumo");
    const loading = document.getElementById("loadingClienteConsumo");
    let temporizador = null;

    input.addEventListener("input", () => {
        clearTimeout(temporizador);
        const texto = input.value.trim();

        document.getElementById("consumoCliente").value = "";

        document.getElementById("clienteSeleccionadoConsumo").classList.add("hidden");

        if (texto.length < 2) {
            resultados.innerHTML = "";
            resultados.classList.add("hidden");
            loading.classList.add("hidden");
            return;
        }

        temporizador = setTimeout(async () => {

            loading.classList.remove("hidden");

            const textoSeguro =
                texto
                    .replace(/[%_,()]/g, " ")
                    .trim();

            const {
    data: clientesEncontrados,
    error
} =
    await supabaseClient
        .from("ccp_clientes")
        .select(`
            id,
            nombre,
            departamento,
            telefono
        `)
        .eq("activo", true)
        .or(
            `nombre.ilike.%${textoSeguro}%,departamento.ilike.%${textoSeguro}%,telefono.ilike.%${textoSeguro}%`
        )
        .order("nombre", {
            ascending: true
        })
        .limit(15);

loading.classList.add("hidden");

if (error) {

    console.error(
        "Error buscando clientes:",
        error
    );

    resultados.innerHTML = `
        <div class="client-result-empty">
            No se pudieron buscar clientes
        </div>
    `;

    resultados.classList.remove("hidden");

    return;
}


/* =========================
   OBTENER SALDOS
========================= */

const ids =
    (clientesEncontrados || [])
        .map(cliente => cliente.id);

let saldosPorCliente = {};

if (ids.length > 0) {

    const {
        data: saldos,
        error: errorSaldos
    } =
        await supabaseClient
            .from("ccp_v_saldos_clientes")
            .select("id,saldo")
            .in("id", ids);

    if (errorSaldos) {

        console.error(
            "Error obteniendo saldos:",
            errorSaldos
        );

    } else {

        saldosPorCliente =
            Object.fromEntries(
                (saldos || []).map(cliente => [
                    String(cliente.id),
                    Number(cliente.saldo) || 0
                ])
            );
    }
}


/* =========================
   UNIR CLIENTES + SALDO
========================= */

const clientesConSaldo =
    (clientesEncontrados || [])
        .map(cliente => ({
            ...cliente,

            saldo:
                saldosPorCliente[
                    String(cliente.id)
                ] || 0
        }));

mostrarResultadosClienteConsumo(
    clientesConSaldo
);

        }, 300);
    });
}

function mostrarResultadosClienteConsumo(clientesEncontrados) {

    const resultados = document.getElementById("resultadosClienteConsumo");

    if (!clientesEncontrados.length) {

        resultados.innerHTML = `
            <div class="client-result-empty">
                No se encontraron clientes
            </div>
        `;

        resultados.classList.remove("hidden");

        return;
    }

    resultados.innerHTML =
        clientesEncontrados.map(cliente => `

            <button
                type="button"
                class="client-result-item"
                onclick='seleccionarClienteConsumo(${JSON.stringify(cliente)})'
            >
                <span class="client-result-icon">
                    <i class="fa-solid fa-user"></i>
                </span>

                <span class="client-result-info">

                    <strong>
                        ${cliente.nombre}
                    </strong>

                    <small>
                        ${cliente.departamento || "Sin departamento"}
                    </small>

                </span>

                <span class="client-result-balance">
                    $${Number(cliente.saldo).toFixed(2)}
                </span>

            </button>

        `).join("");

    resultados.classList.remove("hidden");
}

function seleccionarClienteConsumo(cliente) {

    document
        .getElementById("consumoCliente")
        .value = cliente.id;

    document
        .getElementById("buscarClienteConsumo")
        .value = "";

    document
        .getElementById("resultadosClienteConsumo")
        .classList.add("hidden");

    const seleccionado =
        document.getElementById("clienteSeleccionadoConsumo");

    seleccionado.innerHTML = `
        <div>
            <i class="fa-solid fa-circle-check"></i>

            <span>
                <strong>${cliente.nombre}</strong>

                <small>
                    ${cliente.departamento || "Sin departamento"}
                    · Saldo $${Number(cliente.saldo).toFixed(2)}
                </small>
            </span>
        </div>

        <button
            type="button"
            onclick="quitarClienteConsumo()"
            title="Cambiar cliente"
        >
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    seleccionado.classList.remove("hidden");
}

async function guardarConsumo() {

    const clienteId =
        document.getElementById("consumoCliente").value;

    if (!clienteId) {
        alert("Busca y selecciona un cliente");
        return;
    }

    const pisoId =
        document.getElementById("consumoPiso").value;

    const productosSeleccionados = [];

    document
        .querySelectorAll(".producto-row")
        .forEach(producto => {

            const cantidad =
                Number(
                    producto
                        .querySelector(".producto-cantidad")
                        .textContent
                );

            if (cantidad > 0) {

                productosSeleccionados.push({
                    id: producto.dataset.id,
                    precio: Number(producto.dataset.precio),
                    cantidad: cantidad
                });
            }
        });

    if (productosSeleccionados.length === 0) {
        alert("Selecciona al menos un producto");
        return;
    }

    const movimientos =
        productosSeleccionados.flatMap(producto =>

            Array.from(
                {
                    length: producto.cantidad
                },
                () => ({
                    cliente_id: clienteId,
                    producto_id: producto.id,
                    piso_id: pisoId,
                    tipo: "CONSUMO",
                    monto: producto.precio,
                    fecha: new Date().toISOString()
                })
            )
        );

    const { error } =
        await supabaseClient
            .from("ccp_movimientos")
            .insert(movimientos);

    if (error) {
        console.error(
            "Error registrando consumo:",
            error
        );

        alert(error.message);
        return;
    }

    const total =
        movimientos.reduce(
            (suma, movimiento) =>
                suma + Number(movimiento.monto),
            0
        );

    alert(
        `${movimientos.length} productos registrados · Total $${total.toFixed(2)}`
    );

    cerrarModal();
    await refrescarDashboard();
}

async function nuevoPago() {

    document.getElementById("modalTitle")
        .innerHTML = "Registrar Pago";

    document.getElementById("modalBody")
        .innerHTML = `
            <div class="modal-body">

                <div class="client-picker">

                    <div class="client-search-control">

                        <i class="fa-solid fa-magnifying-glass"></i>

                        <input
                            id="buscarClientePago"
                            type="text"
                            placeholder="Buscar por nombre, teléfono o departamento..."
                            autocomplete="off"
                        >

                        <i
                            id="loadingClientePago"
                            class="fa-solid fa-circle-notch fa-spin hidden"
                        ></i>

                    </div>

                    <input
                        type="hidden"
                        id="pagoCliente"
                    >

                    <input
                        type="hidden"
                        id="pagoSaldo"
                    >

                    <div
                        id="clienteSeleccionadoPago"
                        class="selected-client hidden"
                    ></div>

                    <div
                        id="resultadosClientePago"
                        class="client-search-results hidden"
                    ></div>

                </div>

                <div
                    id="saldoClientePago"
                    class="hidden"
                    style="
                        padding:18px;
                        border:1px solid #e5e7eb;
                        border-radius:14px;
                        background:#f9fafb;
                        text-align:center;
                    "
                ></div>

<select id="pagoPiso">

    <option value="23">
        Piso 23
    </option>

    <option value="26">
        Piso 26
    </option>

</select>

<select id="tipoPago">

    <option value="1">
        💵 Efectivo
    </option>

    <option value="2">
        💳 Tarjeta
    </option>

</select>

<input
    id="pagoMonto"
    type="number"
    min="0.01"
    step="0.01"
    placeholder="Monto a pagar"
    oninput="actualizarResumenPago()"
>
                <div
                    id="resumenPago"
                    class="hidden"
                    style="
                        padding:14px;
                        border-radius:12px;
                        background:#f3f4f6;
                        font-size:.9rem;
                    "
                ></div>

                <button
                    class="save-btn"
                    onclick="guardarPago()"
                >
                    Guardar Pago
                </button>

            </div>
        `;

    abrirModal();

    configurarBuscadorClientePago();

    document
        .getElementById("buscarClientePago")
        .focus();
}

function configurarBuscadorClientePago() {

    const input =
        document.getElementById("buscarClientePago");

    const resultados =
        document.getElementById("resultadosClientePago");

    const loading =
        document.getElementById("loadingClientePago");

    let temporizador = null;

    input.addEventListener("input", () => {

        clearTimeout(temporizador);

        const texto =
            input.value.trim();

        quitarClientePago(false);

        if (texto.length < 2) {

            resultados.innerHTML = "";

            resultados.classList.add("hidden");

            return;
        }

        temporizador = setTimeout(async () => {

            loading.classList.remove("hidden");

            const textoSeguro =
                texto.replace(/[%_,()]/g, " ");

            const { data, error } =
                await supabaseClient
                    .from("ccp_v_saldos_clientes")
                    .select(
                        "id,nombre,departamento,telefono,saldo"
                    )
                    .gt("saldo", 0)
                    .or(
                        `nombre.ilike.%${textoSeguro}%,departamento.ilike.%${textoSeguro}%,telefono.ilike.%${textoSeguro}%`
                    )
                    .order("nombre", {
                        ascending: true
                    })
                    .limit(15);

            loading.classList.add("hidden");

            if (error) {

                console.error(
                    "Error buscando cliente:",
                    error
                );

                resultados.innerHTML = `
                    <div class="client-result-empty">
                        No se pudieron buscar clientes
                    </div>
                `;

                resultados.classList.remove("hidden");

                return;
            }

            mostrarResultadosClientePago(data || []);

        }, 300);
    });
}


function mostrarResultadosClientePago(clientesEncontrados) {

    const resultados =
        document.getElementById("resultadosClientePago");

    if (!clientesEncontrados.length) {

        resultados.innerHTML = `
            <div class="client-result-empty">
                No se encontraron clientes con saldo pendiente
            </div>
        `;

        resultados.classList.remove("hidden");

        return;
    }

    resultados.innerHTML =
        clientesEncontrados.map(cliente => {

            const clienteSeguro =
                encodeURIComponent(
                    JSON.stringify(cliente)
                );

            return `
                <button
                    type="button"
                    class="client-result-item"
                    onclick="seleccionarClientePago(
                        JSON.parse(
                            decodeURIComponent('${clienteSeguro}')
                        )
                    )"
                >

                    <span class="client-result-icon">
                        <i class="fa-solid fa-user"></i>
                    </span>

                    <span class="client-result-info">

                        <strong>
                            ${cliente.nombre}
                        </strong>

                        <small>
                            ${cliente.departamento || "Sin departamento"}
                        </small>

                        ${
                            cliente.telefono
                                ? `
                                    <small>
                                        ${cliente.telefono}
                                    </small>
                                `
                                : ""
                        }

                    </span>

                    <span class="client-result-balance">
                        $${Number(cliente.saldo).toFixed(2)}
                    </span>

                </button>
            `;
        }).join("");

    resultados.classList.remove("hidden");
}


function seleccionarClientePago(cliente) {

    const saldo =
        Number(cliente.saldo);

    document
        .getElementById("pagoCliente")
        .value = cliente.id;

    document
        .getElementById("pagoSaldo")
        .value = saldo;

    document
        .getElementById("buscarClientePago")
        .value = "";

    document
        .getElementById("resultadosClientePago")
        .classList.add("hidden");

    const seleccionado =
        document.getElementById("clienteSeleccionadoPago");

    seleccionado.innerHTML = `
        <div>

            <i class="fa-solid fa-circle-check"></i>

            <span>

                <strong>
                    ${cliente.nombre}
                </strong>

                <small>
                    ${cliente.departamento || "Sin departamento"}
                </small>

            </span>

        </div>

        <button
            type="button"
            onclick="quitarClientePago()"
            title="Cambiar cliente"
        >
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    seleccionado.classList.remove("hidden");

    const saldoContainer =
        document.getElementById("saldoClientePago");

    saldoContainer.innerHTML = `
        <div style="
            color:#6b7280;
            font-size:.85rem;
            font-weight:600;
        ">
            Saldo pendiente
        </div>

        <div style="
            margin:4px 0 14px;
            font-size:2rem;
            line-height:1;
            font-weight:800;
            color:#dc2626;
        ">
            $${saldo.toFixed(2)}
        </div>

        <button
            type="button"
            onclick="liquidarDeudaPago()"
            style="
                width:100%;
                border:0;
                border-radius:10px;
                padding:11px 14px;
                background:#111827;
                color:#fff;
                font-weight:700;
                cursor:pointer;
            "
        >
            <i class="fa-solid fa-money-bill-wave"></i>
            Liquidar deuda completa
        </button>
    `;

    saldoContainer.classList.remove("hidden");

    const montoInput =
        document.getElementById("pagoMonto");

    montoInput.value = "";

    montoInput.max =
        saldo.toFixed(2);

    montoInput.placeholder =
        `Máximo $${saldo.toFixed(2)}`;

    document
        .getElementById("resumenPago")
        .classList.add("hidden");

    montoInput.focus();
}


function quitarClientePago(limpiarBusqueda = true) {

    const pagoCliente =
        document.getElementById("pagoCliente");

    if (!pagoCliente) {
        return;
    }

    pagoCliente.value = "";

    document
        .getElementById("pagoSaldo")
        .value = "";

    if (limpiarBusqueda) {

        document
            .getElementById("buscarClientePago")
            .value = "";
    }

    document
        .getElementById("clienteSeleccionadoPago")
        .classList.add("hidden");

    document
        .getElementById("saldoClientePago")
        .classList.add("hidden");

    document
        .getElementById("resumenPago")
        .classList.add("hidden");

    document
        .getElementById("pagoMonto")
        .value = "";
}


function liquidarDeudaPago() {

    const saldo =
        Number(
            document.getElementById("pagoSaldo").value
        );

    if (!saldo) {
        return;
    }

    document
        .getElementById("pagoMonto")
        .value = saldo.toFixed(2);

    actualizarResumenPago();
}


function actualizarResumenPago() {

    const saldo =
        Number(
            document.getElementById("pagoSaldo").value
        );

    const monto =
        Number(
            document.getElementById("pagoMonto").value
        );

    const resumen =
        document.getElementById("resumenPago");

    if (!saldo || !monto || monto <= 0) {

        resumen.classList.add("hidden");

        return;
    }

    const restante =
        Math.max(0, saldo - monto);

    resumen.innerHTML = `
        <div style="
            display:flex;
            justify-content:space-between;
            gap:15px;
            margin-bottom:6px;
        ">
            <span>Saldo actual</span>

            <strong>
                $${saldo.toFixed(2)}
            </strong>
        </div>

        <div style="
            display:flex;
            justify-content:space-between;
            gap:15px;
            margin-bottom:6px;
        ">
            <span>Pago</span>

            <strong>
                -$${monto.toFixed(2)}
            </strong>
        </div>

        <div style="
            display:flex;
            justify-content:space-between;
            gap:15px;
            padding-top:8px;
            border-top:1px solid #d1d5db;
        ">
            <span>Saldo restante</span>

            <strong style="
                color:${restante === 0 ? "#059669" : "#dc2626"};
            ">
                $${restante.toFixed(2)}
            </strong>
        </div>
    `;

    resumen.classList.remove("hidden");
}


async function guardarPago() {

const clienteId = document.getElementById("pagoCliente").value;
const pisoId = document.getElementById("pagoPiso").value;
const tipoPago = Number( document.getElementById("tipoPago").value);
const monto = Number(document.getElementById("pagoMonto").value);

    if (!clienteId) {

        alert("Busca y selecciona un cliente");

        return;
    }

    if (!monto || monto <= 0) {

        alert("Ingresa un monto válido");

        return;
    }
    const {
        data: cliente,
        error: errorCliente
    } =
        await supabaseClient
            .from("ccp_v_saldos_clientes")
            .select(
                "id,nombre,saldo"
            )
            .eq("id", clienteId)
            .single();

    if (errorCliente || !cliente) {

        console.error(
            "Error consultando cliente:",
            errorCliente
        );

        alert(
            "No se pudo consultar el saldo actual del cliente"
        );

        return;
    }

    const saldoActual =
        Number(cliente.saldo);

    if (saldoActual <= 0) {

        alert(
            "Este cliente ya no tiene saldo pendiente"
        );

        return;
    }

    if (monto > saldoActual) {

        alert(
            `El pago no puede superar el saldo actual de $${saldoActual.toFixed(2)}`
        );

        document
            .getElementById("pagoSaldo")
            .value = saldoActual;

        actualizarResumenPago();

        return;
    }

    const boton =
        document.querySelector(
            "#modalBody .save-btn"
        );

    if (boton) {

        boton.disabled = true;

        boton.innerHTML = `
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            Registrando...
        `;
    }

    const { error } =
    await supabaseClient
        .from("ccp_movimientos")
        .insert({
            cliente_id: clienteId,
            piso_id: pisoId,
            id_tipo_pago: tipoPago,
            tipo: "PAGO",
            concepto: tipoPago === 1
                ? "Pago en efectivo"
                : "Pago con tarjeta",
            monto: Math.abs(monto),
            fecha: new Date().toISOString()
        });

    if (error) {

        console.error(
            "Error registrando pago:",
            error
        );

        alert(error.message);

        if (boton) {

            boton.disabled = false;

            boton.innerHTML =
                "Guardar Pago";
        }

        return;
    }

    const saldoRestante =
        Math.max(
            0,
            saldoActual - monto
        );

    alert(
        saldoRestante === 0
            ? `Pago registrado. ${cliente.nombre} liquidó su deuda.`
            : `Pago registrado. Saldo restante: $${saldoRestante.toFixed(2)}`
    );

cerrarModal();
await refrescarDashboard();

}

async function generarCorte() {

    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    const { data, error } = await supabaseClient
        .from("ccp_movimientos")
        .select("tipo,monto,id_tipo_pago,fecha,cancelado")
       .in("tipo", ["PAGO", "ENTRADA"])
        .eq("cancelado", false);

    if(error){
        alert(error.message);
        return;
    }

    const pagosHoy = (data || []).filter(m => {
        const fecha = new Date(m.fecha);
        fecha.setHours(0,0,0,0);
        return fecha.getTime() === hoy.getTime();
    });

let pagosEfectivo = 0;
let pagosTarjeta = 0;
let cobroRapido = 0;

pagosHoy.forEach(movimiento => {

    if (movimiento.tipo === "ENTRADA") {

        cobroRapido += Number(movimiento.monto);

        return;
    }

    if (
        movimiento.tipo === "PAGO" &&
        Number(movimiento.id_tipo_pago) === 1
    ) {

        pagosEfectivo += Number(movimiento.monto);
    }

    if (
        movimiento.tipo === "PAGO" &&
        Number(movimiento.id_tipo_pago) === 2
    ) {

        pagosTarjeta += Number(movimiento.monto);
    }

});

const total = pagosEfectivo + pagosTarjeta + cobroRapido;

    document.getElementById("modalTitle").innerHTML =
        "Corte del Día";

    document.getElementById("modalBody").innerHTML = `
        <div class="modal-body">

            <h3>📅 ${new Date().toLocaleDateString()}</h3>

            <hr>

            <h2>💵 Pagos en efectivo</h2>
            <h1>$${pagosEfectivo.toFixed(2)}</h1>

            <h2>💳 Pagos con tarjeta</h2>
            <h1>$${pagosTarjeta.toFixed(2)}</h1>

            <h2>⚡ Cobro rápido</h2>
            <h1>$${cobroRapido.toFixed(2)}</h1>

            <hr>

          <h2>💰 Total ingresado</h2>
          <h1>$${total.toFixed(2)}</h1>
          <h3>🧾 Movimientos registrados: ${pagosHoy.length}</h3>
        </div>
    `;

    abrirModal();
}

async function verHistorial(clienteId) {

    const cliente =
        clientes.find(
            c => c.id == clienteId
        );

    const { data, error } =
        await supabaseClient
            .from("ccp_movimientos")
            .select("*")
            .eq("cliente_id", clienteId)
            .order("fecha", {
                ascending: false
            });

    if(error){

        alert(error.message);

        return;
    }

    document.getElementById("modalTitle")
        .innerHTML =
        `Historial - ${cliente.nombre}`;

    if(!data.length){

        document.getElementById("modalBody")
            .innerHTML =
            "<p>Sin movimientos registrados</p>";

        abrirModal();

        return;
    }

    document.getElementById("modalBody")
        .innerHTML = `

        <div class="historial-list">

            ${data.map(m => `

                <div class="historial-item">

                    <div>
    <strong>
        ${m.tipo}
    </strong>

    ${
        m.cancelado
        ?
        `
        <span style="
            background:#dc2626;
            color:#fff;
            padding:3px 8px;
            border-radius:20px;
            font-size:.75rem;
            margin-left:8px;
        ">
            CANCELADO
        </span>
        `
        :
        ""
    }
</div>

                   <div>
    ${m.concepto || ""}
</div>

<div>
    📍 ${
        m.piso_id == 23
        ? "Piso 23"
        : m.piso_id == 26
        ? "Piso 26"
        : "Sin piso"
    }
</div>

<div>
    $${Number(m.monto).toFixed(2)}
</div>
${
    m.cancelado
    ?
    `
    <div style="
        margin-top:8px;
        color:#dc2626;
        font-size:.85rem;
        font-weight:600;
    ">
        Motivo: ${m.motivo_cancelacion || "Sin motivo"}
    </div>

    <div style="
        color:#888;
        font-size:.8rem;
    ">
        Cancelado por: ${m.cancelado_por || "N/A"}
    </div>
    `
    :
    ""
}

<div style="font-size:.8rem;color:#888;">
    ${new Date(m.fecha)
        .toLocaleString()}
</div>

<div style="margin-top:10px;">

    ${
    !m.cancelado
    ?
    `
    <button
        class="delete-btn"
        onclick="cancelarMovimiento(${m.id})"
    >
        🗑️ Cancelar
    </button>
    `
    :
    `
    <div style="
        color:#dc2626;
        font-weight:700;
        margin-top:8px;
    ">
        Movimiento cancelado
    </div>
    `
}

</div>

                </div>

            `).join("")}

        </div>

    `;

    abrirModal();
}

async function cancelarMovimiento(id){

    const motivo =
        prompt(
            "Indica el motivo de cancelación"
        );

    if(!motivo) return;

    const usuario =
    JSON.parse(
        sessionStorage.getItem("usuario")
    );

    const { error } =
        await supabaseClient
            .from("ccp_movimientos")
            .update({
                cancelado: true,
                motivo_cancelacion: motivo,
                cancelado_por: usuario.nombre,
                fecha_cancelacion:
                    new Date().toISOString()
            })
            .eq("id", id);

    if(error){

        alert(error.message);

        return;
    }

alert("Movimiento cancelado");
cerrarModal();
await refrescarDashboard();
}

async function desactivarCliente(id){

    const motivo =
        prompt(
            "Motivo de baja del cliente"
        );

    if(!motivo) return;

    const confirmar =
        confirm(
            "¿Seguro que deseas dar de baja este cliente?"
        );

    if(!confirmar) return;

    const { error } =
        await supabaseClient
            .from("ccp_clientes")
            .update({
                activo:false
            })
            .eq("id",id);

    if(error){

        alert(error.message);

        return;
    }

    alert("Cliente dado de baja");

await refrescarDashboard();
}

async function editarCliente(id){

    const { data: cliente, error } =
        await supabaseClient
            .from("ccp_clientes")
            .select("id,nombre,telefono,departamento,activo")
            .eq("id", id)
            .single();

    if(error){
        alert(error.message);
        return;
    }

    document.getElementById("modalTitle").innerHTML =
        "Editar cliente";

    document.getElementById("modalBody").innerHTML = `

        <div class="modal-body">

            <input
                id="editNombre"
                value="${cliente.nombre || ""}"
                placeholder="Nombre"
            >

            <input
                id="editTelefono"
                value="${cliente.telefono || ""}"
                placeholder="Teléfono"
            >

            <input
                id="editDepartamento"
                value="${cliente.departamento || ""}"
                placeholder="Departamento"
            >

            <input
                id="editKey"
                type="password"
                placeholder="Nueva contraseña (opcional)"
            >

            <label style="display:flex;align-items:center;gap:10px;">

                <input
                    id="editActivo"
                    type="checkbox"
                    ${cliente.activo ? "checked" : ""}
                >

                Activo

            </label>

            <button
                class="save-btn"
                onclick="guardarEdicionCliente(${id})"
            >
                Guardar cambios
            </button>

        </div>

    `;

    abrirModal();
}

async function cargarDineroCaja() {

    const { data, error } = await supabaseClient
        .from("ccp_movimientos")
        .select("monto")
        .eq("tipo", "PAGO")
        .eq("cancelado", false);

    if (error) {
        console.error("Error consultando caja:", error);
        return;
    }

    const total = (data || []).reduce(
        (suma, pago) => suma + Number(pago.monto),
        0
    );

    const elemento = document.getElementById("dineroCaja");

    if (elemento) {
        elemento.textContent = `$${total.toFixed(2)}`;
    }

    return total;
}

async function verDineroCaja() {

    const { data, error } = await supabaseClient
        .from("ccp_movimientos")
        .select("monto,id_tipo_pago")
        .eq("tipo", "PAGO")
        .eq("cancelado", false);

    if (error) {
        alert(error.message);
        return;
    }

    let efectivo = 0;
    let tarjeta = 0;

    (data || []).forEach(pago => {

        if (Number(pago.id_tipo_pago) === 1) {
            efectivo += Number(pago.monto);
        }

        if (Number(pago.id_tipo_pago) === 2) {
            tarjeta += Number(pago.monto);
        }

    });

    const total = efectivo + tarjeta;

    document.getElementById("modalTitle").innerHTML =
        "Dinero en caja";

    document.getElementById("modalBody").innerHTML = `
        <div class="modal-body">

            <h3>💵 Efectivo</h3>
            <h1>$${efectivo.toFixed(2)}</h1>

            <h3>💳 Tarjeta</h3>
            <h1>$${tarjeta.toFixed(2)}</h1>

            <hr>

            <h2>Total pendiente de entregar</h2>
            <h1>$${total.toFixed(2)}</h1>

            <small>
                ${data.length} pagos pendientes de entregar
            </small>

        </div>
    `;

    abrirModal();
}

async function entregarCuenta() {

    const { data, error } = await supabaseClient
        .from("ccp_movimientos")
        .select("id,monto")
        .eq("tipo", "PAGO")
        .eq("cancelado", false);

    if (error) {
        alert(error.message);
        return;
    }

    if (!data || data.length === 0) {
        alert("No hay dinero pendiente por entregar");
        return;
    }

    const total = data.reduce(
        (suma, pago) => suma + Number(pago.monto),
        0
    );

    const confirmar = confirm(
        `¿Entregar cuenta por $${total.toFixed(2)}?\n\n` +
        `${data.length} pagos serán marcados como entregados.`
    );

    if (!confirmar) {
        return;
    }

    const { error: errorEntrega } = await supabaseClient
        .from("ccp_movimientos")
        .update({
            cancelado: true
        })
        .eq("tipo", "PAGO")
        .eq("cancelado", false);

    if (errorEntrega) {
        alert(errorEntrega.message);
        return;
    }

    alert(
        `Cuenta entregada correctamente.\n\nTotal: $${total.toFixed(2)}`
    );

    await refrescarDashboard();
}

async function guardarEdicionCliente(id){

    const cambios = {

        nombre:
            document.getElementById("editNombre").value,

        telefono:
            document.getElementById("editTelefono").value,

        departamento:
            document.getElementById("editDepartamento").value,

        activo:
            document.getElementById("editActivo").checked

    };

    const nuevaKey =
        document.getElementById("editKey")
            .value
            .trim();

    if(nuevaKey){
        cambios.key = nuevaKey;
    }

    const { error } =
        await supabaseClient
            .from("ccp_clientes")
            .update(cambios)
            .eq("id", id);

    if(error){

        alert(error.message);

        return;
    }

    alert("Cliente actualizado");

cerrarModal();
await refrescarDashboard();
}