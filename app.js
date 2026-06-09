
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

function nuevoCliente() {

    document.getElementById("modalTitle")
        .innerHTML = "Nuevo Cliente";

    document.getElementById("modalBody")
        .innerHTML = `
            <input
                id="clienteNombre"
                placeholder="Nombre"
            >

            <input
                id="clienteTelefono"
                placeholder="Teléfono"
            >

            <button>
                Guardar
            </button>
        `;

    abrirModal();
}

function nuevoConsumo() {
    alert("Próximamente");
}

function nuevoPago() {
    alert("Próximamente");
}

function generarCorte() {
    alert("Próximamente");
}