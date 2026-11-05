// ===============================================
// 1. ESTADO Y ELEMENTOS DEL DOM
// ===============================================
let gastos = JSON.parse(localStorage.getItem("gastos-ipap")) || [];
let sueldoMensual = parseFloat(localStorage.getItem("sueldo-mensual-app")) || 0;
let deferredPromptPWA = null;

// Sueldo y Semáforo
const inputSueldo = document.getElementById("input-sueldo");
const contenedorSemaforo = document.getElementById("contenedor-semaforo");
const textoEstadoPresupuesto = document.getElementById("texto-estado-presupuesto");
const textoDisponiblePresupuesto = document.getElementById("texto-disponible-presupuesto");
const barraProgresoSueldo = document.getElementById("barra-progreso-sueldo");
const alertaAhorroSueldo = document.getElementById("alerta-ahorro-sueldo");

// Formulario de Registro
const formulario = document.getElementById("form-gasto");
const inputConcepto = document.getElementById("concepto");
const selectCategoria = document.getElementById("categoria");
const inputMonto = document.getElementById("monto");
const inputFecha = document.getElementById("fecha");
const mensajeError = document.getElementById("mensaje-error");
const datalistProductos = document.getElementById("lista-productos-usuario");

// Filtros y Tabla (Historial)
const filtroPalabra = document.getElementById("filtro-palabra");
const filtroCategoria = document.getElementById("filtro-categoria");
const filtroMes = document.getElementById("filtro-mes");
const contenedorChipsProductos = document.getElementById("contenedor-chips-productos");
const cuerpoTabla = document.getElementById("cuerpo-tabla");
const totalFiltradoTexto = document.getElementById("total-filtrado");
const alertaRecorteTexto = document.getElementById("alerta-recorte");

// Panel Comparativo de Producto Específico
const panelAnalisisProducto = document.getElementById("panel-analisis-producto");
const tituloProductoFiltrado = document.getElementById("titulo-producto-filtrado");
const badgeVariacionProducto = document.getElementById("badge-variacion-producto");
const prodGastoTotal = document.getElementById("prod-gasto-total");
const prodCantidadCompras = document.getElementById("prod-cantidad-compras");
const prodPrecioPromedio = document.getElementById("prod-precio-promedio");
const prodComparacionExtremos = document.getElementById("prod-comparacion-extremos");

// Resumen Mes Actual y Porcentajes del Sueldo
const totalFijosTexto = document.getElementById("total-fijos");
const totalVariablesTexto = document.getElementById("total-variables");
const totalOcioTexto = document.getElementById("total-ocio");
const totalCulturaTexto = document.getElementById("total-cultura");
const porcFijosTexto = document.getElementById("porc-fijos");
const porcVariablesTexto = document.getElementById("porc-variables");
const porcOcioTexto = document.getElementById("porc-ocio");
const porcCulturaTexto = document.getElementById("porc-cultura");

// Comparativa Mensual y Calculadora Porcentual
const contenedorComparativa = document.getElementById("contenedor-comparativa");
const filtroComparativaProducto = document.getElementById("filtro-comparativa-producto");
const compMesBase = document.getElementById("comp-mes-base");
const compMesActual = document.getElementById("comp-mes-actual");
const compRubro = document.getElementById("comp-rubro");
const compPalabra = document.getElementById("comp-palabra");

// Botones de Cabecera (Modo Oscuro e Instalar App)
const btnModoOscuro = document.getElementById("btn-modo-oscuro");
const btnInstalarPWA = document.getElementById("btn-instalar-pwa");

// ===============================================
// 2. FUNCIONES AUXILIARES
// ===============================================
function normalizarTexto(texto) {
    return String(texto || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function obtenerFechaHoy() {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

function obtenerMesAnterior(mesYYYYMM) {
    const [anio, mes] = mesYYYYMM.split("-").map(Number);
    const fecha = new Date(anio, mes - 2, 1);
    const a = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, "0");
    return `${a}-${m}`;
}

// ===============================================
// 3. INICIALIZACIÓN Y EVENTOS
// ===============================================
document.addEventListener("DOMContentLoaded", () => {
    const hoyStr = obtenerFechaHoy();
    const mesActualStr = hoyStr.substring(0, 7);
    const mesAnteriorStr = obtenerMesAnterior(mesActualStr);

    if (inputFecha) inputFecha.value = hoyStr;
    if (inputSueldo && sueldoMensual > 0) inputSueldo.value = sueldoMensual;

    if (compMesBase) compMesBase.value = mesAnteriorStr;
    if (compMesActual) compMesActual.value = mesActualStr;

    const modoOscuroGuardado = localStorage.getItem("modo-oscuro-ipap");
    if (modoOscuroGuardado === "true") {
        document.body.classList.add("dark-mode");
        if (btnModoOscuro) btnModoOscuro.textContent = "☀️";
    }

    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js").catch(() => {});
    }

    actualizarVistaCompleta();
});

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPromptPWA = e;
    if (btnInstalarPWA) btnInstalarPWA.classList.remove("oculto");
});

if (btnInstalarPWA) {
    btnInstalarPWA.addEventListener("click", async () => {
        if (!deferredPromptPWA) return;
        deferredPromptPWA.prompt();
        const { outcome } = await deferredPromptPWA.userChoice;
        if (outcome === "accepted") {
            btnInstalarPWA.classList.add("oculto");
        }
        deferredPromptPWA = null;
    });
}

if (btnModoOscuro) {
    btnModoOscuro.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const esOscuro = document.body.classList.contains("dark-mode");
        btnModoOscuro.textContent = esOscuro ? "☀️" : "🌙";
        localStorage.setItem("modo-oscuro-ipap", esOscuro);
    });
}

if (formulario) {
    formulario.addEventListener("submit", (e) => {
        e.preventDefault();

        const concepto = inputConcepto.value.trim();
        const categoria = selectCategoria.value;
        const monto = parseFloat(inputMonto.value);
        const fecha = inputFecha.value;

        if (!concepto || !categoria || isNaN(monto) || monto <= 0 || !fecha) {
            mensajeError.textContent = "Por favor, completá todos los campos con valores válidos.";
            return;
        }

        mensajeError.textContent = "";

        const nuevoGasto = {
            id: Date.now(),
            concepto,
            categoria,
            monto,
            fecha
        };

        gastos.push(nuevoGasto);
        guardarEnLocalStorage();
        actualizarVistaCompleta();

        formulario.reset();
        if (inputFecha) inputFecha.value = obtenerFechaHoy();
        inputConcepto.focus();
    });
}

// ===============================================
// 4. NAVEGACIÓN ENTRE PESTAÑAS
// ===============================================
function cambiarPestana(nombrePestana) {
    document.querySelectorAll(".tab-content").forEach(content => {
        content.classList.remove("active");
    });

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    const tabTarget = document.getElementById(`tab-${nombrePestana}`);
    if (tabTarget) tabTarget.classList.add("active");

    document.querySelectorAll(".tab-btn").forEach(btn => {
        const attrOnclick = btn.getAttribute("onclick") || "";
        if (attrOnclick.includes(nombrePestana)) {
            btn.classList.add("active");
        }
    });

    actualizarVistaCompleta();
}

// ===============================================
// 5. SUELDO, PRESUPUESTO Y AHORRO EN OCIO
// ===============================================
function guardarSueldo() {
    if (!inputSueldo) return;
    const valor = parseFloat(inputSueldo.value);
    sueldoMensual = (!isNaN(valor) && valor > 0) ? valor : 0;
    localStorage.setItem("sueldo-mensual-app", sueldoMensual);
    actualizarResumenMesActual();
}

function actualizarResumenMesActual() {
    const prefijoMesActual = obtenerFechaHoy().substring(0, 7);
    const prefijoMesAnterior = obtenerMesAnterior(prefijoMesActual);

    let fijos = 0, variables = 0, ocio = 0, cultura = 0;
    let ocioMesAnterior = 0;

    gastos.forEach(gasto => {
        const montoNum = Number(gasto.monto) || 0;
        const fechaStr = String(gasto.fecha || "");

        if (fechaStr.startsWith(prefijoMesActual)) {
            if (gasto.categoria === "Gastos fijos") fijos += montoNum;
            else if (gasto.categoria === "Consumos esenciales") variables += montoNum;
            else if (gasto.categoria === "Bienestar y cuidado") ocio += montoNum;
            else if (gasto.categoria === "Ocio y gustos") cultura += montoNum;
        } else if (fechaStr.startsWith(prefijoMesAnterior)) {
            if (gasto.categoria === "Bienestar y cuidado") ocioMesAnterior += montoNum;
        }
    });

    const totalMes = fijos + variables + ocio + cultura;

    if (totalFijosTexto) totalFijosTexto.textContent = "$" + fijos.toFixed(2);
    if (totalVariablesTexto) totalVariablesTexto.textContent = "$" + variables.toFixed(2);
    if (totalOcioTexto) totalOcioTexto.textContent = "$" + ocio.toFixed(2);
    if (totalCulturaTexto) totalCulturaTexto.textContent = "$" + cultura.toFixed(2);

    if (sueldoMensual > 0) {
        const pFijos = ((fijos / sueldoMensual) * 100).toFixed(1);
        const pVar = ((variables / sueldoMensual) * 100).toFixed(1);
        const pOcio = ((ocio / sueldoMensual) * 100).toFixed(1);
        const pCult = ((cultura / sueldoMensual) * 100).toFixed(1);

        if (porcFijosTexto) porcFijosTexto.textContent = `${pFijos}% de tu ingreso`;
        if (porcVariablesTexto) porcVariablesTexto.textContent = `${pVar}% de tu ingreso`;
        if (porcOcioTexto) porcOcioTexto.textContent = `${pOcio}% de tu ingreso`;
        if (porcCulturaTexto) porcCulturaTexto.textContent = `${pCult}% de tu ingreso`;

        if (contenedorSemaforo) {
            contenedorSemaforo.classList.remove("oculto");
            const porcTotal = (totalMes / sueldoMensual) * 100;
            const disponible = sueldoMensual - totalMes;

            textoEstadoPresupuesto.textContent = `Gastado este mes: $${totalMes.toFixed(2)} (${porcTotal.toFixed(1)}%)`;
            textoDisponiblePresupuesto.textContent = disponible >= 0
                ? `Disponible / Ahorro potencial: $${disponible.toFixed(2)}`
                : `Excedido por: $${Math.abs(disponible).toFixed(2)}`;

            barraProgresoSueldo.style.width = `${Math.min(porcTotal, 100)}%`;
            barraProgresoSueldo.classList.remove("alerta-media", "alerta-alta");

            if (porcTotal >= 90) {
                barraProgresoSueldo.classList.add("alerta-alta");
            } else if (porcTotal >= 70) {
                barraProgresoSueldo.classList.add("alerta-media");
            }

            if (ocioMesAnterior > 0 && ocio < ocioMesAnterior) {
                const ahorroOcioPesos = ocioMesAnterior - ocio;
                const porcAhorradoSueldo = ((ahorroOcioPesos / sueldoMensual) * 100).toFixed(1);
                alertaAhorroSueldo.textContent = `🎉 ¡Excelente! Redujiste tus gastos en Bienestar y cuidado respecto al mes pasado y liberaste un ${porcAhorradoSueldo}% de tu sueldo ($${ahorroOcioPesos.toFixed(2)}) para ahorro.`;
            } else {
                const porcLibre = Math.max(0, 100 - porcTotal).toFixed(1);
                alertaAhorroSueldo.textContent = `💡 Actualmente conservás el ${porcLibre}% de tu ingreso mensual sin gastar.`;
            }
        }
    } else {
        if (porcFijosTexto) porcFijosTexto.textContent = "Ingresá tu sueldo arriba";
        if (porcVariablesTexto) porcVariablesTexto.textContent = "Ingresá tu sueldo arriba";
        if (porcOcioTexto) porcOcioTexto.textContent = "Ingresá tu sueldo arriba";
        if (porcCulturaTexto) porcCulturaTexto.textContent = "Ingresá tu sueldo arriba";
        if (contenedorSemaforo) contenedorSemaforo.classList.add("oculto");
    }
}

// ===============================================
// 6. PERSISTENCIA Y CATÁLOGO DE PRODUCTOS
// ===============================================
function guardarEnLocalStorage() {
    localStorage.setItem("gastos-ipap", JSON.stringify(gastos));
}

function eliminarGasto(idGasto) {
    if (confirm("¿Estás seguro de que querés eliminar este registro?")) {
        gastos = gastos.filter(gasto => gasto.id !== idGasto);
        guardarEnLocalStorage();
        actualizarVistaCompleta();
    }
}

function actualizarVistaCompleta() {
    actualizarCatalogoProductos();
    aplicarFiltros();
    actualizarResumenMesActual();
    calcularComparativaPorcentual();
    actualizarComparativa();
}

function actualizarCatalogoProductos() {
    const conteoPorProducto = {};
    const nombreOriginalPorClave = {};

    gastos.forEach(gasto => {
        const clave = normalizarTexto(gasto.concepto);
        if (!clave) return;
        conteoPorProducto[clave] = (conteoPorProducto[clave] || 0) + 1;
        if (!nombreOriginalPorClave[clave]) {
            nombreOriginalPorClave[clave] = String(gasto.concepto).trim();
        }
    });

    if (datalistProductos) {
        datalistProductos.innerHTML = "";
        Object.values(nombreOriginalPorClave)
            .sort((a, b) => a.localeCompare(b))
            .forEach(nombre => {
                const option = document.createElement("option");
                option.value = nombre;
                datalistProductos.appendChild(option);
            });
    }

    if (contenedorChipsProductos) {
        contenedorChipsProductos.innerHTML = "";
        const clavesOrdenadas = Object.keys(conteoPorProducto).sort(
            (a, b) => conteoPorProducto[b] - conteoPorProducto[a]
        );

        if (clavesOrdenadas.length === 0) {
            contenedorChipsProductos.innerHTML = `<span style="font-size: 0.82rem; opacity: 0.6;">Todavía no registraste productos.</span>`;
            return;
        }

        const filtroActual = normalizarTexto(filtroPalabra ? filtroPalabra.value : "");

        clavesOrdenadas.slice(0, 12).forEach(clave => {
            const nombreMostrar = nombreOriginalPorClave[clave];
            const repeticiones = conteoPorProducto[clave];

            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "chip-producto" + (filtroActual === clave ? " activo" : "");
            chip.textContent = `${nombreMostrar} (${repeticiones})`;

            chip.onclick = () => {
                if (!filtroPalabra) return;
                if (normalizarTexto(filtroPalabra.value) === clave) {
                    filtroPalabra.value = "";
                } else {
                    filtroPalabra.value = nombreMostrar;
                }
                aplicarFiltros();
            };

            contenedorChipsProductos.appendChild(chip);
        });
    }
}

// ===============================================
// 7. HISTORIAL, FILTROS Y SEGUIMIENTO POR PALABRA
// ===============================================
function obtenerGastosFiltradosActuales() {
    const palabraBuscada = normalizarTexto(filtroPalabra ? filtroPalabra.value : "");
    const catSeleccionada = filtroCategoria ? filtroCategoria.value : "TODAS";
    const mesSeleccionado = filtroMes ? filtroMes.value : "";

    return gastos.filter(gasto => {
        const coincidePalabra = !palabraBuscada || normalizarTexto(gasto.concepto).includes(palabraBuscada);
        const coincideCat = (catSeleccionada === "TODAS" || gasto.categoria === catSeleccionada);
        const coincideMes = (!mesSeleccionado || (gasto.fecha && String(gasto.fecha).startsWith(mesSeleccionado)));
        return coincidePalabra && coincideCat && coincideMes;
    });
}

function aplicarFiltros() {
    if (!cuerpoTabla) return;
    const palabraBuscada = normalizarTexto(filtroPalabra ? filtroPalabra.value : "");
    const gastosFiltrados = obtenerGastosFiltradosActuales();

    actualizarPanelAnalisisProducto(palabraBuscada, gastosFiltrados);
    renderizarTabla(gastosFiltrados);
    actualizarCatalogoProductos();
}

function actualizarPanelAnalisisProducto(palabraBuscada, listaFiltrada) {
    if (!panelAnalisisProducto) return;

    if (!palabraBuscada || listaFiltrada.length === 0) {
        panelAnalisisProducto.classList.add("oculto");
        return;
    }

    panelAnalisisProducto.classList.remove("oculto");
    if (tituloProductoFiltrado && filtroPalabra) {
        tituloProductoFiltrado.textContent = `"${filtroPalabra.value.trim()}"`;
    }

    const ordenadosPorFecha = [...listaFiltrada].sort((a, b) =>
        String(a.fecha || "").localeCompare(String(b.fecha || ""))
    );

    const totalAcumulado = ordenadosPorFecha.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);
    const cantidad = ordenadosPorFecha.length;
    const promedio = totalAcumulado / cantidad;
    const primerPrecio = Number(ordenadosPorFecha[0].monto) || 0;
    const ultimoPrecio = Number(ordenadosPorFecha[ordenadosPorFecha.length - 1].monto) || 0;

    if (prodGastoTotal) prodGastoTotal.textContent = "$" + totalAcumulado.toFixed(2);
    if (prodCantidadCompras) prodCantidadCompras.textContent = `${cantidad} ${cantidad === 1 ? "vez" : "veces"}`;
    if (prodPrecioPromedio) prodPrecioPromedio.textContent = "$" + promedio.toFixed(2);
    if (prodComparacionExtremos) {
        prodComparacionExtremos.textContent = `$${primerPrecio.toFixed(2)} ➔ $${ultimoPrecio.toFixed(2)}`;
    }

    if (badgeVariacionProducto) {
        if (cantidad > 1 && primerPrecio > 0) {
            const variacionPct = ((ultimoPrecio - primerPrecio) / primerPrecio) * 100;
            const signo = variacionPct > 0 ? "+" : "";
            badgeVariacionProducto.textContent = `Variación punta a punta: ${signo}${variacionPct.toFixed(1)}%`;
            badgeVariacionProducto.style.color = variacionPct > 0 ? "var(--color-fijo)" : "var(--color-principal)";
        } else {
            badgeVariacionProducto.textContent = "1 solo registro";
            badgeVariacionProducto.style.color = "var(--color-texto)";
        }
    }
}

function renderizarTabla(listaGastos) {
    cuerpoTabla.innerHTML = "";
    let totalFiltrado = 0;
    let totalOcioFiltro = 0;

    const cronologico = [...gastos].sort((a, b) =>
        String(a.fecha || "").localeCompare(String(b.fecha || "")) || (a.id - b.id)
    );
    const ultimoPrecioProducto = {};
    const variacionPorId = {};

    cronologico.forEach(g => {
        const clave = normalizarTexto(g.concepto);
        const montoActual = Number(g.monto) || 0;
        if (ultimoPrecioProducto[clave] !== undefined && ultimoPrecioProducto[clave] > 0) {
            const anterior = ultimoPrecioProducto[clave];
            variacionPorId[g.id] = ((montoActual - anterior) / anterior) * 100;
        } else {
            variacionPorId[g.id] = null;
        }
        ultimoPrecioProducto[clave] = montoActual;
    });

    if (listaGastos.length === 0) {
        cuerpoTabla.innerHTML = `
            <tr>
                <td colspan="6" class="texto-centro" style="padding: 20px; opacity: 0.6;">
                    No se encontraron registros de gastos.
                </td>
            </tr>
        `;
        if (totalFiltradoTexto) totalFiltradoTexto.textContent = "Total filtrado: $0.00";
        if (alertaRecorteTexto) alertaRecorteTexto.textContent = "";
        return;
    }

    const listaRecientes = [...listaGastos].sort((a, b) =>
        String(b.fecha || "").localeCompare(String(a.fecha || "")) || (b.id - a.id)
    );

    listaRecientes.forEach(gasto => {
        const montoNum = Number(gasto.monto) || 0;
        totalFiltrado += montoNum;
        if (gasto.categoria === "Ocio y gustos") totalOcioFiltro += montoNum;

        const fila = document.createElement("tr");

        let fechaFormateada = gasto.fecha || "-";
        if (typeof gasto.fecha === "string" && gasto.fecha.includes("-")) {
            const partes = gasto.fecha.split("-");
            fechaFormateada = `${partes[2]}/${partes[1]}/${partes[0]}`;
        }

        let claseBadge = "badge-fijo";
        if (gasto.categoria === "Consumos esenciales") claseBadge = "badge-variable";
        else if (gasto.categoria === "Bienestar y cuidado") claseBadge = "badge-ocio";
        else if (gasto.categoria === "Ocio y gustos") claseBadge = "badge-cultura";

        const tdFecha = document.createElement("td");
        tdFecha.textContent = fechaFormateada;

        const tdConcepto = document.createElement("td");
        tdConcepto.textContent = gasto.concepto;

        const tdBadge = document.createElement("td");
        const spanBadge = document.createElement("span");
        spanBadge.className = `badge ${claseBadge}`;
        spanBadge.textContent = gasto.categoria;
        tdBadge.appendChild(spanBadge);

        const tdMonto = document.createElement("td");
        tdMonto.className = "texto-derecha";
        tdMonto.textContent = "$" + montoNum.toFixed(2);

        const tdVariacion = document.createElement("td");
        tdVariacion.className = "texto-centro";
        const spanVar = document.createElement("span");
        const variacion = variacionPorId[gasto.id];

        if (variacion === null || variacion === undefined) {
            spanVar.className = "var-igual";
            spanVar.textContent = "1ª compra";
        } else if (variacion > 0.1) {
            spanVar.className = "var-sube";
            spanVar.textContent = `▲ +${variacion.toFixed(1)}%`;
        } else if (variacion < -0.1) {
            spanVar.className = "var-baja";
            spanVar.textContent = `▼ ${variacion.toFixed(1)}%`;
        } else {
            spanVar.className = "var-igual";
            spanVar.textContent = "= 0%";
        }
        tdVariacion.appendChild(spanVar);

        const tdAccion = document.createElement("td");
        tdAccion.className = "texto-centro";
        const btnEliminar = document.createElement("button");
        btnEliminar.type = "button";
        btnEliminar.className = "boton-eliminar";
        btnEliminar.title = "Eliminar gasto";
        btnEliminar.textContent = "🗑️";
        btnEliminar.onclick = () => eliminarGasto(gasto.id);
        tdAccion.appendChild(btnEliminar);

        fila.appendChild(tdFecha);
        fila.appendChild(tdConcepto);
        fila.appendChild(tdBadge);
        fila.appendChild(tdMonto);
        fila.appendChild(tdVariacion);
        fila.appendChild(tdAccion);

        cuerpoTabla.appendChild(fila);
    });

    if (totalFiltradoTexto) totalFiltradoTexto.textContent = "Total filtrado: $" + totalFiltrado.toFixed(2);

    if (totalFiltrado > 0 && totalOcioFiltro > 0 && alertaRecorteTexto) {
        const porcentaje = ((totalOcioFiltro / totalFiltrado) * 100).toFixed(0);
        alertaRecorteTexto.textContent = `💡 Podrías ahorrar hasta $${totalOcioFiltro.toFixed(2)} (${porcentaje}% del total filtrado) reduciendo gastos en Ocio y gustos.`;
    } else if (alertaRecorteTexto) {
        alertaRecorteTexto.textContent = "";
    }
}

function limpiarFiltros() {
    if (filtroPalabra) filtroPalabra.value = "";
    if (filtroCategoria) filtroCategoria.value = "TODAS";
    if (filtroMes) filtroMes.value = "";
    aplicarFiltros();
}

function limpiarFiltroComparativa() {
    if (filtroComparativaProducto) filtroComparativaProducto.value = "";
    actualizarComparativa();
}

// ===============================================
// 8. EXPORTAR EXCEL (CSV) Y BACKUP DE DATOS
// ===============================================
function exportarCSV() {
    const lista = obtenerGastosFiltradosActuales();
    if (lista.length === 0) {
        alert("No hay registros en la tabla actual para exportar.");
        return;
    }

    const encabezados = ["Fecha", "Concepto", "Categoria", "Monto"];
    const filasCSV = [encabezados.join(";")];

    lista.forEach(g => {
        const conceptoLimpio = String(g.concepto || "").replace(/;/g, ",");
        const montoComa = Number(g.monto || 0).toFixed(2).replace(".", ",");
        filasCSV.push(`${g.fecha};"${conceptoLimpio}";"${g.categoria}";${montoComa}`);
    });

    const contenido = "\uFEFF" + filasCSV.join("\n");
    const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `mis_gastos_${obtenerFechaHoy()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function descargarBackup() {
    const backupObj = {
        sueldoMensual,
        gastos
    };
    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_gastos_${obtenerFechaHoy()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importarBackup(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = (e) => {
        try {
            const datos = JSON.parse(e.target.result);
            if (Array.isArray(datos)) {
                gastos = datos;
            } else if (datos && Array.isArray(datos.gastos)) {
                gastos = datos.gastos;
                if (datos.sueldoMensual) {
                    sueldoMensual = Number(datos.sueldoMensual) || 0;
                    localStorage.setItem("sueldo-mensual-app", sueldoMensual);
                    if (inputSueldo) inputSueldo.value = sueldoMensual;
                }
            } else {
                alert("El archivo seleccionado no tiene un formato válido.");
                return;
            }
            guardarEnLocalStorage();
            actualizarVistaCompleta();
            alert("¡Copia de seguridad restaurada con éxito!");
        } catch (err) {
            alert("Error al leer el archivo de respaldo.");
        }
    };
    lector.readAsText(archivo);
    event.target.value = "";
}

// ===============================================
// 9. COMPARATIVA PORCENTUAL E INFLACIÓN PERSONAL
// ===============================================
function calcularComparativaPorcentual() {
    if (!compMesBase || !compMesActual) return;

    const mesBase = compMesBase.value;
    const mesActual = compMesActual.value;
    const rubro = compRubro ? compRubro.value : "TODAS";
    const palabra = normalizarTexto(compPalabra ? compPalabra.value : "");

    const sumarPeriodo = (prefijoMes) => {
        if (!prefijoMes) return 0;
        return gastos
            .filter(g => {
                const coincideMes = g.fecha && String(g.fecha).startsWith(prefijoMes);
                const coincideRubro = (rubro === "TODAS" || g.categoria === rubro);
                const coincidePalabra = (!palabra || normalizarTexto(g.concepto).includes(palabra));
                return coincideMes && coincideRubro && coincidePalabra;
            })
            .reduce((acc, g) => acc + (Number(g.monto) || 0), 0);
    };

    const totalBase = sumarPeriodo(mesBase);
    const totalActual = sumarPeriodo(mesActual);
    const diferencia = totalActual - totalBase;

    const tituloBase = document.getElementById("titulo-comp-base");
    const tituloActual = document.getElementById("titulo-comp-actual");
    const montoBaseEl = document.getElementById("monto-comp-base");
    const montoActualEl = document.getElementById("monto-comp-actual");
    const montoDifEl = document.getElementById("monto-comp-diferencia");
    const porcVarEl = document.getElementById("porc-comp-variacion");
    const conclusionEl = document.getElementById("conclusion-comparativa");

    if (tituloBase) tituloBase.textContent = `Total (${mesBase || "Mes Base"})`;
    if (tituloActual) tituloActual.textContent = `Total (${mesActual || "Mes Comparado"})`;
    if (montoBaseEl) montoBaseEl.textContent = "$" + totalBase.toFixed(2);
    if (montoActualEl) montoActualEl.textContent = "$" + totalActual.toFixed(2);
    if (montoDifEl) montoDifEl.textContent = (diferencia >= 0 ? "+$" : "-$") + Math.abs(diferencia).toFixed(2);

    let textoPorcentaje = "0%";
    let mensajeConclusion = "Seleccioná dos períodos con gastos cargados para ver el porcentaje de variación.";

    if (totalBase > 0) {
        const pct = ((totalActual - totalBase) / totalBase) * 100;
        const signo = pct > 0 ? "+" : "";
        textoPorcentaje = `${signo}${pct.toFixed(1)}%`;

        const etiquetaAnalisis = palabra
            ? `el gasto en "${compPalabra.value.trim()}"`
            : (rubro !== "TODAS" ? `el rubro ${rubro}` : "tu gasto total");

        if (pct > 0) {
            mensajeConclusion = `📈 Entre ${mesBase} y ${mesActual}, ${etiquetaAnalisis} aumentó un ${pct.toFixed(1)}% (+$${diferencia.toFixed(2)}).`;
        } else if (pct < 0) {
            mensajeConclusion = `🎉 Entre ${mesBase} y ${mesActual}, ${etiquetaAnalisis} se redujo un ${Math.abs(pct).toFixed(1)}% (ahorraste $${Math.abs(diferencia).toFixed(2)}).`;
        } else {
            mensajeConclusion = `⚖️ El gasto se mantuvo exactamente igual entre ambos períodos.`;
        }
    } else if (totalActual > 0) {
        textoPorcentaje = "+100%";
        mensajeConclusion = `ℹ️ No había gastos registrados en ${mesBase} para este filtro, y en ${mesActual} sumaron $${totalActual.toFixed(2)}.`;
    }

    if (porcVarEl) porcVarEl.textContent = textoPorcentaje;
    if (conclusionEl) conclusionEl.textContent = mensajeConclusion;
}

function actualizarComparativa() {
    if (!contenedorComparativa) return;
    contenedorComparativa.innerHTML = "";

    const prodFiltro = normalizarTexto(filtroComparativaProducto ? filtroComparativaProducto.value : "");

    const listaComparar = gastos.filter(gasto => {
        if (!prodFiltro) return true;
        return normalizarTexto(gasto.concepto).includes(prodFiltro);
    });

    if (listaComparar.length === 0) {
        contenedorComparativa.innerHTML = "<p style='text-align:center; opacity:0.6; padding: 20px;'>No hay suficientes registros para comparar.</p>";
        return;
    }

    const mesesAgrupados = {};

    listaComparar.forEach(gasto => {
        if (!gasto.fecha) return;
        const mesClave = String(gasto.fecha).substring(0, 7);
        if (!mesesAgrupados[mesClave]) {
            mesesAgrupados[mesClave] = { fijos: 0, variables: 0, ocio: 0, cultura: 0, total: 0, compras: 0 };
        }

        const montoNum = Number(gasto.monto) || 0;
        if (gasto.categoria === "Gastos fijos") mesesAgrupados[mesClave].fijos += montoNum;
        else if (gasto.categoria === "Consumos esenciales") mesesAgrupados[mesClave].variables += montoNum;
        else if (gasto.categoria === "Bienestar y cuidado") mesesAgrupados[mesClave].ocio += montoNum;
        else if (gasto.categoria === "Ocio y gustos") mesesAgrupados[mesClave].cultura += montoNum;

        mesesAgrupados[mesClave].total += montoNum;
        mesesAgrupados[mesClave].compras += 1;
    });

    const clavesOrdenadas = Object.keys(mesesAgrupados).sort().reverse();

    clavesOrdenadas.forEach(mesKey => {
        const datos = mesesAgrupados[mesKey];
        const [anio, mesNum] = mesKey.split("-");
        const fechaObj = new Date(parseInt(anio), parseInt(mesNum) - 1, 1);
        const nombreMes = fechaObj.toLocaleString("es-ES", { month: "long", year: "numeric" });

        const detalleProd = prodFiltro
            ? ` <span style="font-size:0.85rem; opacity:0.8;">(${datos.compras} ${datos.compras === 1 ? "vez" : "veces"} de "${filtroComparativaProducto.value.trim()}")</span>`
            : "";

        const porcSueldoMes = sueldoMensual > 0
            ? ` <span style="font-size:0.85rem; opacity:0.8;">(${((datos.total / sueldoMensual) * 100).toFixed(1)}% del sueldo)</span>`
            : "";

        const card = document.createElement("div");
        card.className = "card-comparativa";
        card.innerHTML = `
            <h3>📅 ${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)}${detalleProd}</h3>
            <div class="grid-resumen-mes">
                <div><strong class="texto-fijo">Gastos fijos:</strong> $${datos.fijos.toFixed(2)}</div>
                <div><strong class="texto-variable">Consumos esenciales:</strong> $${datos.variables.toFixed(2)}</div>
                <div><strong class="texto-ocio">Bienestar y cuidado:</strong> $${datos.ocio.toFixed(2)}</div>
                <div><strong class="texto-cultura">Ocio y gustos:</strong> $${datos.cultura.toFixed(2)}</div>
            </div>
            <div style="margin-top: 10px; font-weight: bold; border-top: 1px dashed rgba(0,0,0,0.1); padding-top: 6px;">
                Total del Mes: $${datos.total.toFixed(2)}${porcSueldoMes}
            </div>
        `;
        contenedorComparativa.appendChild(card);
    });
}

// ===============================================
// 10. ANALIZADOR: ¿CUOTAS O CONTADO?
// ===============================================
function calcularCuotasVsContado() {
    const contado = parseFloat(document.getElementById("cuotas-contado")?.value);
    const totalCuotas = parseFloat(document.getElementById("cuotas-total")?.value);
    const cantCuotas = parseInt(document.getElementById("cuotas-cantidad")?.value) || 6;
    const inflacionMensual = (parseFloat(document.getElementById("cuotas-inflacion")?.value) || 0) / 100;

    const boxResultado = document.getElementById("resultado-cuotas-box");
    if (!boxResultado) return;

    if (isNaN(contado) || contado <= 0 || isNaN(totalCuotas) || totalCuotas <= 0) {
        boxResultado.classList.add("oculto");
        return;
    }

    boxResultado.classList.remove("oculto");

    const valorCuota = totalCuotas / cantCuotas;
    const recargoNominalPct = ((totalCuotas - contado) / contado) * 100;

    let valorPresente = 0;
    for (let i = 1; i <= cantCuotas; i++) {
        valorPresente += valorCuota / Math.pow(1 + inflacionMensual, i);
    }

    const diferenciaReal = contado - valorPresente;
    const veredictoEl = document.getElementById("veredicto-cuotas");

    if (valorPresente < contado) {
        veredictoEl.textContent = `✅ CONVIENE COMPRAR EN ${cantCuotas} CUOTAS`;
        veredictoEl.style.color = "var(--color-principal)";
    } else {
        veredictoEl.textContent = `💵 CONVIENE PAGAR AL CONTADO`;
        veredictoEl.style.color = "var(--color-fijo)";
    }

    document.getElementById("valor-cada-cuota").textContent = "$" + valorCuota.toFixed(2);
    document.getElementById("recargo-nominal-cuotas").textContent = (recargoNominalPct >= 0 ? "+" : "") + recargoNominalPct.toFixed(1) + "%";
    document.getElementById("valor-presente-cuotas").textContent = "$" + valorPresente.toFixed(2);
    document.getElementById("ahorro-real-cuotas").textContent = "$" + Math.abs(diferenciaReal).toFixed(2);
}