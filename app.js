const clientes = [
    {
        id: 1,
        nombre: "Marco",
        telefono: "5512345678",
        saldo: 850,
        ultimoMovimiento: "Hoy 08:20"
    },
    {
        id: 2,
        nombre: "Luis",
        telefono: "5587654321",
        saldo: 450,
        ultimoMovimiento: "Ayer 14:10"
    },
    {
        id: 3,
        nombre: "Ana",
        telefono: "5511122233",
        saldo: 90,
        ultimoMovimiento: "Lunes 11:00"
    }
];

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

function cargarClientes() {

    const container =
        document.getElementById("clientsList");

    if (!container) return;

    container.innerHTML = "";

    clientes.forEach(cliente => {

        let color = "green";

        if (cliente.saldo > 500) {
            color = "red";
        } else if (cliente.saldo > 100) {
            color = "orange";
        }

        container.innerHTML += `
        
        <div class="client-card">

            <div class="client-left">

                <div class="client-name">
                    ${cliente.nombre}
                </div>

                <div class="client-last">
                    ${cliente.ultimoMovimiento}
                </div>

            </div>

            <div class="client-right">

                <div class="client-balance ${color}">
                    $${cliente.saldo}
                </div>

                <button
                    class="notify-btn"
                    onclick="notificar(${cliente.id})"
                >
                    <i class="fa-brands fa-whatsapp"></i>
                </button>

            </div>

        </div>

        `;
    });

    actualizarResumen();
}

function actualizarResumen() {

    const totalAdeudo = clientes.reduce(
        (total, cliente) => total + cliente.saldo,
        0
    );

    const clientesPendientes =
        clientes.filter(c => c.saldo > 0).length;

    const totalElement =
        document.getElementById("totalAdeudo");

    const pendientesElement =
        document.getElementById("clientesPendientes");

    if (totalElement) {
        totalElement.textContent =
            `$${totalAdeudo.toLocaleString()}`;
    }

    if (pendientesElement) {
        pendientesElement.textContent =
            clientesPendientes;
    }
}

function notificar(id) {

    const cliente =
        clientes.find(c => c.id === id);

    if (!cliente) return;

    const mensaje = `Hola ${cliente.nombre} 👋

Te compartimos tu saldo actual de cafetería.

Adeudo pendiente: $${cliente.saldo}

Por favor acércate con el encargado para cualquier aclaración.

Gracias ☕`;

    window.open(
        `https://wa.me/52${cliente.telefono}?text=${encodeURIComponent(mensaje)}`,
        "_blank"
    );
}

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