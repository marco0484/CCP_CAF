
/* ========================= */
/* SUPABASE */
/* ========================= */

const SUPABASE_URL =
  "https://caoqqzzwwpiivmqqeigw.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_4FaRj7XuzifYgPa8BjtO8A_C46t5q0Q";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

/* ========================= */
/* VARIABLES */
/* ========================= */

let clientes = [];

/* ========================= */
/* LOGIN */
/* ========================= */

function login() {

    document
        .getElementById("loginScreen")
        .classList.add("hidden");

    document
        .getElementById("appScreen")
        .classList.remove("hidden");

    cargarClientes();
}

function logout() {
    location.reload();
}

/* ========================= */
/* CLIENTES */
/* ========================= */

async function cargarClientes() {

    const container =
        document.getElementById("clientsList");

    if (!container) return;

    container.innerHTML =
        "<p>Cargando clientes...</p>";

    const { data, error } =
        await supabaseClient
            .from("ccp_v_saldos_clientes")
            .select("*")
            .order("saldo", {
                ascending: false
            });

    if (error) {

        console.error(error);

        container.innerHTML =
            "<p>Error al cargar clientes</p>";

        return;
    }

    clientes = data || [];

    console.log("Clientes:", clientes);

    renderClientes();
}

function renderClientes() {

    const container =
        document.getElementById("clientsList");

    if (!container) return;

    container.innerHTML = "";

    if (clientes.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                No hay clientes registrados
            </div>
        `;

        actualizarResumen();

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
                    $${Number(cliente.saldo).toFixed(2)}
                </div>

                ${
                    cliente.telefono
                    ?
                    `
                    <button
                        class="notify-btn"
                        onclick="notificar(${cliente.id})"
                    >
                        <i class="fa-brands fa-whatsapp"></i>
                    </button>
                    `
                    :
                    ""
                }

            </div>

        </div>

        `;
    });

    actualizarResumen();
}

/* ========================= */
/* DASHBOARD */
/* ========================= */

function actualizarResumen() {

    const totalAdeudo =
        clientes.reduce(
            (total, cliente) =>
                total + Number(cliente.saldo),
            0
        );

    const clientesPendientes =
        clientes.filter(
            c => Number(c.saldo) > 0
        ).length;

    const totalElement =
        document.getElementById("totalAdeudo");

    const pendientesElement =
        document.getElementById("clientesPendientes");

    const clientesElement =
        document.getElementById("totalClientes");

    if (totalElement) {
        totalElement.textContent =
            `$${totalAdeudo.toFixed(2)}`;
    }

    if (pendientesElement) {
        pendientesElement.textContent =
            clientesPendientes;
    }

    if (clientesElement) {
        clientesElement.textContent =
            clientes.length;
    }
}

/* ========================= */
/* WHATSAPP */
/* ========================= */

function notificar(id) {

    const cliente =
        clientes.find(
            c => c.id === id
        );

    if (!cliente) return;

    const mensaje = `Hola ${cliente.nombre} 👋

Te compartimos tu saldo actual de cafetería.

Adeudo pendiente: $${Number(cliente.saldo).toFixed(2)}

Gracias ☕`;

    window.open(
        `https://wa.me/52${cliente.telefono}?text=${encodeURIComponent(mensaje)}`,
        "_blank"
    );
}

/* ========================= */
/* BUSCADOR */
/* ========================= */

document.addEventListener("input", e => {

    if (e.target.id !== "searchClient")
        return;

    const texto =
        e.target.value.toLowerCase();

    document
        .querySelectorAll(".client-card")
        .forEach(card => {

            const nombre =
                card.querySelector(".client-name")
                .textContent
                .toLowerCase();

            card.style.display =
                nombre.includes(texto)
                ? "flex"
                : "none";
        });
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

    const { data: productos } =
        await supabaseClient
            .from("ccp_productos")
            .select("*")
            .eq("activo", true);

    document.getElementById("modalTitle")
        .innerHTML = "Registrar Consumo";

    document.getElementById("modalBody")
        .innerHTML = `

        <div class="modal-body">

            <select id="consumoCliente">
                ${clientes.map(c => `
                    <option value="${c.id}">
                        ${c.nombre}
                    </option>
                `).join("")}
            </select>

            <select id="consumoProducto">
                ${productos.map(p => `
                    <option
                        value="${p.id}"
                        data-precio="${p.precio}"
                        data-nombre="${p.nombre}"
                    >
                        ${p.nombre} - $${p.precio}
                    </option>
                `).join("")}
            </select>

            <button
                class="save-btn"
                onclick="guardarConsumo()"
            >
                Guardar Consumo
            </button>

        </div>
    `;

    abrirModal();
}

async function guardarConsumo() {

    const clienteId =
        document.getElementById("consumoCliente").value;

    const producto =
        document.getElementById("consumoProducto");

    const option =
        producto.options[producto.selectedIndex];

    const productoId =
        option.value;

    const nombre =
        option.dataset.nombre;

    const precio =
        Number(option.dataset.precio);

    const { error } =
        await supabaseClient
            .from("ccp_movimientos")
            .insert({
                cliente_id: clienteId,
                producto_id: productoId,
                tipo: "CONSUMO",
                concepto: nombre,
                monto: precio,
                fecha: new Date().toISOString()
            });

    if(error){

        alert(error.message);

        return;
    }

    alert("Consumo registrado");

    cerrarModal();

    cargarClientes();
}

function nuevoPago() {

    document.getElementById("modalTitle")
        .innerHTML = "Registrar Pago";

    document.getElementById("modalBody")
        .innerHTML = `

        <div class="modal-body">

            <select id="pagoCliente">
                ${clientes.map(c => `
                    <option value="${c.id}">
                        ${c.nombre}
                    </option>
                `).join("")}
            </select>

            <input
                id="pagoMonto"
                type="number"
                placeholder="Monto"
            >

            <button
                class="save-btn"
                onclick="guardarPago()"
            >
                Guardar Pago
            </button>

        </div>
    `;

    abrirModal();
}

async function guardarPago() {

    const clienteId =
        document.getElementById("pagoCliente").value;

    const monto =
        Number(
            document.getElementById("pagoMonto").value
        );

    if(!monto){

        alert("Ingresa un monto");

        return;
    }

    const { error } =
        await supabaseClient
            .from("ccp_movimientos")
            .insert({
                cliente_id: clienteId,
                tipo: "PAGO",
                concepto: "Pago",
                monto: monto,
                fecha: new Date().toISOString()
            });

    if(error){

        alert(error.message);

        return;
    }

    alert("Pago registrado");

    cerrarModal();

    cargarClientes();
}

function generarCorte() {

    const totalAdeudo =
        clientes.reduce(
            (t,c) => t + Number(c.saldo),
            0
        );

    const pendientes =
        clientes.filter(
            c => Number(c.saldo) > 0
        ).length;

    document.getElementById("modalTitle")
        .innerHTML = "Corte del Día";

    document.getElementById("modalBody")
        .innerHTML = `

        <div class="modal-body">

            <h2>
                Total Adeudo:
                $${totalAdeudo.toFixed(2)}
            </h2>

            <h3>
                Clientes Pendientes:
                ${pendientes}
            </h3>

            <h3>
                Clientes Registrados:
                ${clientes.length}
            </h3>

        </div>
    `;

    abrirModal();
}