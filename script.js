async function fetchData() {
    const response = await fetch('https://raw.githubusercontent.com/JUANCITOPENA/RECURSOS-DE-BASE-DE-DATOS-Y-DATOS-CURSOS-SQL-SERVER-Y-ANALISIS-DE-DATOS/refs/heads/main/ventas_tecnologia.json');
    return await response.json();
}

function processData(data) {
    const clients = {};
    const sellers = {};
    const products = {};
    const localities = {};
    const salesByMonth = {};
    const salesByYear = {};
    const salesByCuatrimestre = {};
    const salesByVendedor = {};

    let totalCantidad = 0;

    let totalGeneral = 0;
    let totalCosto = 0;
    let totalMargen = 0;
    let totalClientes = 0;
    let totalVendedores = 0;
    let totalProductos = 0;

    data.forEach(sale => {
        // Clients
        clients[sale.cliente] = (clients[sale.cliente] || 0) + sale.total_general;

        // Sellers
        sellers[sale.vendedor] = (sellers[sale.vendedor] || 0) + sale.total_general;

        // Products
        sale.productos.forEach(producto => {
            if (!products[producto.producto]) {
                products[producto.producto] = { cantidad: 0, total: 0, costo: 0 };
            }
            products[producto.producto].cantidad += producto.cantidad;
            products[producto.producto].total += producto.sub_total;
            products[producto.producto].costo += producto.cantidad * producto.precio_compra;
        });

        // Localities
        localities[sale.localidad] = (localities[sale.localidad] || 0) + sale.total_general;

        // Temporal Analysis
        const date = new Date(sale.fecha);
        const month = date.toLocaleString('es-ES', { month: 'long' });
        const year = date.getFullYear();
        const cuatrimestre = Math.floor(date.getMonth() / 4) + 1;

        salesByMonth[month] = (salesByMonth[month] || 0) + sale.total_general;
        salesByYear[year] = (salesByYear[year] || 0) + sale.total_general;
        salesByCuatrimestre[cuatrimestre] = (salesByCuatrimestre[cuatrimestre] || 0) + sale.total_general;

        // Additional Calculations
        totalCantidad += sale.productos.reduce((sum, p) => sum + p.cantidad, 0);
    
        totalGeneral += sale.total_general;
        totalCosto += sale.productos.reduce((sum, p) => sum + (p.cantidad * p.precio_compra), 0);
        totalMargen += sale.total_general - sale.productos.reduce((sum, p) => sum + (p.cantidad * p.precio_compra), 0);
        totalClientes = Object.keys(clients).length;
        totalVendedores = Object.keys(sellers).length;
        totalProductos = Object.keys(products).length;

        // Sales by Vendedor
        salesByVendedor[sale.vendedor] = (salesByVendedor[sale.vendedor] || 0) + sale.total_general;
    });

    return {
        clients,
        sellers,
        products,
        localities,
        salesByMonth,
        salesByYear,
        salesByCuatrimestre,
        salesByVendedor,
        totalCantidad,

        totalGeneral,
        totalCosto,
        totalMargen,
        totalClientes,
        totalVendedores,
        totalProductos
    };
}

function renderTables(processedData) {
    // Clientes
    const sortedClients = Object.entries(processedData.clients)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    const clientesBody = document.querySelector('#topClientes tbody');
    clientesBody.innerHTML = sortedClients.map(([cliente, total]) => {
        const performance = total > 5000 ? 'high' : total > 2000 ? 'medium' : 'low';
        return `
            <tr class="performance-${performance}">
                <td>${cliente}</td>
                <td>$${total.toLocaleString()}</td>
                <td>${performance === 'high' ? '🌟' : performance === 'medium' ? '⚠️' : '❌'}</td>
            </tr>
        `;
    }).join('');

    // Vendedores
    const sortedSellers = Object.entries(processedData.sellers)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    const vendedoresBody = document.querySelector('#vendedoresPerformance tbody');
    vendedoresBody.innerHTML = sortedSellers.map(([vendedor, total]) => {
        const performance = total > 5000 ? 'high' : total > 2000 ? 'medium' : 'low';
        return `
            <tr class="performance-${performance}">
                <td>${vendedor}</td>
                <td>$${total.toLocaleString()}</td>
                <td>${performance === 'high' ? '🏆' : performance === 'medium' ? '🥈' : '🥉'}</td>
            </tr>
        `;
    }).join('');

    // Productos
    const sortedProducts = Object.entries(processedData.products)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 5);
    const productosBody = document.querySelector('#analisisProductos tbody');
    productosBody.innerHTML = sortedProducts.map(([producto, info]) => `
        <tr>
            <td>${producto}</td>
            <td>${info.cantidad}</td>
            <td>$${info.total.toLocaleString()}</td>
        </tr>
    `).join('');

    // Localidades
    const sortedLocalities = Object.entries(processedData.localities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    const localidadesBody = document.querySelector('#localidadesVentas tbody');
    localidadesBody.innerHTML = sortedLocalities.map(([localidad, total]) => {
        const performance = total > 5000 ? 'high' : total > 2000 ? 'medium' : 'low';
        return `
            <tr class="performance-${performance}">
                <td>${localidad}</td>
                <td>$${total.toLocaleString()}</td>
                <td>${performance === 'high' ? '🚀' : performance === 'medium' ? '🌈' : '🌧️'}</td>
            </tr>
        `;
    }).join('');

    // Ventas por Año
    const ventasAnualesBody = document.querySelector('#ventasAnualesTable tbody');
    ventasAnualesBody.innerHTML = Object.entries(processedData.salesByYear)
        .sort((a, b) => a[0] - b[0])
        .map(([year, total]) => `
            <tr>
                <td>${year}</td>
                <td>$${total.toLocaleString()}</td>
            </tr>
        `).join('');

    // Crecimiento de Ventas
    const crecimientoVentasBody = document.querySelector('#crecimientoVentasTable tbody');
    const years = Object.keys(processedData.salesByYear).sort((a, b) => a - b);
    const crecimientoData = years.map((year, index) => {
        const previousYear = years[index - 1];
        const currentTotal = processedData.salesByYear[year];
        const previousTotal = previousYear ? processedData.salesByYear[previousYear] : 0;
        const growthPercentage = previousTotal ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
        return `
            <tr>
                <td>${year}</td>
                <td>$${currentTotal.toLocaleString()}</td>
                <td>${growthPercentage.toFixed(2)}%</td>
            </tr>
        `;
    }).join('');
    crecimientoVentasBody.innerHTML = crecimientoData;

    // Ranking de Vendedores
    const rankingVendedoresBody = document.querySelector('#rankingVendedoresTable tbody');
    const sortedVendedores = Object.entries(processedData.salesByVendedor)
        .sort((a, b) => b[1] - a[1]);
    const totalVentas = Object.values(processedData.salesByVendedor).reduce((sum, total) => sum + total, 0);
    rankingVendedoresBody.innerHTML = sortedVendedores.map(([vendedor, total]) => {
        const percentage = (total / totalVentas) * 100;
        return `
            <tr>
                <td>${vendedor}</td>
                <td>$${total.toLocaleString()}</td>
                <td>${percentage.toFixed(2)}%</td>
            </tr>
        `;
    }).join('');

    // Card Group
    const cardGroup = document.querySelector('.card-group');
    cardGroup.innerHTML = `
        <div class="card-item">
            <i class="fas fa-boxes"></i>
            <p>${processedData.totalCantidad}</p>
        </div>
        
        <div class="card-item">
            <i class="fas fa-money-bill-wave"></i>
            <p>$${processedData.totalGeneral.toLocaleString()}</p>
        </div>
        <div class="card-item">
            <i class="fas fa-money-check-alt"></i>
            <p>$${processedData.totalCosto.toLocaleString()}</p>
        </div>
        <div class="card-item">
            <i class="fas fa-chart-line"></i>
            <p>$${processedData.totalMargen.toLocaleString()}</p>
        </div>
        <div class="card-item">
            <i class="fas fa-chart-bar"></i>
            <p>${((processedData.totalMargen / processedData.totalGeneral) * 100).toFixed(2)}%</p>
        </div>
        <div class="card-item">
            <i class="fas fa-users"></i>
            <p>${processedData.totalClientes}</p>
        </div>
        <div class="card-item">
            <i class="fas fa-user-tie"></i>
            <p>${processedData.totalVendedores}</p>
        </div>
        <div class="card-item">
            <i class="fas fa-shopping-cart"></i>
            <p>${processedData.totalProductos}</p>
        </div>
    `;
}

function renderCharts(processedData) {
    const chartOptions = {
        responsive: true,
        plugins: { legend: { display: true } }
    };

    // Clientes Chart
    new Chart(document.getElementById('clientesChart'), {
        type: 'pie',
        data: {
            labels: Object.keys(processedData.clients).slice(0, 5),
            datasets: [{
                data: Object.values(processedData.clients).slice(0, 5),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
            }]
        },
        options: chartOptions
    });

    // Vendedores Chart
    new Chart(document.getElementById('vendedoresChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(processedData.sellers).slice(0, 5),
            datasets: [{
                label: 'Ventas',
                data: Object.values(processedData.sellers).slice(0, 5),
                backgroundColor: '#36A2EB'
            }]
        },
        options: chartOptions
    });

    // Productos Chart
    new Chart(document.getElementById('productosChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(processedData.products).slice(0, 5),
            datasets: [{
                data: Object.values(processedData.products).slice(0, 5).map(p => p.total),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
            }]
        },
        options: chartOptions
    });

    // Localidades Chart
    new Chart(document.getElementById('localidadesChart'), {
        type: 'polarArea',
        data: {
            labels: Object.keys(processedData.localities).slice(0, 5),
            datasets: [{
                data: Object.values(processedData.localities).slice(0, 5),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
            }]
        },
        options: chartOptions
    });

    // Temporal Charts
    new Chart(document.getElementById('ventasMesChart'), {
        type: 'line',
        data: {
            labels: Object.keys(processedData.salesByMonth),
            datasets: [{
                label: 'Ventas Mensuales',
                data: Object.values(processedData.salesByMonth),
                borderColor: '#36A2EB',
                fill: false
            }]
        },
        options: chartOptions
    });

    new Chart(document.getElementById('ventasAnualesChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(processedData.salesByYear),
            datasets: [{
                label: 'Ventas Anuales',
                data: Object.values(processedData.salesByYear),
                backgroundColor: '#4BC0C0'
            }]
        },
        options: chartOptions
    });

    new Chart(document.getElementById('ventasCuatrimestralesChart'), {
        type: 'radar',
        data: {
            labels: ['1er Cuatrimestre', '2do Cuatrimestre', '3er Cuatrimestre'],
            datasets: [{
                label: 'Ventas por Cuatrimestre',
                data: Object.values(processedData.salesByCuatrimestre),
                backgroundColor: 'rgba(54, 162, 235, 0.2)'
            }]
        },
        options: chartOptions
    });

    // Ventas por Año Line Chart
    new Chart(document.getElementById('ventasAnualesLineChart'), {
        type: 'line',
        data: {
            labels: Object.keys(processedData.salesByYear),
            datasets: [{
                label: 'Ventas por Año',
                data: Object.values(processedData.salesByYear),
                borderColor: '#FF6384',
                fill: false
            }]
        },
        options: chartOptions
    });

    // Crecimiento de Ventas Chart
    new Chart(document.getElementById('crecimientoVentasChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(processedData.salesByYear),
            datasets: [{
                label: 'Crecimiento de Ventas',
                data: Object.values(processedData.salesByYear).map((total, index, array) => {
                    const previousTotal = index > 0 ? array[index - 1] : 0;
                    return previousTotal ? ((total - previousTotal) / previousTotal) * 100 : 0;
                }),
                backgroundColor: '#36A2EB'
            }]
        },
        options: chartOptions
    });

    // Ranking de Vendedores Chart
    new Chart(document.getElementById('rankingVendedoresChart'), {
        type: 'pie',
        data: {
            labels: Object.keys(processedData.salesByVendedor),
            datasets: [{
                data: Object.values(processedData.salesByVendedor),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
            }]
        },
        options: chartOptions
    });
}

// Cambiar entre modo claro y oscuro
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const themeToggle = document.querySelector('.theme-toggle');
    if (document.body.classList.contains('dark-mode')) {
        themeToggle.textContent = '☀️';
    } else {
        themeToggle.textContent = '🌙';
    }
}


function loadFilters(data) {
    const clienteFilter = document.getElementById('clienteFilter');
    const vendedorFilter = document.getElementById('vendedorFilter');
    const productoFilter = document.getElementById('productoFilter');
    const localidadFilter = document.getElementById('localidadFilter');

    const clients = [...new Set(data.map(sale => sale.cliente))];
    const sellers = [...new Set(data.map(sale => sale.vendedor))];
    const products = [...new Set(data.flatMap(sale => sale.productos.map(p => p.producto)))];
    const localities = [...new Set(data.map(sale => sale.localidad))];

    clients.sort().forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente;
        option.textContent = cliente;
        clienteFilter.appendChild(option);
    });

    sellers.sort().forEach(vendedor => {
        const option = document.createElement('option');
        option.value = vendedor;
        option.textContent = vendedor;
        vendedorFilter.appendChild(option);
    });

    products.sort().forEach(producto => {
        const option = document.createElement('option');
        option.value = producto;
        option.textContent = producto;
        productoFilter.appendChild(option);
    });

    localities.sort().forEach(localidad => {
        const option = document.createElement('option');
        option.value = localidad;
        option.textContent = localidad;
        localidadFilter.appendChild(option);
    });
}

function applyFilters() {
    const clienteFilter = document.getElementById('clienteFilter').value.toLowerCase();
    const vendedorFilter = document.getElementById('vendedorFilter').value.toLowerCase();
    const productoFilter = document.getElementById('productoFilter').value.toLowerCase();
    const localidadFilter = document.getElementById('localidadFilter').value.toLowerCase();
    const fechaInicialFilter = document.getElementById('fechaInicialFilter').value;
    const fechaFinalFilter = document.getElementById('fechaFinalFilter').value;

    fetchData().then(data => {
        const filteredData = data.filter(sale => {
            const clienteMatch = !clienteFilter || sale.cliente.toLowerCase().includes(clienteFilter);
            const vendedorMatch = !vendedorFilter || sale.vendedor.toLowerCase().includes(vendedorFilter);
            const productoMatch = !productoFilter || sale.productos.some(p => p.producto.toLowerCase().includes(productoFilter));
            const localidadMatch = !localidadFilter || sale.localidad.toLowerCase().includes(localidadFilter);
            const fechaMatch = (!fechaInicialFilter || new Date(sale.fecha) >= new Date(fechaInicialFilter)) &&
                               (!fechaFinalFilter || new Date(sale.fecha) <= new Date(fechaFinalFilter));

            return clienteMatch && vendedorMatch && productoMatch && localidadMatch && fechaMatch;
        });

        const processedData = processData(filteredData);
        renderTables(processedData);
        renderCharts(processedData);
    });
}

function clearFilters() {
    document.getElementById('clienteFilter').value = '';
    document.getElementById('vendedorFilter').value = '';
    document.getElementById('productoFilter').value = '';
    document.getElementById('localidadFilter').value = '';
    document.getElementById('fechaInicialFilter').value = '';
    document.getElementById('fechaFinalFilter').value = '';

    init();
}

async function init() {
    const data = await fetchData();
    loadFilters(data);
    const processedData = processData(data);
    renderTables(processedData);
    renderCharts(processedData);
}

init();

init();
