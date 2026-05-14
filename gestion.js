function crearGestor() {
  let _empleados = [];
  let _historial = [];

  return {
    agregar: function (empleado, callback) {
      _empleados.push(empleado);

      _historial.push({
        accion: `Se agregó a ${empleado.nombre}`,
        hora: new Date().toLocaleTimeString()
      });

      if (typeof callback === "function") {
        callback(empleado);
      }

      renderizarLista(_empleados);
      actualizarEstadisticas();
      actualizarHistorial();
    },

    eliminar: function (id, callback) {
      const empleadoEliminado = _empleados.find(emp => emp.id === id);

      _empleados = _empleados.filter(emp => emp.id !== id);

      _historial.push({
        accion: `Se eliminó a ${empleadoEliminado.nombre}`,
        hora: new Date().toLocaleTimeString()
      });

      if (typeof callback === "function") {
        callback(empleadoEliminado);
      }

      renderizarLista(_empleados);
      actualizarEstadisticas();
      actualizarHistorial();
    },

    buscar: function (texto) {
      return _empleados.filter(emp =>
        emp.nombre.toLowerCase().includes(texto.toLowerCase())
      );
    },

    filtrarDept: function (dept) {
      if (dept === "todos") {
        return [..._empleados];
      }

      return _empleados.filter(emp => emp.dept === dept);
    },

    estadisticas: function () {
      const empleados = this.obtenerEmpleados();

      const total = empleados.length;

      const promSalario =
        total === 0
          ? 0
          : empleados.reduce((acc, emp) => acc + emp.salario, 0) / total;

      const mayorSalario =
        total === 0
          ? null
          : empleados.reduce((max, emp) =>
              emp.salario > max.salario ? emp : max
            );

      const masAntiguo =
        total === 0
          ? null
          : empleados.reduce((max, emp) =>
              emp.antiguedad > max.antiguedad ? emp : max
            );

      return {
        total,
        promSalario,
        mayorSalario,
        masAntiguo
      };
    },

    obtenerEmpleados: function () {
      return [..._empleados];
    },

    obtenerHistorial: function () {
      return [..._historial];
    },

    limpiarHistorial: function () {
      _historial = [];
      actualizarHistorial();
    }
  };
}

const gestor = crearGestor();

function agregarEmpleado() {
  const nombre = document.getElementById("inputNombre").value;
  const dept = document.getElementById("inputDept").value;
  const salario = document.getElementById("inputSalario").value;
  const antiguedad = document.getElementById("inputAntiguedad").value;

  if (!nombre || !dept || !salario || !antiguedad) {
    mostrarNotificacion("Todos los campos son obligatorios", "error");
    return;
  }

  const empleado = {
    id: Date.now(),
    nombre: nombre,
    dept: dept,
    salario: Number(salario),
    antiguedad: Number(antiguedad)
  };

  gestor.agregar(empleado, function (emp) {
    mostrarNotificacion(`${emp.nombre} agregado correctamente`, "ok");
  });

  limpiarFormulario();
}

function eliminarEmpleado(id) {
  gestor.eliminar(id, function (emp) {
    mostrarNotificacion(`${emp.nombre} fue eliminado`, "warning");
  });
}

function buscarEmpleados(texto) {
  const resultados = gestor.buscar(texto);
  renderizarLista(resultados);
}

function filtrarPorDept(dept, btnElement) {
  const botones = document.querySelectorAll(".filtro-btn");

  botones.forEach(function (btn) {
    btn.classList.remove("activo");
  });

  btnElement.classList.add("activo");

  const filtrados = gestor.filtrarDept(dept);

  renderizarLista(filtrados);
}

function renderizarLista(empleados) {
  const lista = document.getElementById("listaEmpleados");

  if (empleados.length === 0) {
    lista.innerHTML = `
      <div class="estado-vacio">
        <div class="icono">👥</div>
        No hay empleados
      </div>
    `;
    return;
  }

  const maxSalario = Math.max(...empleados.map(emp => emp.salario));

  lista.innerHTML = empleados.map(function (emp) {
    const porcentaje = (emp.salario / maxSalario) * 100;

    return `
      <div class="empleado-item">
        <div class="empleado-info">
          <div class="empleado-nombre">${emp.nombre}</div>

          <div class="empleado-detalle">
            ${emp.dept} · $${emp.salario.toLocaleString()}
          </div>

          <div class="salario-barra">
            <div class="salario-fill" style="width:${porcentaje}%"></div>
          </div>
        </div>

        <div class="empleado-acciones">
          <button class="btn-elim" onclick="eliminarEmpleado(${emp.id})">
            ✕
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function actualizarEstadisticas() {
  const stats = gestor.estadisticas();

  document.getElementById("statTotal").textContent = stats.total;

  document.getElementById("statPromSalario").textContent =
    "$" + Math.round(stats.promSalario).toLocaleString();

  document.getElementById("statMasAntiguo").textContent =
    stats.masAntiguo ? stats.masAntiguo.nombre : "—";

  document.getElementById("statMayorSalario").textContent =
    stats.mayorSalario ? stats.mayorSalario.nombre : "—";
}

function actualizarHistorial() {
  const historial = gestor.obtenerHistorial();

  const contenedor = document.getElementById("historialLista");

  if (historial.length === 0) {
    contenedor.innerHTML = `
      <div class="estado-vacio">
        <div class="icono">📭</div>
        No hay historial
      </div>
    `;
    return;
  }

  contenedor.innerHTML = historial.map(function (item) {
    return `
      <div class="historial-item">
        <div class="hist-dot"></div>
        <span>${item.accion}</span>
        <span class="hist-hora">${item.hora}</span>
      </div>
    `;
  }).join("");
}

function generarReporte() {
  const min = Number(document.getElementById("filtroMin").value) || 0;
  const max = Number(document.getElementById("filtroMax").value) || Infinity;

  const empleados = gestor.obtenerEmpleados();

  const filtrados = empleados.filter(function (emp) {
    return emp.salario >= min && emp.salario <= max;
  });

  const totalNomina = filtrados.reduce(function (acc, emp) {
    return acc + emp.salario;
  }, 0);

  const tabla = document.getElementById("tablaReporte");

  if (filtrados.length === 0) {
    tabla.innerHTML = `
      <div class="estado-vacio">
        <div class="icono">📄</div>
        No hay resultados
      </div>
    `;
    return;
  }

  tabla.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Departamento</th>
          <th>Salario</th>
          <th>Antigüedad</th>
          <th>% Total</th>
        </tr>
      </thead>

      <tbody>
        ${filtrados.map(function (emp) {
          return `
            <tr>
              <td>${emp.nombre}</td>

              <td>
                <span class="badge-dept dept-${emp.dept}">
                  ${emp.dept}
                </span>
              </td>

              <td>$${emp.salario.toLocaleString()}</td>

              <td>${emp.antiguedad} años</td>

              <td>
                ${((emp.salario / totalNomina) * 100).toFixed(1)}%
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;

  const total = document.getElementById("totalNomina");

  total.style.display = "block";

  total.textContent =
    `Total nómina: $${totalNomina.toLocaleString()}`;
}

function crearNotificador() {
    let contador = 0;

    return function (mensaje, tipo) {
    contador++;

    const notif = document.createElement("div");

    notif.className = `notif notif-${tipo}`;

    notif.textContent = `#${contador} - ${mensaje}`;

    document.getElementById("notifArea").appendChild(notif);

    setTimeout(function () {
    notif.remove();
    }, 3000);
    };
}

const mostrarNotificacion = crearNotificador();

function limpiarFormulario() {
    document.getElementById("inputNombre").value = "";
    document.getElementById("inputDept").value = "";
    document.getElementById("inputSalario").value = "";
    document.getElementById("inputAntiguedad").value = "";
}

function limpiarHistorial() {
    gestor.limpiarHistorial();
}

function resetearReporte() {
    document.getElementById("filtroMin").value = "";
    document.getElementById("filtroMax").value = "";

    document.getElementById("tablaReporte").innerHTML = `
    <div class="estado-vacio">
    <div class="icono">📄</div>
    El reporte aparecerá aquí
    </div>
    `;

    document.getElementById("totalNomina").style.display = "none";
}