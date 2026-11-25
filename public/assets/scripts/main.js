(function () {
    "use strict";

    // Selectores abreviados
    var $ = function (s, r) { return (r || document).querySelector(s) };
    var $$ = function (s, r) { return Array.from((r || document).querySelectorAll(s)) };
    
    // Utilidad para escapar texto y prevenir XSS
    var esc = function (s) { 
        return String(s || "").replace(/[&<>"']/g, function (c) { 
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] 
        }) 
    };

    var COL = { c: "#e5384f", p: "#f5b400", a: "#0f9d58" };
    var ST = { c: "Crítico", p: "En atención", a: "Solucionado" };
    var ICON = { "Plásticos y PET": "🧴", "Orgánicos": "🍂", "Escombros": "🧱", "Foco infeccioso": "⚠️" };
    var CENTER = [-12.0977, -77.0365];

    // Almacenamiento local con respaldo en memoria
    var mem = {};
    var store = {
        get: function (k) { try { return localStorage.getItem(k) } catch (e) { return mem[k] || null } },
        set: function (k, v) { try { localStorage.setItem(k, v) } catch (e) { mem[k] = v } }
    };

    var users = function () { try { return JSON.parse(store.get("ga_users") || "{}") } catch (e) { return {} } };
    var session = function () { try { return JSON.parse(store.get("ga_session") || "null") } catch (e) { return null } };

    // Función de notificaciones Toast
    function toast(t) {
        var el = $("#toast");
        el.textContent = t;
        el.classList.add("show");
        clearTimeout(toast.t);
        toast.t = setTimeout(function () { el.classList.remove("show") }, 3400);
    }

    // Datos maestros iniciales de incidencias
    var data = [
        { 
            id: 1, code: "GA-2026-101", t: "Plásticos y PET", s: "p", sev: "Media", 
            lat: -12.0560, lng: -77.0840, addr: "Av. San Marcos, Gonzales", 
            eta: "Pendiente de asignación", when: "Justo ahora", conf: 90.7, 
            size: "Mediano (Varios sacos / 1-3 m³)", risks: ["🦨 Malos olores"], 
            supports: 5, recurrence: 2, author: "Valeria Soto",
            vuln: false, ratings: [5, 4], cleanedConfirmed: 0
        },
        { 
            id: 2, code: "GA-2026-102", t: "Foco infeccioso", s: "c", sev: "Alta", 
            lat: -12.0930, lng: -77.0300, addr: "Jr. Los Cedros, San Isidro", 
            eta: "Cuadrilla en camino (2 h)", when: "Hace 12 min", conf: 94.2, 
            size: "Grande (Desmonte mayor)", risks: ["🐀 Plagas o roedores", "⚠️ Riesgo sanitario", "🏫 Cerca de escuela"], 
            supports: 14, recurrence: 4, author: "Marco Rivas",
            vuln: true, ratings: [], cleanedConfirmed: 0
        },
        { 
            id: 3, code: "GA-2026-103", t: "Escombros", s: "p", sev: "Media", 
            lat: -12.0780, lng: -77.0450, addr: "Av. Salaverry, Jesús María", 
            eta: "Maquinaria asignada (1 día)", when: "Hace 1 h", conf: 88.5, 
            size: "Grande (Desmonte mayor)", risks: ["🛑 Obstáculo peatonal"], 
            supports: 8, recurrence: 1, author: "Vecino anónimo",
            vuln: false, ratings: [], cleanedConfirmed: 0
        },
        { 
            id: 4, code: "GA-2026-104", t: "Orgánicos", s: "a", sev: "Baja", 
            lat: -12.1200, lng: -77.0310, addr: "Parque Kennedy, Miraflores", 
            eta: "Completado y verificado", when: "Ayer", conf: 91.3, 
            size: "Pequeño (Bolsa puntual)", risks: ["🦨 Malos olores"], 
            supports: 9, recurrence: 3, author: "Camila Mendoza",
            vuln: true, ratings: [5, 5, 4], cleanedConfirmed: 6
        },
        { 
            id: 5, code: "GA-2026-105", t: "Plásticos y PET", s: "c", sev: "Alta", 
            lat: -12.1010, lng: -77.0120, addr: "Av. Javier Prado Este, San Borja", 
            eta: "Pendiente de asignación", when: "Hace 25 min", conf: 92.8, 
            size: "Mediano (Varios sacos)", risks: ["🏫 Cerca de mercado"], 
            supports: 11, recurrence: 2, author: "Jorge Peña",
            vuln: true, ratings: [], cleanedConfirmed: 0
        },
        { 
            id: 6, code: "GA-2026-106", t: "Orgánicos", s: "p", sev: "Media", 
            lat: -12.0870, lng: -77.0520, addr: "Av. Arequipa, Lince", 
            eta: "Ruta programada (4 h)", when: "Hace 3 h", conf: 86.9, 
            size: "Mediano (Varios sacos)", risks: ["🦨 Malos olores"], 
            supports: 6, recurrence: 1, author: "Vecino anónimo",
            vuln: false, ratings: [], cleanedConfirmed: 0
        },
        { 
            id: 7, code: "GA-2026-107", t: "Escombros", s: "a", sev: "Baja", 
            lat: -12.1400, lng: -77.0230, addr: "Av. Grau, Barranco", 
            eta: "Completado y verificado", when: "Hace 2 días", conf: 89.4, 
            size: "Grande (Desmonte mayor)", risks: [], 
            supports: 7, recurrence: 1, author: "Lucía Torres",
            vuln: false, ratings: [5, 4], cleanedConfirmed: 4
        },
        { 
            id: 8, code: "GA-2026-108", t: "Plásticos y PET", s: "a", sev: "Baja", 
            lat: -12.1050, lng: -77.0600, addr: "Malecón, Magdalena", 
            eta: "Completado y verificado", when: "Hace 3 días", conf: 93.1, 
            size: "Pequeño (Bolsa puntual)", risks: [], 
            supports: 12, recurrence: 2, author: "Andrés Díaz",
            vuln: false, ratings: [5, 5], cleanedConfirmed: 8
        },
        { 
            id: 9, code: "GA-2026-109", t: "Foco infeccioso", s: "p", sev: "Alta", 
            lat: -12.0690, lng: -77.0230, addr: "Av. Wilson, Cercado de Lima", 
            eta: "Inspección sanitaria (6 h)", when: "Hace 5 h", conf: 90.0, 
            size: "Mediano (Varios sacos)", risks: ["🐀 Plagas o roedores", "🏫 Cerca de escuela"], 
            supports: 19, recurrence: 5, author: "Carla Navarro",
            vuln: true, ratings: [], cleanedConfirmed: 0
        }
    ];

    var nextId = 200;

    function ago(ts) {
        var m = Math.round((Date.now() - ts) / 60000);
        return m < 1 ? "Justo ahora" : m < 60 ? "Hace " + m + " min" : m < 1440 ? "Hace " + Math.round(m / 60) + " h" : "Hace " + Math.round(m / 1440) + " días";
    }

    // Cargar reportes guardados en localStorage
    try {
        var savedReports = JSON.parse(store.get("ga_reports") || "[]");
        savedReports.forEach(function (r) {
            r.when = ago(r.ts);
            data.unshift(r);
            nextId = Math.max(nextId, r.id + 1);
        });
    } catch (e) {}

    // Distancia geográfica aproximada (Haversine en metros) para evitar duplicados (US08)
    function distanceMeters(lat1, lon1, lat2, lon2) {
        var R = 6371e3;
        var f1 = lat1 * Math.PI / 180, f2 = lat2 * Math.PI / 180;
        var df = (lat2 - lat1) * Math.PI / 180, dl = (lon2 - lon1) * Math.PI / 180;
        var a = Math.sin(df/2) * Math.sin(df/2) + Math.cos(f1) * Math.cos(f2) * Math.sin(dl/2) * Math.sin(dl/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    var TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", ATTR = "&copy; OpenStreetMap contributors";
    
    function mk(id, opts) {
        var m = L.map(id, opts);
        L.tileLayer(TILES, { maxZoom: 19, attribution: ATTR }).addTo(m);
        return m;
    }
    
    function pin(s, sel) {
        return L.divIcon({ className: "", html: '<div class="pin' + (sel ? " sel" : "") + '" style="background:' + COL[s] + '"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });
    }

    // Mapa Hero
    var hero = mk("heroMap", { center: CENTER, zoom: 13, zoomControl: false, scrollWheelZoom: false });
    data.slice(0, 7).forEach(function (d) {
        L.circle([d.lat, d.lng], { radius: d.s === "c" ? 650 : 420, stroke: false, fillColor: COL[d.s], fillOpacity: .16 }).addTo(hero);
        L.marker([d.lat, d.lng], { icon: pin(d.s) }).addTo(hero);
    });

    // Mapa Principal (Explorador)
    var big = mk("bigMap", { center: CENTER, zoom: 12, scrollWheelZoom: false });
    var layer = L.layerGroup().addTo(big), heatLayer = L.layerGroup().addTo(big);
    var filter = "all", selected = null, typeFilterVal = "all", vulnOnly = false, showHeat = false, currentView = "map";

    // Actualizar contadores de telemetría de estados (US26)
    function updateCounters() {
        var c = 0, p = 0, a = 0;
        data.forEach(function (d) {
            if (d.s === "c") c++;
            else if (d.s === "p") p++;
            else if (d.s === "a") a++;
        });
        if ($("#cntCritical")) $("#cntCritical").textContent = c;
        if ($("#cntProcess")) $("#cntProcess").textContent = p;
        if ($("#cntDone")) $("#cntDone").textContent = a;
    }

    // Obtener lista filtrada
    function getFilteredData() {
        var query = ($("#mapSearch") ? $("#mapSearch").value.trim().toLowerCase() : "");
        return data.filter(function (d) {
            var matchStatus = (filter === "all" || d.s === filter);
            var matchType = (typeFilterVal === "all" || d.t === typeFilterVal);
            var matchVuln = (!vulnOnly || d.vuln);
            var matchSearch = (!query || d.addr.toLowerCase().indexOf(query) !== -1 || d.t.toLowerCase().indexOf(query) !== -1 || (d.code && d.code.toLowerCase().indexOf(query) !== -1));
            return matchStatus && matchType && matchVuln && matchSearch;
        });
    }

    // Dibujar marcadores en el mapa y renderizar lista alternativa (US14, US21)
    function draw() {
        layer.clearLayers();
        heatLayer.clearLayers();
        var listEl = $("#listGrid");
        if (listEl) listEl.innerHTML = "";

        var currentFiltered = getFilteredData();

        currentFiltered.forEach(function (d) {
            // Mapa de calor / concentración (US19)
            if (showHeat) {
                L.circle([d.lat, d.lng], { 
                    radius: d.s === "c" ? 950 : 600, 
                    stroke: false, 
                    fillColor: d.s === "c" ? "#e5384f" : "#f5b400", 
                    fillOpacity: .28 
                }).addTo(heatLayer);
            } else {
                L.circle([d.lat, d.lng], { radius: d.s === "c" ? 650 : 420, stroke: false, fillColor: COL[d.s], fillOpacity: .14 }).addTo(layer);
            }

            // Marcadores con ícono y prioridad (US14, US15)
            var m = L.marker([d.lat, d.lng], { icon: pin(d.s, selected === d.id), title: d.t + " (" + d.code + ")" }).addTo(layer);
            m.on("click", function () { select(d.id) });

            // Tarjeta de la vista de lista (US21)
            if (listEl) {
                var card = document.createElement("div");
                card.className = "incident-card";
                card.innerHTML = 
                    '<div class="card-top">' +
                        '<span class="tag ' + d.s + '">' + ST[d.s] + '</span>' +
                        '<small style="color:var(--mut)">' + esc(d.when) + '</small>' +
                    '</div>' +
                    '<b style="font-size:1rem;color:var(--g9)">' + ICON[d.t] + ' ' + esc(d.t) + '</b>' +
                    '<small style="color:var(--mut)">📍 ' + esc(d.addr) + '</small>' +
                    '<div style="font-size:.82rem;display:flex;justify-content:space-between;margin-top:4px">' +
                        '<span>Prioridad: <b>' + esc(d.sev) + '</b></span>' +
                        '<span>👥 ' + (d.supports || 1) + ' respaldos</span>' +
                    '</div>' +
                    '<button class="btn btn-sm p" style="justify-content:center;margin-top:6px">Ver detalle completo</button>';
                card.onclick = function () {
                    setViewMode("map");
                    select(d.id);
                    document.getElementById("mapa").scrollIntoView({ behavior: "smooth" });
                };
                listEl.appendChild(card);
            }
        });

        if (listEl && !currentFiltered.length) {
            listEl.innerHTML = '<div style="grid-column:1/-1;padding:32px;text-align:center;color:var(--mut)">No se encontraron incidencias que coincidan con los filtros aplicados.</div>';
        }

        updateCounters();
    }

    // Inspección detallada de una incidencia en el panel lateral (US15, US16, US22, US23, US34, US35, US36, US39, US41, US44, US45, US46)
    function select(id) {
        selected = id;
        var d = data.find(function (x) { return x.id === id });
        if (!d) return;

        var phContent = d.photo 
            ? '<img src="' + d.photo + '" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" alt="Evidencia">' 
            : '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:48px">' + (ICON[d.t] || "📍") + '</div>';

        // Determinar pasos completados en el timeline de estado (US23)
        var sIdx = d.s === "a" ? 3 : d.s === "p" ? 2 : 1;
        var timelineHtml = 
            '<div class="timeline">' +
                '<div class="timeline-step ' + (sIdx >= 1 ? (sIdx === 1 ? "current" : "completed") : "") + '">' +
                    '<div class="timeline-dot">' + (sIdx > 1 ? "✓" : "1") + '</div>' +
                    '<span>Pendiente</span>' +
                '</div>' +
                '<div class="timeline-step ' + (sIdx >= 2 ? (sIdx === 2 ? "current" : "completed") : "") + '">' +
                    '<div class="timeline-dot">' + (sIdx > 2 ? "✓" : "2") + '</div>' +
                    '<span>En atención</span>' +
                '</div>' +
                '<div class="timeline-step ' + (sIdx >= 3 ? "current" : "") + '">' +
                    '<div class="timeline-dot">' + (sIdx >= 3 ? "✓" : "3") + '</div>' +
                    '<span>Solucionado</span>' +
                '</div>' +
            '</div>';

        // Riesgos identificados (US07, US16)
        var risksHtml = (d.risks && d.risks.length) 
            ? d.risks.map(function(r) { return '<span class="tag" style="background:#fff2f4;color:var(--red);border:1px solid #ffd1d8;font-size:.76rem">' + esc(r) + '</span>' }).join(" ") 
            : '<small style="color:var(--mut)">Sin riesgos biológicos críticos reportados</small>';

        // Calificación promedio por estrellas si está atendido (US44)
        var ratingAvg = (d.ratings && d.ratings.length) ? (d.ratings.reduce(function(a,b){return a+b}, 0) / d.ratings.length).toFixed(1) : "5.0";
        var ratingSectionHtml = (d.s === "a") 
            ? '<div style="background:var(--g0);padding:12px;border-radius:10px;margin-top:10px;border:1px solid var(--line)">' +
                '<div style="display:flex;justify-content:space-between;align-items:center">' +
                    '<b>Calificación de la limpieza:</b>' +
                    '<span style="color:#f5b400;font-weight:700">★ ' + ratingAvg + ' (' + (d.ratings ? d.ratings.length : 1) + ')</span>' +
                '</div>' +
                '<div class="star-rating" id="starBox">' +
                    '<span class="star" data-v="1">★</span><span class="star" data-v="2">★</span><span class="star" data-v="3">★</span><span class="star" data-v="4">★</span><span class="star" data-v="5">★</span>' +
                '</div>' +
                '<small style="color:var(--mut)">Toca las estrellas para calificar la labor de la cuadrilla.</small>' +
              '</div>' +
              '<div style="display:flex;gap:8px;margin-top:10px">' +
                '<button class="btn btn-sm" id="btnCleanOk" style="flex:1;justify-content:center;color:var(--ok)">✓ Sí, fue limpiado (' + (d.cleanedConfirmed || 0) + ')</button>' +
                '<button class="btn btn-sm" id="btnCleanFail" style="flex:1;justify-content:center;color:var(--red)">✕ Sigue sucio</button>' +
              '</div>'
            : '';

        // Panel exclusivo para rol Municipalidad (EP08: Gestión Municipal / US50)
        var curSession = session();
        var isMuni = curSession && curSession.role === "municipality";
        var muniPanelHtml = isMuni
            ? '<div class="muni-panel">' +
                '<div class="muni-panel-head">' +
                    '<span>🏛️ GESTIÓN Y DESPACHO MUNICIPAL</span>' +
                    '<span class="chip" style="font-size:.68rem;padding:2px 8px">' + esc(curSession.dist || "Municipalidad") + '</span>' +
                '</div>' +
                '<small style="color:var(--mut);font-weight:600">1. Cambiar estado de la incidencia en vivo:</small>' +
                '<div class="muni-status-btns">' +
                    '<button type="button" class="muni-st-btn ' + (d.s === "c" ? "active-c" : "") + '" data-st="c">🔴 Crítico</button>' +
                    '<button type="button" class="muni-st-btn ' + (d.s === "p" ? "active-p" : "") + '" data-st="p">🟡 En atención</button>' +
                    '<button type="button" class="muni-st-btn ' + (d.s === "a" ? "active-a" : "") + '" data-st="a">🟢 Solucionado</button>' +
                '</div>' +
                '<small style="color:var(--mut);font-weight:600;margin-top:4px">2. Asignar cuadrilla o unidad operativa:</small>' +
                '<div style="display:flex;gap:6px">' +
                    '<select id="muniUnitSel" style="margin:0;padding:7px 10px;font-size:.8rem;flex:1">' +
                        '<option value="Camión Compactador #04 (2 h)">🚛 Camión Compactador #04</option>' +
                        '<option value="Cuadrilla Bio-Riesgo Sanitario (1 h)">☣️ Cuadrilla Bio-Riesgo</option>' +
                        '<option value="Maquinaria Pesada / Volquete (4 h)">🚜 Volquete de Desmonte</option>' +
                        '<option value="Fiscalización Ambiental en ruta">👮 Fiscalización Ambiental</option>' +
                    '</select>' +
                    '<button type="button" class="btn btn-sm p" id="muniAssignBtn">Despachar</button>' +
                '</div>' +
                '<button type="button" class="btn btn-sm" id="muniOrderBtn" style="justify-content:center;background:#fff">📄 Descargar Orden de Trabajo (Ficha Técnica)</button>' +
              '</div>'
            : '';

        $("#panel").innerHTML = 
            '<div style="display:flex;justify-content:space-between;align-items:center">' +
                '<span class="tag ' + d.s + '">' + ST[d.s] + '</span>' +
                '<small style="color:var(--mut);font-weight:600">' + esc(d.code || ("GA-" + d.id)) + ' · ' + esc(d.when) + '</small>' +
            '</div>' +
            '<h3 style="margin:10px 0 2px">' + esc(d.t) + ' en ' + esc(d.addr.split(",")[0]) + '</h3>' +
            '<small style="color:var(--mut)">📍 ' + esc(d.addr) + '</small>' +
            timelineHtml +
            '<div class="ph" style="overflow:hidden;height:160px;margin:8px 0">' + phContent + '</div>' +
            '<div class="row"><span>Reportado por: </span><b>' + esc(d.author || "Vecino anónimo") + '</b></div>' +
            '<div class="row"><span>Severidad / Prioridad: </span><b style="color:' + COL[d.s] + '">● ' + esc(d.sev) + ' (IA ' + d.conf + '%)</b></div>' +
            '<div class="row"><span>Tamaño acumulado: </span><b>' + esc(d.size || "Mediano") + '</b></div>' +
            '<div class="row"><span>Estado / Cuadrilla: </span><b>' + esc(d.eta || "Pendiente") + '</b></div>' +
            '<div class="row"><span>Recurrencia (30 días): </span><b>Reportado ' + (d.recurrence || 1) + ' veces</b></div>' +
            '<div class="row"><span>Respaldos comunitarios: </span><b style="color:var(--g7)">+' + (d.supports || 1) + ' vecinos apoyan</b></div>' +
            '<div style="margin:8px 0"><small style="display:block;margin-bottom:4px;color:var(--mut);font-weight:600">Riesgos alertados:</small>' + risksHtml + '</div>' +
            muniPanelHtml +
            ratingSectionHtml +
            '<div style="display:flex; flex-direction:column; gap:8px; margin-top: 12px;">' +
                '<button class="btn p" id="confirmBtn" style="justify-content:center">🤝 Apoyar reporte (+1 vecino)</button>' +
                '<a class="btn" id="navExternalBtn" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=' + d.lat + ',' + d.lng + '" style="justify-content:center;text-decoration:none">🗺️ Navegar con Google Maps / Waze</a>' +
                '<div style="display:flex;gap:8px">' +
                    '<button class="btn" id="shareBtn" style="flex:1;justify-content:center">🔗 Compartir</button>' +
                    '<button class="btn" id="denounceBtn" style="flex:1;justify-content:center;color:var(--red)">🚩 Denunciar</button>' +
                '</div>' +
            '</div>';

        // Eventos exclusivos del Panel Municipal
        if (isMuni) {
            $$(".muni-st-btn", $("#panel")).forEach(function (btn) {
                btn.onclick = function () {
                    var newSt = this.dataset.st;
                    d.s = newSt;
                    if (newSt === "a") d.eta = "Completado y verificado por " + (curSession.dist || "Municipalidad");
                    else if (newSt === "p" && d.eta.indexOf("Completado") !== -1) d.eta = "Cuadrilla municipal en atención";
                    else if (newSt === "c") { d.sev = "Alta"; d.eta = "Prioridad crítica — Requiere despacho inmediato"; }
                    store.set("ga_reports", JSON.stringify(data.filter(function (x) { return x.owner })));
                    toast("Estado municipal actualizado a: " + ST[newSt]);
                    select(d.id);
                };
            });

            if ($("#muniAssignBtn")) {
                $("#muniAssignBtn").onclick = function () {
                    var unit = $("#muniUnitSel").value;
                    d.eta = unit;
                    if (d.s === "c") d.s = "p";
                    store.set("ga_reports", JSON.stringify(data.filter(function (x) { return x.owner })));
                    toast("Unidad despachada: " + unit);
                    select(d.id);
                };
            }

            if ($("#muniOrderBtn")) {
                $("#muniOrderBtn").onclick = function () {
                    var content = 
                        "====================================================\n" +
                        "   ORDEN DE TRABAJO MUNICIPAL - GREENALERT (IHC)    \n" +
                        "====================================================\n" +
                        "Entidad: " + (curSession.dist || "Municipalidad Distrital") + "\n" +
                        "Código de Incidencia: " + (d.code || ("GA-" + d.id)) + "\n" +
                        "Fecha de Emisión: " + new Date().toLocaleString() + "\n" +
                        "----------------------------------------------------\n" +
                        "Tipo de Residuo (IA): " + d.t + " (Confianza: " + d.conf + "%)\n" +
                        "Nivel de Prioridad: " + d.sev + " (" + ST[d.s] + ")\n" +
                        "Volumen Estimado: " + (d.size || "Mediano") + "\n" +
                        "Dirección / Referencia: " + d.addr + "\n" +
                        "Coordenadas GPS: " + d.lat + ", " + d.lng + "\n" +
                        "Riesgos Sanitarios: " + ((d.risks && d.risks.length) ? d.risks.join(", ") : "Ninguno") + "\n" +
                        "Respaldos Vecinales: +" + (d.supports || 1) + " ciudadanos\n" +
                        "Unidad Asignada: " + (d.eta || "Pendiente de asignación") + "\n" +
                        "====================================================\n";
                    var blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                    var a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = "Orden_Trabajo_" + (d.code || d.id) + ".txt";
                    a.click();
                    toast("Orden de trabajo descargada (" + (d.code || d.id) + ")");
                };
            }
        }

        // Acción: Apoyar reporte (US39)
        $("#confirmBtn").onclick = function () {
            if (!session()) { openAuth("login", "Inicia sesión para apoyar reportes comunitarios."); return }
            if (d._supported) { toast("Ya has apoyado este reporte anteriormente."); return }
            d.supports = (d.supports || 1) + 1;
            d._supported = true;
            this.textContent = "✓ Reporte apoyado (+" + d.supports + ")";
            this.disabled = true;
            toast("¡Gracias! Sumaste tu respaldo a esta alerta ambiental (+1)");
            draw();
        };

        // Acción: Compartir incidencia (US46)
        $("#shareBtn").onclick = function () {
            var txt = "Alerta ambiental: " + d.t + " en " + d.addr + " (Código " + d.code + ") vía GreenAlert";
            var url = "https://www.openstreetmap.org/?mlat=" + d.lat + "&mlon=" + d.lng + "#map=17/" + d.lat + "/" + d.lng;
            if (navigator.share) { 
                navigator.share({ title: "GreenAlert", text: txt, url: url }).catch(function () {}) 
            } else if (navigator.clipboard) { 
                navigator.clipboard.writeText(txt + " " + url).then(function () { toast("Enlace copiado al portapapeles") }) 
            } else {
                toast("Enlace: " + url);
            }
        };

        // Acción: Denunciar reporte (US45)
        $("#denounceBtn").onclick = function () {
            openModal("#denounceOv");
            $("#denounceSendBtn").onclick = function () {
                var reason = $("#denounceReason").value;
                closeAll();
                toast("Denuncia registrada: " + reason + ". El caso pasará a moderación.");
            };
        };

        // Calificación de limpieza (US44)
        if ($("#starBox")) {
            $$("#starBox .star").forEach(function (star) {
                star.onclick = function () {
                    var val = +this.dataset.v;
                    if (!d.ratings) d.ratings = [];
                    d.ratings.push(val);
                    $$("#starBox .star").forEach(function (s, idx) {
                        s.classList.toggle("active", idx < val);
                    });
                    toast("¡Gracias por calificar la limpieza con " + val + " estrellas!");
                };
            });
        }

        // Verificación rápida de limpieza (US41)
        if ($("#btnCleanOk")) {
            $("#btnCleanOk").onclick = function () {
                d.cleanedConfirmed = (d.cleanedConfirmed || 0) + 1;
                this.textContent = "✓ Confirmado (" + d.cleanedConfirmed + ")";
                this.disabled = true;
                toast("¡Gracias por confirmar que la calle quedó limpia!");
            };
        }
        if ($("#btnCleanFail")) {
            $("#btnCleanFail").onclick = function () {
                toast("Observación enviada: La cuadrilla será notificada para reabrir la inspección.");
            };
        }

        big.flyTo([d.lat, d.lng], Math.max(big.getZoom(), 14), { duration: .6 });
        draw();
    }

    // Filtros de estado por pestañas (US17)
    $("#tabs").addEventListener("click", function (e) {
        var b = e.target.closest("button");
        if (!b) return;
        $$("#tabs button").forEach(function (x) { x.classList.toggle("on", x === b) });
        filter = b.dataset.f;
        draw();
    });

    // Filtro por tipo de residuo (US17)
    if ($("#typeFilter")) {
        $("#typeFilter").addEventListener("change", function () {
            typeFilterVal = this.value;
            draw();
        });
    }

    // Filtro zonas vulnerables (US20)
    if ($("#vulnFilter")) {
        $("#vulnFilter").onclick = function () {
            vulnOnly = !vulnOnly;
            this.classList.toggle("active", vulnOnly);
            draw();
            toast(vulnOnly ? "Mostrando incidencias en zonas vulnerables (colegios/mercados)" : "Filtro de zonas vulnerables desactivado");
        };
    }

    // Toggle de concentración / Mapa de calor (US19)
    if ($("#heatToggle")) {
        $("#heatToggle").onclick = function () {
            showHeat = !showHeat;
            this.classList.toggle("active", showHeat);
            draw();
            toast(showHeat ? "Visualización de concentración y calor activada" : "Visualización estándar restaurada");
        };
    }

    // Búsqueda por dirección o distrito (US18)
    if ($("#mapSearch")) {
        $("#mapSearch").addEventListener("input", function () {
            draw();
        });
    }

    // Conmutador de vista Mapa vs Lista (US21)
    function setViewMode(mode) {
        currentView = mode;
        var mapG = $("#mapGrid"), listG = $("#listGrid"), btnM = $("#viewMapBtn"), btnL = $("#viewListBtn");
        if (mode === "map") {
            mapG.style.display = "grid";
            listG.style.display = "none";
            btnM.classList.add("active");
            btnL.classList.remove("active");
            big.invalidateSize();
        } else {
            mapG.style.display = "none";
            listG.style.display = "grid";
            btnL.classList.add("active");
            btnM.classList.remove("active");
        }
    }
    if ($("#viewMapBtn")) $("#viewMapBtn").onclick = function () { setViewMode("map") };
    if ($("#viewListBtn")) $("#viewListBtn").onclick = function () { setViewMode("list") };

    // Observador para animación de estadísticas en landing
    var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
            if (!e.isIntersecting) return;
            io.unobserve(e.target);
            var el = e.target, n = +el.dataset.n, p = el.dataset.p || "", s = el.dataset.s || "", t0 = performance.now();
            (function step(t) {
                var k = Math.min((t - t0) / 1200, 1), v = Math.round(n * (1 - Math.pow(1 - k, 3)));
                el.textContent = p + (n > 999 ? v.toLocaleString("en-US") : v) + s;
                if (k < 1) requestAnimationFrame(step)
            })(t0);
        })
    }, { threshold: .4 });
    $$(".num[data-n]").forEach(function (el) { io.observe(el) });

    // Navegación responsive
    $("#burger").onclick = function () { $("#menu").classList.toggle("open") };
    $$("#menu a").forEach(function (a) { a.onclick = function () { $("#menu").classList.remove("open") } });

    // Modales
    function openModal(id) { $(id).classList.add("show") }
    function closeAll() { $$(".ov").forEach(function (o) { o.classList.remove("show") }) }

    $$("[data-close]").forEach(function (b) { b.onclick = closeAll });
    $$(".ov").forEach(function (o) { o.addEventListener("mousedown", function (e) { if (e.target === o) closeAll() }) });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAll() });

    // Autenticación, Roles (Ciudadano vs Municipalidad) y Modo Invitado (US28, US29, US30, EP08)
    var mode = "login", selectedRole = "citizen";

    function updateRoleUI() {
        var isMuniRole = (selectedRole === "municipality");
        var reg = (mode === "register");
        if ($("#muniWrap")) $("#muniWrap").hidden = !(reg && isMuniRole);
        if ($("#aNameLabel")) $("#aNameLabel").textContent = isMuniRole ? "Nombre del funcionario o gerencia" : "Nombre completo";
        if ($("#aName")) $("#aName").placeholder = isMuniRole ? "Ej. Ing. Marco Rivas (Gestión Ambiental)" : "Tu nombre";
        if ($("#aMailLabel")) $("#aMailLabel").textContent = isMuniRole ? "Correo institucional municipal" : "Correo electrónico";
        if ($("#aMail")) $("#aMail").placeholder = isMuniRole ? "ambiental@munidistrito.gob.pe" : "ejemplo@correo.com";
    }

    if ($("#roleSwitch")) {
        $$("#roleSwitch .role-btn").forEach(function (btn) {
            btn.onclick = function () {
                selectedRole = this.dataset.role;
                $$("#roleSwitch .role-btn").forEach(function (b) { b.classList.toggle("active", b === btn) });
                updateRoleUI();
            };
        });
    }

    function setMode(m) {
        mode = m;
        var reg = m === "register";
        $("#nameWrap").hidden = !reg;
        $("#authTitle").textContent = reg ? "Crear cuenta" : "Iniciar sesión";
        $("#authGo").textContent = reg ? "Crear cuenta" : "Entrar";
        $("#swTxt").textContent = reg ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?";
        $("#swBtn").textContent = reg ? "Inicia sesión" : "Regístrate";
        $("#authErr").textContent = "";
        updateRoleUI();
    }

    function openAuth(m, msg) {
        setMode(m || "login");
        if (msg) $("#authSub").textContent = msg;
        openModal("#authOv");
        setTimeout(function () { $(m === "register" ? "#aName" : "#aMail").focus() }, 50);
    }

    function refreshAuth() {
        var s = session();
        if (!s) {
            $("#authBtn").textContent = "Iniciar sesión";
            if ($("#miMuniPanel")) $("#miMuniPanel").hidden = true;
            menu(false);
        } else {
            var prefix = s.role === "municipality" ? "🏛️ " : "👤 ";
            $("#authBtn").textContent = prefix + s.name.split(" ")[0] + " ▾";
            if ($("#miMuniPanel")) $("#miMuniPanel").hidden = (s.role !== "municipality");
        }
        if (selected) select(selected);
    }

    $("#swBtn").onclick = function () { setMode(mode === "login" ? "register" : "login") };
    var um = $("#uMenu");

    function menu(show) {
        um.hidden = !show;
        $("#authBtn").setAttribute("aria-expanded", String(show));
    }

    $("#authBtn").onclick = function (e) {
        e.stopPropagation();
        if (session()) menu(um.hidden);
        else openAuth("login", "Elige tu tipo de perfil para acceder a las herramientas correspondientes.");
    };

    // Botón Continuar como invitado (US29)
    if ($("#guestBtn")) {
        $("#guestBtn").onclick = function () {
            store.set("ga_session", JSON.stringify({ mail: "invitado@greenalert.pe", name: "Invitado", role: "citizen" }));
            refreshAuth();
            closeAll();
            toast("Ingresaste como vecino invitado. Puedes explorar y reportar.");
            if (openAuth.after) { var f = openAuth.after; openAuth.after = null; f() }
        };
    }

    // Botón Demo Municipalidad para evaluación inmediata (EP08)
    if ($("#muniDemoBtn")) {
        $("#muniDemoBtn").onclick = function () {
            store.set("ga_session", JSON.stringify({
                mail: "ambiental@munisanisidro.gob.pe",
                name: "Muni. San Isidro",
                role: "municipality",
                dist: "Municipalidad de San Isidro"
            }));
            refreshAuth();
            closeAll();
            toast("🏛️ Modo Gestión Municipal activo: Ahora puedes despachar cuadrillas y cambiar estados en el mapa.");
            document.getElementById("mapa").scrollIntoView({ behavior: "smooth" });
            select(selected || 2);
        };
    }

    document.addEventListener("click", function () { menu(false) });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") menu(false) });

    if ($("#miMuniPanel")) {
        $("#miMuniPanel").onclick = function () {
            menu(false);
            filter = "c";
            $$("#tabs button").forEach(function (x) { x.classList.toggle("on", x.dataset.f === "c") });
            setViewMode("map");
            draw();
            document.getElementById("mapa").scrollIntoView({ behavior: "smooth" });
            toast("🏛️ Filtrando puntos críticos prioritarios para despacho de cuadrilla");
        };
    }

    $("#miReport").onclick = function () { menu(false); openReport() };
    $("#miMine").onclick = function () { menu(false); openMine() };
    $("#miOut").onclick = function () { menu(false); store.set("ga_session", "null"); refreshAuth(); toast("Sesión cerrada") };
    $("#ctaMine").onclick = openMine;

    // Historial "Mis Reportes" con pestañas Activos vs Solucionados y Cancelación (US13, US24)
    var currentMineTab = "active";
    function openMine() {
        var s = session();
        if (!s) { openAuth.after = openMine; openAuth("login", "Inicia sesión para ver tus reportes."); return }
        renderMineList();
        openModal("#mineOv");
    }

    function renderMineList() {
        var s = session();
        if (!s) return;
        var myReports = data.filter(function (d) { return d.owner === s.mail });
        var filteredMine = myReports.filter(function (d) {
            return currentMineTab === "active" ? (d.s === "p" || d.s === "c") : (d.s === "a");
        });

        var box = $("#mineList");
        if (!filteredMine.length) {
            box.innerHTML = '<p class="sub" style="font-size:.9rem;margin:16px 0">No tienes reportes ' + (currentMineTab === "active" ? "activos" : "solucionados") + '.</p>' +
                            '<button class="btn p" id="mineNew">Generar nuevo reporte</button>';
            $("#mineNew").onclick = function () { closeAll(); openReport() };
        } else {
            box.innerHTML = filteredMine.map(function (d) {
                var cancelBtn = (d.s === "p" && d.owner === s.mail) 
                    ? '<button class="btn btn-sm btnCancelReport" data-id="' + d.id + '" style="color:var(--red);margin-top:6px">Cancelar reporte</button>' 
                    : '';
                return '<div class="mi" data-id="' + d.id + '" style="cursor:default">' +
                            '<div style="display:flex;justify-content:space-between;align-items:center">' +
                                '<span class="tag ' + d.s + '">' + ST[d.s] + '</span>' +
                                '<small>' + esc(d.code || ("GA-" + d.id)) + '</small>' +
                            '</div>' +
                            '<b>' + ICON[d.t] + ' ' + esc(d.t) + '</b>' +
                            '<small>📍 ' + esc(d.addr) + '</small>' +
                            '<small>' + esc(ago(d.ts || Date.now())) + ' · +' + (d.supports || 1) + ' apoyos</small>' +
                            '<div style="display:flex;gap:8px;margin-top:6px">' +
                                '<button class="btn btn-sm p btnLocateMine" data-id="' + d.id + '">Ver en el mapa</button>' +
                                cancelBtn +
                            '</div>' +
                       '</div>';
            }).join("");

            // Ubicar en el mapa
            $$(".btnLocateMine", box).forEach(function (btn) {
                btn.onclick = function () {
                    closeAll();
                    filter = "all";
                    setViewMode("map");
                    select(+this.dataset.id);
                    document.getElementById("mapa").scrollIntoView({ behavior: "smooth" });
                };
            });

            // Cancelar reporte pendiente (US13)
            $$(".btnCancelReport", box).forEach(function (btn) {
                btn.onclick = function () {
                    var repId = +this.dataset.id;
                    if (confirm("¿Estás seguro de cancelar este reporte pendiente? Dejará de figurar en el mapa.")) {
                        var idx = data.findIndex(function (x) { return x.id === repId });
                        if (idx !== -1) {
                            data.splice(idx, 1);
                            store.set("ga_reports", JSON.stringify(data.filter(function (x) { return x.owner })));
                            toast("Reporte cancelado correctamente.");
                            renderMineList();
                            draw();
                        }
                    }
                };
            });
        }
    }

    if ($("#mineTabs")) {
        $$("#mineTabs button").forEach(function (b) {
            b.onclick = function () {
                $$("#mineTabs button").forEach(function (x) { x.classList.toggle("on", x === b) });
                currentMineTab = b.dataset.tab;
                renderMineList();
            };
        });
    }

    $("#authGo").onclick = function () {
        var mail = $("#aMail").value.trim().toLowerCase(), pass = $("#aPass").value, name = $("#aName").value.trim(), err = $("#authErr"), u = users();
        var muniDist = $("#aMuniDist") ? $("#aMuniDist").value : "Municipalidad Distrital";
        var muniCode = $("#aMuniCode") ? $("#aMuniCode").value.trim() : "";

        if (!/^\S+@\S+\.\S+$/.test(mail)) { err.textContent = "Escribe un correo electrónico válido."; return }
        if (pass.length < 6) { err.textContent = "La contraseña debe tener al menos 6 caracteres."; return }
        if (mode === "register") {
            if (!name) { err.textContent = selectedRole === "municipality" ? "Escribe el nombre del funcionario o área." : "Escribe tu nombre."; return }
            if (selectedRole === "municipality" && muniCode.length < 6) { err.textContent = "Ingresa un código institucional o RUC válido (mín. 6 dígitos)."; return }
            if (u[mail]) { err.textContent = "Ese correo ya está registrado. Inicia sesión."; return }
            u[mail] = {
                name: name,
                pass: btoa(unescape(encodeURIComponent(pass))),
                role: selectedRole,
                dist: selectedRole === "municipality" ? muniDist : ""
            };
            store.set("ga_users", JSON.stringify(u));
        } else {
            if (!u[mail] || u[mail].pass !== btoa(unescape(encodeURIComponent(pass)))) { err.textContent = "Correo o contraseña incorrectos."; return }
        }
        var activeRole = u[mail].role || selectedRole || "citizen";
        var activeDist = u[mail].dist || (activeRole === "municipality" ? muniDist : "");
        store.set("ga_session", JSON.stringify({
            mail: mail,
            name: u[mail].name,
            role: activeRole,
            dist: activeDist
        }));
        refreshAuth();
        closeAll();
        toast(activeRole === "municipality" ? "🏛️ Sesión municipal iniciada (" + activeDist + ")" : "Hola, " + u[mail].name.split(" ")[0] + " 👋");
        if (openAuth.after) { var f = openAuth.after; openAuth.after = null; f() }
    };
    refreshAuth();

    // Gestión de formulario y modal de reporte (US01 a US12, US31)
    var pick = null, pickMarker = null, pt = null, reportPhotoUrl = null;

    function openReport() {
        if (!session()) { openAuth.after = openReport; openAuth("login", "Inicia sesión o continúa como invitado para reportar."); return }
        openModal("#repOv");
        $("#repErr").textContent = "";
        if ($("#dupBox")) $("#dupBox").style.display = "none";
        if ($("#iaBox")) $("#iaBox").style.display = "none";
        if (!pick) {
            pick = mk("pickMap", { center: CENTER, zoom: 14 });
            pick.on("click", function (e) { setPt(e.latlng.lat, e.latlng.lng) });
        }
        setTimeout(function () { pick.invalidateSize() }, 120);
    }

    function setPt(lat, lng) {
        pt = { lat: lat, lng: lng };
        if (pickMarker) pickMarker.setLatLng([lat, lng]);
        else pickMarker = L.marker([lat, lng]).addTo(pick);
        $("#rHint").textContent = "Punto marcado: " + lat.toFixed(5) + ", " + lng.toFixed(5);

        // Detección de duplicados cercanos a < 100 metros (US08)
        var nearby = data.find(function (d) {
            return distanceMeters(lat, lng, d.lat, d.lng) < 100 && d.s !== "a";
        });

        var dupBox = $("#dupBox");
        if (nearby && dupBox) {
            dupBox.style.display = "flex";
            $("#dupSupportBtn").onclick = function () {
                closeAll();
                setViewMode("map");
                select(nearby.id);
                document.getElementById("mapa").scrollIntoView({ behavior: "smooth" });
                toast("Te mostramos el reporte existente para que puedas sumarte.");
            };
            $("#dupContinueBtn").onclick = function () {
                dupBox.style.display = "none";
            };
        } else if (dupBox) {
            dupBox.style.display = "none";
        }
    }

    $$("[data-report]").forEach(function (b) { b.onclick = openReport });

    // Geolocalización del navegador (US03)
    $("#locBtn").onclick = function () {
        if (!navigator.geolocation) { $("#repErr").textContent = "Tu navegador no permite geolocalización. Toca el mapa."; return }
        this.textContent = "Buscando…";
        var b = this;
        navigator.geolocation.getCurrentPosition(
            function (p) {
                b.textContent = "📍 Usar mi ubicación actual";
                pick.setView([p.coords.latitude, p.coords.longitude], 17);
                setPt(p.coords.latitude, p.coords.longitude);
            },
            function () {
                b.textContent = "📍 Usar mi ubicación actual";
                $("#repErr").textContent = "No pudimos obtener tu ubicación. Toca el mapa para marcarla manualmente.";
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    // Función para calcular y actualizar dinámicamente la severidad de la IA
    function evaluateIaSeverity() {
        var t = $("#rType").value;
        var size = $("#rSize").value;
        var rPlagas = $("#riskPlagas").checked;
        var rOlores = $("#riskOlores").checked;
        var rColegio = $("#riskColegio").checked;
        var rSanitario = $("#riskSanitario").checked;

        var riskCount = (rPlagas ? 1 : 0) + (rOlores ? 1 : 0) + (rColegio ? 1 : 0) + (rSanitario ? 1 : 0);
        var isLarge = size.indexOf("Grande") !== -1;
        var isMedium = size.indexOf("Mediano") !== -1;

        // Criterio de Alta Severidad (foco infeccioso, acumulación masiva o presencia de vectores/riesgo sanitario)
        var isHigh = (t === "Foco infeccioso" || isLarge || rSanitario || rPlagas || riskCount >= 2);
        var sevText = isHigh ? "Alta (Crítica)" : (isMedium || riskCount >= 1 ? "Media" : "Baja");
        var sevColor = isHigh ? "var(--red)" : (sevText === "Media" ? "var(--yel)" : "var(--ok)");

        if ($("#iaType")) $("#iaType").textContent = t;
        if ($("#iaSev")) $("#iaSev").innerHTML = '<span style="color:' + sevColor + ';font-weight:800">' + sevText + '</span>';
        return { isHigh: isHigh, sev: isHigh ? "Alta" : (isMedium || riskCount >= 1 ? "Media" : "Baja") };
    }

    // Escuchar cambios manuales en el formulario para recalcular la severidad de la IA
    $("#rType").addEventListener("change", evaluateIaSeverity);
    $("#rSize").addEventListener("change", evaluateIaSeverity);
    $("#riskPlagas").addEventListener("change", evaluateIaSeverity);
    $("#riskOlores").addEventListener("change", evaluateIaSeverity);
    $("#riskColegio").addEventListener("change", evaluateIaSeverity);
    $("#riskSanitario").addEventListener("change", evaluateIaSeverity);

    // Previsualización de fotografía y clasificación inteligente por IA (US02, US05)
    $("#rPhoto").addEventListener("change", function () {
        var input = this;
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                reportPhotoUrl = e.target.result;
                var thumb = $("#photoThumb");
                thumb.style.backgroundImage = "url('" + reportPhotoUrl + "')";
                thumb.style.display = "block";
                $("#photoCount").textContent = "1 de 3 fotos adjuntadas";

                // Simulación visual de escaneo con visión artificial (Heurística #1)
                var scan = $("#scanLine");
                if (scan) scan.style.display = "block";
                toast("Escaneando imagen con visión computacional...");

                setTimeout(function () {
                    if (scan) scan.style.display = "none";
                    // Detección de acumulación masiva / desborde en vía pública (IA Vision)
                    // Clasifica como Foco infeccioso / Acumulación crítica de alta severidad
                    $("#rType").value = "Foco infeccioso";
                    $("#rSize").value = "Grande (Desmonte mayor / camión requerido)";
                    $("#riskPlagas").checked = true;
                    $("#riskOlores").checked = true;
                    $("#riskSanitario").checked = true;

                    var iaBox = $("#iaBox");
                    var confVal = (94 + Math.random() * 4).toFixed(1);
                    $("#iaConf").textContent = confVal + "% confianza";
                    
                    evaluateIaSeverity();
                    iaBox.style.display = "block";
                    toast("IA: Diagnóstico completado — Foco de alta severidad");
                }, 600);
            };
            reader.readAsDataURL(input.files[0]);
        }
    });

    if ($("#photoDelBtn")) {
        $("#photoDelBtn").onclick = function () {
            reportPhotoUrl = null;
            $("#rPhoto").value = "";
            $("#photoThumb").style.display = "none";
            $("#photoCount").textContent = "0 de 3 fotos adjuntadas";
            if ($("#iaBox")) $("#iaBox").style.display = "none";
        };
    }

    // Paso de revisión previa (US11)
    $("#repReviewBtn").onclick = function () {
        if (!pt) { $("#repErr").textContent = "Marca la ubicación en el mapa antes de continuar."; return }

        var t = $("#rType").value;
        var size = $("#rSize").value;
        var desc = $("#rDesc").value.trim() || "Sin descripción adicional";
        var isAnon = $("#rAnon").checked;
        
        // Recopilar riesgos marcados (US07)
        var selectedRisks = [];
        if ($("#riskPlagas").checked) selectedRisks.push("🐀 Plagas/Vectores");
        if ($("#riskOlores").checked) selectedRisks.push("🦨 Malos olores");
        if ($("#riskColegio").checked) selectedRisks.push("🏫 Cerca de escuela");
        if ($("#riskSanitario").checked) selectedRisks.push("⚠️ Riesgo sanitario");

        var evalRes = evaluateIaSeverity();

        var reviewBox = $("#reviewDetails");
        reviewBox.innerHTML = 
            '<div><b>Categoría:</b> ' + esc(t) + '</div>' +
            '<div><b>Tamaño estimado:</b> ' + esc(size) + '</div>' +
            '<div><b>Severidad / Prioridad calculada:</b> <b style="color:' + (evalRes.isHigh ? 'var(--red)' : 'var(--ink)') + '">' + evalRes.sev + '</b></div>' +
            '<div><b>Ubicación:</b> ' + pt.lat.toFixed(5) + ', ' + pt.lng.toFixed(5) + '</div>' +
            '<div><b>Riesgos observados:</b> ' + (selectedRisks.length ? selectedRisks.join(", ") : "Ninguno") + '</div>' +
            '<div><b>Identificación:</b> ' + (isAnon ? "Vecino anónimo (Datos ocultos)" : (session().name || "Ciudadano")) + '</div>' +
            '<div><b>Descripción:</b> ' + esc(desc) + '</div>';

        openModal("#reviewOv");
    };

    $("#reviewEditBtn").onclick = function () {
        $("#reviewOv").classList.remove("show");
    };

    // Envío final y confirmación (US12)
    $("#reviewSendBtn").onclick = function () {
        var t = $("#rType").value;
        var size = $("#rSize").value;
        var desc = $("#rDesc").value.trim();
        var isAnon = $("#rAnon").checked;

        var selectedRisks = [];
        if ($("#riskPlagas").checked) selectedRisks.push("🐀 Plagas/Vectores");
        if ($("#riskOlores").checked) selectedRisks.push("🦨 Malos olores");
        if ($("#riskColegio").checked) selectedRisks.push("🏫 Cerca de escuela");
        if ($("#riskSanitario").checked) selectedRisks.push("⚠️ Riesgo sanitario");

        var newCode = "GA-2026-" + Math.floor(1000 + Math.random() * 9000);
        var sUser = session();

        // Cálculo de prioridad automatizada (US34)
        var evalRes = evaluateIaSeverity();
        var autoSev = evalRes.sev;
        var autoStatus = (autoSev === "Alta") ? "c" : "p";

        var d = {
            id: nextId++,
            code: newCode,
            t: t,
            s: autoStatus,
            sev: autoSev,
            lat: pt.lat,
            lng: pt.lng,
            addr: desc || "Reporte ciudadano georreferenciado",
            eta: autoSev === "Alta" ? "Cuadrilla prioritaria en camino (urgencia sanitaria)" : "En cola para asignación municipal",
            when: "Justo ahora",
            conf: +(94 + Math.random() * 5).toFixed(1),
            photo: reportPhotoUrl || null,
            size: size,
            risks: selectedRisks,
            supports: 1,
            recurrence: 1,
            author: isAnon ? "Vecino anónimo" : (sUser.name || "Ciudadano"),
            vuln: selectedRisks.indexOf("🏫 Cerca de escuela") !== -1,
            ratings: [],
            cleanedConfirmed: 0,
            owner: sUser.mail,
            ts: Date.now()
        };

        data.unshift(d);
        store.set("ga_reports", JSON.stringify(data.filter(function (x) { return x.owner })));

        // Limpiar campos
        $("#rDesc").value = "";
        $("#rPhoto").value = "";
        reportPhotoUrl = null;
        if ($("#photoThumb")) $("#photoThumb").style.display = "none";
        $("#riskPlagas").checked = false;
        $("#riskOlores").checked = false;
        $("#riskColegio").checked = false;
        $("#riskSanitario").checked = false;
        $("#rAnon").checked = false;
        pt = null;
        if (pickMarker) { pick.removeLayer(pickMarker); pickMarker = null }

        closeAll();

        // Mostrar confirmación con código (US12)
        $("#confirmCode").textContent = newCode;
        openModal("#confirmOv");

        $("#confirmMineBtn").onclick = function () {
            closeAll();
            openMine();
        };

        filter = "all";
        $$("#tabs button").forEach(function (x) { x.classList.toggle("on", x.dataset.f === "all") });
        draw();
        select(d.id);
        toast("Reporte " + newCode + " enviado exitosamente.");
    };

    // Renderizar Actividades y Jornadas Comunitarias (US56, US58)
    var activitiesData = [
        {
            title: "Jornada de limpieza Parque San Martín",
            org: "Junta Vecinal Lince Verde",
            date: "Sábado 28 de Noviembre · 09:00 AM",
            loc: "Parque San Martín, Jr. Manuel Gómez",
            attendees: 18
        },
        {
            title: "Erradicación de desmonte en Av. Salaverry",
            org: "Colectivo Jesús María Sostenible",
            date: "Domingo 29 de Noviembre · 10:00 AM",
            loc: "Cruce Salaverry con Cuba",
            attendees: 24
        },
        {
            title: "Recuperación de áreas verdes y retiro de PET",
            org: "Red de Voluntarios Miraflores",
            date: "Sábado 5 de Diciembre · 08:30 AM",
            loc: "Malecón de la Reserva",
            attendees: 31
        }
    ];

    function renderActivities() {
        var grid = $("#actGrid");
        if (!grid) return;
        grid.innerHTML = activitiesData.map(function (act, idx) {
            return '<div class="act-card">' +
                        '<div>' +
                            '<span class="chip" style="background:#e8f7ee;color:var(--g7)">Actor comunitario certificado</span>' +
                            '<h3 style="font-size:1.15rem;margin:12px 0 6px">' + esc(act.title) + '</h3>' +
                            '<div class="act-meta">' +
                                '<span>📅 ' + esc(act.date) + '</span>' +
                            '</div>' +
                            '<small style="color:var(--mut)">📍 ' + esc(act.loc) + '<br>Convoca: <b>' + esc(act.org) + '</b></small>' +
                        '</div>' +
                        '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:18px;border-top:1px solid var(--line);padding-top:14px">' +
                            '<span style="font-size:.84rem;font-weight:700;color:var(--g7)">👥 <span id="attCount-' + idx + '">' + act.attendees + '</span> inscritos</span>' +
                            '<button class="btn btn-sm p btnAttend" data-idx="' + idx + '">Voy a asistir</button>' +
                        '</div>' +
                   '</div>';
        }).join("");

        $$(".btnAttend", grid).forEach(function (btn) {
            btn.onclick = function () {
                var idx = +this.dataset.idx;
                var countSpan = $("#attCount-" + idx);
                if (this.dataset.joined) {
                    activitiesData[idx].attendees--;
                    delete this.dataset.joined;
                    this.textContent = "Voy a asistir";
                    this.classList.add("p");
                    toast("Has cancelado tu asistencia a la jornada.");
                } else {
                    activitiesData[idx].attendees++;
                    this.dataset.joined = "true";
                    this.textContent = "✓ Asistiré";
                    this.classList.remove("p");
                    toast("¡Confirmaste tu asistencia! Te enviaremos un recordatorio 24h antes.");
                }
                countSpan.textContent = activitiesData[idx].attendees;
            };
        });
    }

    // Renderizar Ranking de Vecinos Destacados (US47)
    var rankData = [
        { name: "Valeria Soto", dist: "Cercado de Lima", reports: 28, supports: 94, badge: "Líder Vecinal de Oro" },
        { name: "Marco Rivas", dist: "San Isidro", reports: 22, supports: 78, badge: "Guardián Ambiental" },
        { name: "Camila Mendoza", dist: "Miraflores", reports: 19, supports: 65, badge: "Promotora Verde" },
        { name: "Jorge Peña", dist: "San Borja", reports: 14, supports: 51, badge: "Vecino Activo" },
        { name: "Lucía Torres", dist: "Barranco", reports: 11, supports: 42, badge: "Colaboradora Cívica" }
    ];

    function renderRanking() {
        var tbody = $("#rankBody");
        if (!tbody) return;
        var medals = ["🥇", "🥈", "🥉", "4°", "5°"];
        tbody.innerHTML = rankData.map(function (u, i) {
            return '<tr>' +
                        '<td class="medal">' + medals[i] + '</td>' +
                        '<td><b>' + esc(u.name) + '</b></td>' +
                        '<td>' + esc(u.dist) + '</td>' +
                        '<td>' + u.reports + ' reportes</td>' +
                        '<td>+' + u.supports + ' apoyos</td>' +
                        '<td><span class="chip" style="font-size:.72rem">' + esc(u.badge) + '</span></td>' +
                   '</tr>';
        }).join("");
    }

    // Contador en vivo de caracteres en descripción (Heurística #1 y #5)
    if ($("#rDesc")) {
        $("#rDesc").addEventListener("input", function () {
            if ($("#descCount")) $("#descCount").textContent = this.value.length + " / 200";
        });
    }

    // Acordeón interactivo de Preguntas Frecuentes FAQ (Heurística #10 Ayuda y Documentación)
    $$(".faq-q").forEach(function (btn) {
        btn.onclick = function () {
            var item = this.closest(".faq-item");
            var isOpen = item.classList.contains("open");
            $$(".faq-item").forEach(function (i) { i.classList.remove("open") });
            if (!isOpen) item.classList.add("open");
        };
    });

    // Revelado suave al hacer scroll (Scroll Reveal / Buenas prácticas de animación)
    var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    $$(".reveal, .steps .card, .two .card, .quotes .card, .act-card").forEach(function (el) { 
        revealObserver.observe(el); 
    });

    // Inicialización de componentes al cargar la página
    draw();
    select(1);
    renderActivities();
    renderRanking();

})();
