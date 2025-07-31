// Estado global de la aplicación
const state = {
    empresas: [],
    puestos: [],
    puestoSeleccionado: null
};

// Tipos de puestos
const TIPOS_PUESTO = {
    GERENCIAL: 'GERENCIAL',
    PIZZAS: 'PIZZAS',
    ESTANDAR: 'ESTÁNDAR'
};

// Colores disponibles
const COLORES_DISPONIBLES = [
    '#1f78b4', '#33a02c', '#e31a1c', '#ff7f00', 
    '#6a3d9a', '#b15928', '#ffff99', '#a6cee3'
];

// Referencias DOM
let canvas, ctx, modal, selectEmpresa;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    cargarDatos();
    generarPuestos();
    actualizarTablas();
});

function initializeApp() {
    canvas = document.getElementById('planoCanvas');
    ctx = canvas.getContext('2d');
    modal = document.getElementById('modalAsignar');
    selectEmpresa = document.getElementById('selectEmpresa');
    
    // Ajustar canvas al contenedor
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const container = document.querySelector('.plano-wrapper');
    const img = document.getElementById('planoImagen');
    
    // Esperar a que la imagen cargue
    img.onload = function() {
        const containerRect = container.getBoundingClientRect();
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        
        let canvasWidth = Math.min(containerRect.width * 0.9, img.naturalWidth);
        let canvasHeight = canvasWidth / aspectRatio;
        
        if (canvasHeight > containerRect.height * 0.9) {
            canvasHeight = containerRect.height * 0.9;
            canvasWidth = canvasHeight * aspectRatio;
        }
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        dibujarPuestos();
    };
    
    if (img.complete) {
        img.onload();
    }
}

function setupEventListeners() {
    // Formulario de empresa
    document.getElementById('empresaForm').addEventListener('submit', agregarEmpresa);
    
    // Canvas clicks
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasHover);
    
    // Modal
    document.querySelector('.close').addEventListener('click', cerrarModal);
    document.getElementById('btnAsignar').addEventListener('click', asignarPuesto);
    document.getElementById('btnDesasignar').addEventListener('click', desasignarPuesto);
    document.getElementById('btnCancelar').addEventListener('click', cerrarModal);
    
    // Exportar PDF
    document.getElementById('exportPDF').addEventListener('click', generarPDF);
    
    // Limpiar todo
    document.getElementById('limpiarTodo').addEventListener('click', limpiarTodo);
    
    // Cerrar modal al hacer click fuera
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            cerrarModal();
        }
    });
}

function generarPuestos() {
    // Puestos fijos definidos manualmente
    state.puestos = [
            { id: 1, tipo: TIPOS_PUESTO.GERENCIAL, x: 100, y: 80, size: 20, forma: 'rect', empresaId: null, ocupado: false },
            { id: 2, tipo: TIPOS_PUESTO.GERENCIAL, x: 160, y: 80, size: 20, forma: 'rect', empresaId: null, ocupado: false },
            { id: 3, tipo: TIPOS_PUESTO.GERENCIAL, x: 220, y: 80, size: 20, forma: 'rect', empresaId: null, ocupado: false },
            { id: 4, tipo: TIPOS_PUESTO.PIZZAS, x: 100, y: 150, size: 18, forma: 'circle', empresaId: null, ocupado: false },
            { id: 5, tipo: TIPOS_PUESTO.PIZZAS, x: 100, y: 150, size: 18, forma: 'circle', empresaId: null, ocupado: false },
            { id: 6, tipo: TIPOS_PUESTO.PIZZAS, x: 220, y: 150, size: 18, forma: 'circle', empresaId: null, ocupado: false },
            { id: 7, tipo: TIPOS_PUESTO.ESTANDAR, x: 121, y: 250, size: 16, forma: 'triangle', empresaId: null, ocupado: false },
            { id: 8, tipo: TIPOS_PUESTO.ESTANDAR, x: 122, y: 252, size: 16, forma: 'triangle', empresaId: null, ocupado: false },
            { id: 9, tipo: TIPOS_PUESTO.ESTANDAR, x: 220, y: 220, size: 16, forma: 'triangle', empresaId: null, ocupado: false },
            {
                id: 10,
                tipo: TIPOS_PUESTO.ESTANDAR,
                forma: 'polygon',
                puntos: [
                    [300, 180],
                    [320, 170],
                    [340, 180],
                    [340, 200],
                    [320, 210],
                    [300, 200]
                ],
                empresaId: null,
                ocupado: false
            }
    ];

    dibujarPuestos();
}


function dibujarPuestos() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    state.puestos.forEach(puesto => {
        ctx.save();

        // Color de fondo
        if (puesto.ocupado && puesto.empresaId) {
            const empresa = state.empresas.find(e => e.id === puesto.empresaId);
            ctx.fillStyle = empresa ? empresa.color : '#ffffff';
        } else {
            ctx.fillStyle = '#ffffff';
        }

        // Color de borde
        switch (puesto.tipo) {
            case TIPOS_PUESTO.GERENCIAL:
                ctx.strokeStyle = '#2c3e50';
                ctx.lineWidth = 3;
                break;
            case TIPOS_PUESTO.PIZZAS:
                ctx.strokeStyle = '#e74c3c';
                ctx.lineWidth = 2;
                break;
            case TIPOS_PUESTO.ESTANDAR:
                ctx.strokeStyle = '#95a5a6';
                ctx.lineWidth = 1;
                break;
        }

        // Dibujar según forma
        if (puesto.forma === 'rect') {
            ctx.fillRect(puesto.x - puesto.size / 2, puesto.y - puesto.size / 2, puesto.size, puesto.size);
            ctx.strokeRect(puesto.x - puesto.size / 2, puesto.y - puesto.size / 2, puesto.size, puesto.size);
        } else if (puesto.forma === 'circle') {
            ctx.beginPath();
            ctx.arc(puesto.x, puesto.y, puesto.size / 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        } else if (puesto.forma === 'triangle') {
            ctx.beginPath();
            const size = puesto.size;
            ctx.moveTo(puesto.x, puesto.y - size / 2);
            ctx.lineTo(puesto.x - size / 2, puesto.y + size / 2);
            ctx.lineTo(puesto.x + size / 2, puesto.y + size / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (puesto.forma === 'polygon' && puesto.puntos) {
            ctx.beginPath();
            ctx.moveTo(puesto.puntos[0][0], puesto.puntos[0][1]);
            for (let i = 1; i < puesto.puntos.length; i++) {
                ctx.lineTo(puesto.puntos[i][0], puesto.puntos[i][1]);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    });
}

function puntoEnPoligono(puntos, x, y) {
    let dentro = false;
    for (let i = 0, j = puntos.length - 1; i < puntos.length; j = i++) {
        const xi = puntos[i][0], yi = puntos[i][1];
        const xj = puntos[j][0], yj = puntos[j][1];

        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi + 0.00001) + xi);
        if (intersect) dentro = !dentro;
    }
    return dentro;
}

function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Buscar puesto clickeado
    const puesto = state.puestos.find(p => {
        if (p.forma === 'circle' || p.forma === 'rect' || p.forma === 'triangle') {
            const dx = x - p.x;
            const dy = y - p.y;
            return Math.sqrt(dx * dx + dy * dy) <= (p.size / 2) + 5;
        } else if (p.forma === 'polygon' && p.puntos) {
            return puntoEnPoligono(p.puntos, x, y);
        }
        return false;
    });    
    
    if (puesto) {
        mostrarModalAsignacion(puesto);
    }
}

function handleCanvasHover(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Buscar puesto bajo el cursor
    const puesto = state.puestos.find(p => {
        const distance = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2);
        return distance <= p.size/2 + 5;
    });
    
    canvas.style.cursor = puesto ? 'pointer' : 'crosshair';
    
    // Tooltip simple
    if (puesto) {
        canvas.title = `${puesto.tipo} - ID: ${puesto.id}${puesto.ocupado ? ' (Ocupado)' : ' (Disponible)'}`;
    } else {
        canvas.title = '';
    }
}

function mostrarModalAsignacion(puesto) {
    state.puestoSeleccionado = puesto;
    
    // Actualizar info del puesto
    document.getElementById('infoPuesto').textContent = 
        `Puesto ${puesto.id} - Tipo: ${puesto.tipo}`;
    
    // Actualizar select de empresas
    actualizarSelectEmpresas();
    
    // Mostrar/ocultar botones según estado
    const btnDesasignar = document.getElementById('btnDesasignar');
    if (puesto.ocupado) {
        btnDesasignar.style.display = 'inline-block';
        selectEmpresa.value = puesto.empresaId || '';
    } else {
        btnDesasignar.style.display = 'none';
        selectEmpresa.value = '';
    }
    
    modal.style.display = 'block';
}

function actualizarSelectEmpresas() {
    selectEmpresa.innerHTML = '<option value="">Seleccionar...</option>';
    
    state.empresas.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa.id;
        option.textContent = empresa.nombre;
        option.style.backgroundColor = empresa.color;
        option.style.color = 'white';
        selectEmpresa.appendChild(option);
    });
}

function asignarPuesto() {
    const empresaId = selectEmpresa.value;
    
    if (!empresaId) {
        alert('Por favor selecciona una empresa');
        return;
    }
    
    if (state.puestoSeleccionado) {
        state.puestoSeleccionado.empresaId = empresaId;
        state.puestoSeleccionado.ocupado = true;
        
        dibujarPuestos();
        actualizarTablas();
        guardarDatos();
        cerrarModal();
    }
}

function desasignarPuesto() {
    if (state.puestoSeleccionado) {
        state.puestoSeleccionado.empresaId = null;
        state.puestoSeleccionado.ocupado = false;
        
        dibujarPuestos();
        actualizarTablas();
        guardarDatos();
        cerrarModal();
    }
}

function cerrarModal() {
    modal.style.display = 'none';
    state.puestoSeleccionado = null;
}

function agregarEmpresa(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('nombreEmpresa').value.trim();
    const color = document.getElementById('colorEmpresa').value;
    
    // Validaciones
    if (!nombre || !color) {
        alert('Por favor completa todos los campos');
        return;
    }
    
    if (state.empresas.some(e => e.nombre.toLowerCase() === nombre.toLowerCase())) {
        alert('Ya existe una empresa con ese nombre');
        return;
    }
    
    if (state.empresas.some(e => e.color === color)) {
        alert('Ya existe una empresa con ese color');
        return;
    }
    
    // Crear empresa
    const empresa = {
        id: Date.now().toString(),
        nombre: nombre,
        color: color
    };
    
    state.empresas.push(empresa);
    
    // Limpiar formulario
    document.getElementById('empresaForm').reset();
    
    // Actualizar UI
    actualizarListaEmpresas();
    actualizarTablas();
    guardarDatos();
}

function actualizarListaEmpresas() {
    const lista = document.getElementById('listaEmpresas');
    lista.innerHTML = '';
    
    state.empresas.forEach(empresa => {
        const div = document.createElement('div');
        div.className = 'empresa-item';
        div.style.borderLeftColor = empresa.color;
        
        div.innerHTML = `
            <div class="empresa-info">
                <div class="empresa-color" style="background-color: ${empresa.color}"></div>
                <span class="empresa-nombre">${empresa.nombre}</span>
            </div>
            <div class="empresa-acciones">
                <button class="btn-small btn-edit" onclick="editarEmpresa('${empresa.id}')">Editar</button>
                <button class="btn-small btn-delete" onclick="eliminarEmpresa('${empresa.id}')">Eliminar</button>
            </div>
        `;
        
        lista.appendChild(div);
    });
}

function editarEmpresa(id) {
    const empresa = state.empresas.find(e => e.id === id);
    if (!empresa) return;
    
    const nuevoNombre = prompt('Nuevo nombre:', empresa.nombre);
    if (nuevoNombre && nuevoNombre.trim() !== empresa.nombre) {
        if (state.empresas.some(e => e.id !== id && e.nombre.toLowerCase() === nuevoNombre.toLowerCase())) {
            alert('Ya existe una empresa con ese nombre');
            return;
        }
        
        empresa.nombre = nuevoNombre.trim();
        actualizarListaEmpresas();
        actualizarTablas();
        guardarDatos();
    }
}

function eliminarEmpresa(id) {
    const empresa = state.empresas.find(e => e.id === id);
    if (!empresa) return;
    
    // Verificar si tiene puestos asignados
    const puestosAsignados = state.puestos.filter(p => p.empresaId === id);
    
    if (puestosAsignados.length > 0) {
        if (!confirm(`La empresa ${empresa.nombre} tiene ${puestosAsignados.length} puestos asignados. ¿Deseas eliminarla de todas formas?`)) {
            return;
        }
        
        // Desasignar todos los puestos
        puestosAsignados.forEach(puesto => {
            puesto.empresaId = null;
            puesto.ocupado = false;
        });
    }
    
    // Eliminar empresa
    state.empresas = state.empresas.filter(e => e.id !== id);
    
    // Actualizar UI
    actualizarListaEmpresas();
    actualizarTablas();
    dibujarPuestos();
    guardarDatos();
}

function actualizarTablas() {
    actualizarTablaEmpresas();
    actualizarResumenGeneral();
}

function actualizarTablaEmpresas() {
    const tbody = document.querySelector('#tablaEmpresas tbody');
    tbody.innerHTML = '';
    
    state.empresas.forEach(empresa => {
        const puestosEmpresa = state.puestos.filter(p => p.empresaId === empresa.id);
        
        const gerencial = puestosEmpresa.filter(p => p.tipo === TIPOS_PUESTO.GERENCIAL).length;
        const pizzas = puestosEmpresa.filter(p => p.tipo === TIPOS_PUESTO.PIZZAS).length;
        const estandar = puestosEmpresa.filter(p => p.tipo === TIPOS_PUESTO.ESTANDAR).length;
        const total = gerencial + pizzas + estandar;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="background-color: ${empresa.color}20; font-weight: bold;">${empresa.nombre}</td>
            <td>${gerencial}</td>
            <td>${pizzas}</td>
            <td>${estandar}</td>
            <td style="font-weight: bold;">${total}</td>
        `;
        
        tbody.appendChild(row);
    });
}

function actualizarResumenGeneral() {
    const tipos = ['GERENCIAL', 'PIZZAS', 'ESTÁNDAR'];

    let total = 0, totalOcupados = 0, totalDisponibles = 0;

    tipos.forEach(tipo => {
        const totalTipo = state.puestos.filter(p => p.tipo === tipo).length;
        const ocupadosTipo = state.puestos.filter(p => p.tipo === tipo && p.ocupado).length;
        const disponiblesTipo = totalTipo - ocupadosTipo;

        document.getElementById(`total${tipo === 'ESTÁNDAR' ? 'Estandar' : tipo.charAt(0) + tipo.slice(1).toLowerCase()}`).textContent = totalTipo;
        document.getElementById(`ocupados${tipo === 'ESTÁNDAR' ? 'Estandar' : tipo.charAt(0) + tipo.slice(1).toLowerCase()}`).textContent = ocupadosTipo;
        document.getElementById(`disponibles${tipo === 'ESTÁNDAR' ? 'Estandar' : tipo.charAt(0) + tipo.slice(1).toLowerCase()}`).textContent = disponiblesTipo;

        total += totalTipo;
        totalOcupados += ocupadosTipo;
        totalDisponibles += disponiblesTipo;
    });

    document.getElementById('totalGeneral').textContent = total;
    document.getElementById('ocupadosTotal').textContent = totalOcupados;
    document.getElementById('disponiblesTotal').textContent = totalDisponibles;
}

function limpiarTodo() {
    if (confirm('¿Estás seguro de que deseas limpiar todos los datos? Esta acción no se puede deshacer.')) {
        state.empresas = [];
        state.puestos.forEach(puesto => {
            puesto.empresaId = null;
            puesto.ocupado = false;
        });
        
        actualizarListaEmpresas();
        actualizarTablas();
        dibujarPuestos();
        guardarDatos();
    }
}

function generarPDF() {
    const canvas = document.getElementById('planoCanvas');
    const canvasImg = canvas.toDataURL('image/png');
    const logoImg = new Image();
    logoImg.src = '/marcaagua.png'; // Asegúrate de que esté en `/public`

    logoImg.onload = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'landscape', // 👉 Hacemos la hoja horizontal
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // 🔵 TÍTULO CENTRADO
        doc.setFontSize(20);
        const titulo = 'Ocupación Hubux';
        const tituloWidth = doc.getTextWidth(titulo);
        doc.text(titulo, (pageWidth - tituloWidth) / 2, 15);

        // 🖼️ MARCA DE AGUA (detrás del plano)
        doc.addImage(logoImg, 'PNG', 10, 35, 80, 80, '', 'NONE', 0.1); // Transparente

        // 🖼️ IMAGEN DEL PLANO con puestos asignados (canvas)
        doc.addImage(canvasImg, 'PNG', 10, 35, 180, 130); // A la izquierda

        // 📊 TABLA DE EMPRESAS (a la derecha)
        const empresasData = state.empresas.map(empresa => {
            const puestosEmpresa = state.puestos.filter(p => p.empresaId === empresa.id);
            const gerencial = puestosEmpresa.filter(p => p.tipo === TIPOS_PUESTO.GERENCIAL).length;
            const pizzas = puestosEmpresa.filter(p => p.tipo === TIPOS_PUESTO.PIZZAS).length;
            const estandar = puestosEmpresa.filter(p => p.tipo === TIPOS_PUESTO.ESTANDAR).length;
            const total = gerencial + pizzas + estandar;

            return [empresa.nombre, gerencial, pizzas, estandar, total];
        });

        doc.autoTable({
            startY: 35,
            startX: 200,
            head: [['EMPRESA', 'GERENCIAL', 'PIZZAS', 'ESTÁNDAR', 'TOTAL']],
            body: empresasData,
            theme: 'grid',
            headStyles: { fillColor: [102, 126, 234] },
            styles: { fontSize: 9 }
        });

        // 📌 RESUMEN GENERAL DE PUESTOS DETALLADO
        const resumenY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text('Resumen General', 200, resumenY);

        // Datos resumen
        const gerencialTotal = state.puestos.filter(p => p.tipo === TIPOS_PUESTO.GERENCIAL).length;
        const pizzasTotal = state.puestos.filter(p => p.tipo === TIPOS_PUESTO.PIZZAS).length;
        const estandarTotal = state.puestos.filter(p => p.tipo === TIPOS_PUESTO.ESTANDAR).length;

        const gerencialOcupados = state.puestos.filter(p => p.tipo === TIPOS_PUESTO.GERENCIAL && p.ocupado).length;
        const pizzasOcupados = state.puestos.filter(p => p.tipo === TIPOS_PUESTO.PIZZAS && p.ocupado).length;
        const estandarOcupados = state.puestos.filter(p => p.tipo === TIPOS_PUESTO.ESTANDAR && p.ocupado).length;

        const gerencialDisponibles = gerencialTotal - gerencialOcupados;
        const pizzasDisponibles = pizzasTotal - pizzasOcupados;
        const estandarDisponibles = estandarTotal - estandarOcupados;

        const totalTotal = gerencialTotal + pizzasTotal + estandarTotal;
        const totalOcupados = gerencialOcupados + pizzasOcupados + estandarOcupados;
        const totalDisponibles = gerencialDisponibles + pizzasDisponibles + estandarDisponibles;

        // Estructura de la tabla
        doc.autoTable({
            startY: resumenY + 5,
            startX: 200,
            head: [['Puesto', 'Gerencial', 'Pizzas', 'Estándar', 'Total']],
            body: [
                ['Ocupados', gerencialOcupados, pizzasOcupados, estandarOcupados, totalOcupados],
                ['Disponibles', gerencialDisponibles, pizzasDisponibles, estandarDisponibles, totalDisponibles],
                ['Total', gerencialTotal, pizzasTotal, estandarTotal, totalTotal]
            ],
            theme: 'grid',
            headStyles: { fillColor: [255, 204, 0] },
            styles: { fontSize: 9 }
        });

        // 📅 Pie de página
        doc.setFontSize(9);
        doc.text(`Generado el ${new Date().toLocaleString('es-ES')}`, 10, pageHeight - 10);

        doc.save(`Hubux_${new Date().toISOString().split('T')[0]}.pdf`);
    };
}

function guardarDatos() {
    localStorage.setItem('gestionPuestos', JSON.stringify({
        empresas: state.empresas,
        puestos: state.puestos
    }));
}

function cargarDatos() {
    const datos = localStorage.getItem('gestionPuestos');
    if (datos) {
        const parsed = JSON.parse(datos);
        state.empresas = parsed.empresas || [];
        
        // Si hay puestos guardados, usarlos; si no, generar nuevos
        if (parsed.puestos && parsed.puestos.length > 0) {
            state.puestos = parsed.puestos;
        }
        
        actualizarListaEmpresas();
    }
}